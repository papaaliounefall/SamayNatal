from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.core.audit import record
from apps.events.models import Event
from apps.photographers.models import LedgerEntry, Wallet
from apps.photos.models import Photo, PhotoAccess

from .models import Order, OrderItem, Payment
from .providers import get_provider


class CartValidationError(Exception):
    pass


def _resolve_cart(event: Event, cart_items: list[dict]) -> list[dict]:
    """Expands the cart (grouped by purchase type) into one priced row per
    photo. Keeping OrderItem always tied to exactly one photo keeps the
    HD-access grant on confirmation a simple 1:1 mapping instead of a
    second layer of bookkeeping."""

    rows: list[dict] = []
    for group in cart_items:
        item_type = group.get("item_type")

        if item_type == "SINGLE":
            photo_id = group.get("photo_id")
            photo = Photo.objects.filter(pk=photo_id, event=event).first()
            if not photo:
                raise CartValidationError(f"Photo introuvable dans cet événement: {photo_id}")
            rows.append({"photo": photo, "item_type": "SINGLE", "price_cfa": photo.price_cfa})

        elif item_type == "PACK":
            photo_ids = group.get("photo_ids") or []
            photos = list(Photo.objects.filter(pk__in=photo_ids, event=event))
            if len(photos) != len(photo_ids) or not photos:
                raise CartValidationError("Un ou plusieurs photos du pack sont introuvables dans cet événement.")
            pack_price = event.pack_price_cfa or 0
            rows.extend(_split_price_across(photos, pack_price, "PACK"))

        elif item_type == "FULL_GALLERY":
            photos = list(Photo.objects.filter(event=event, status=Photo.ProcessingStatus.READY))
            if not photos:
                raise CartValidationError("Aucune photo prête dans cet événement.")
            full_price = event.full_gallery_price_cfa or 0
            rows.extend(_split_price_across(photos, full_price, "FULL_GALLERY"))

        else:
            raise CartValidationError(f"Type d'article inconnu: {item_type}")

    if not rows:
        raise CartValidationError("Le panier est vide.")
    return rows


def _split_price_across(photos: list[Photo], total_price_cfa: int, item_type: str) -> list[dict]:
    count = len(photos)
    base = total_price_cfa // count
    remainder = total_price_cfa - base * count
    rows = []
    for index, photo in enumerate(photos):
        price = base + (remainder if index == count - 1 else 0)
        rows.append({"photo": photo, "item_type": item_type, "price_cfa": price})
    return rows


@transaction.atomic
def create_order(*, event: Event, client_name: str, client_email: str, client_phone: str, payment_method: str,
                  cart_items: list[dict], idempotency_key: str | None = None, request=None) -> tuple[Order, dict]:
    if idempotency_key:
        existing = Order.objects.filter(idempotency_key=idempotency_key).select_related("payment").first()
        if existing:
            return existing, {"provider_reference": existing.payment.provider_reference, "reused": True}

    rows = _resolve_cart(event, cart_items)
    total_amount_cfa = sum(row["price_cfa"] for row in rows)
    commission_rate = settings.PLATFORM_COMMISSION_RATE
    platform_commission_cfa = round(total_amount_cfa * commission_rate)
    photographer_earnings_cfa = total_amount_cfa - platform_commission_cfa

    order = Order.objects.create(
        event=event,
        photographer=event.photographer,
        client_name=client_name,
        client_email=client_email,
        client_phone=client_phone,
        total_amount_cfa=total_amount_cfa,
        platform_commission_cfa=platform_commission_cfa,
        photographer_earnings_cfa=photographer_earnings_cfa,
        payment_method=payment_method,
        payment_status=Order.PaymentStatus.PENDING,
        idempotency_key=idempotency_key,
    )
    OrderItem.objects.bulk_create(
        [
            OrderItem(order=order, photo=row["photo"], item_type=row["item_type"],
                      title_snapshot=row["photo"].title or row["photo"].original_filename,
                      price_cfa=row["price_cfa"])
            for row in rows
        ]
    )

    # `payment_method` only records which local option the client picked —
    # it doesn't select the provider implementation. Today that's always
    # the configured PAYMENT_PROVIDER (MOCK), since Wave/Orange Money/Free
    # Money/card each need their own real integration (see apps/orders/providers/).
    provider = get_provider()
    result = provider.initiate(order=order, amount_cfa=total_amount_cfa)
    Payment.objects.create(order=order, provider=provider.name, provider_reference=result.provider_reference)

    record(actor=None, action="COMMANDE_CREEE", target=order, target_label=order.order_number, request=request)
    return order, {"provider_reference": result.provider_reference, "redirect_url": result.redirect_url}


@transaction.atomic
def confirm_payment(*, provider_reference: str, succeeded: bool, raw_payload: dict) -> Order:
    """The only path that ever marks an order paid and credits a wallet.

    Called exclusively from a verified provider webhook (see
    apps.orders.views.PaymentWebhookView) — never from anything the client
    controls directly. Idempotent: replays of the same webhook are a no-op
    once the order is already COMPLETED.
    """
    payment = Payment.objects.select_for_update().select_related("order", "order__photographer__wallet").get(
        provider_reference=provider_reference
    )
    payment.raw_webhook_payload = raw_payload

    if payment.order.payment_status == Order.PaymentStatus.COMPLETED:
        payment.save(update_fields=["raw_webhook_payload"])
        return payment.order

    if not succeeded:
        payment.status = Payment.Status.FAILED
        payment.save()
        payment.order.payment_status = Order.PaymentStatus.FAILED
        payment.order.save(update_fields=["payment_status"])
        return payment.order

    order = payment.order
    payment.status = Payment.Status.SUCCEEDED
    payment.confirmed_at = timezone.now()
    payment.save()

    order.payment_status = Order.PaymentStatus.COMPLETED
    order.access_granted_until = (timezone.now() + timezone.timedelta(days=365)).date()
    order.save(update_fields=["payment_status", "access_granted_until"])

    wallet = Wallet.objects.select_for_update().get(photographer=order.photographer)
    wallet.balance_cfa += order.photographer_earnings_cfa
    wallet.save(update_fields=["balance_cfa"])
    LedgerEntry.objects.create(
        wallet=wallet,
        entry_type=LedgerEntry.EntryType.SALE_CREDIT,
        amount_cfa=order.photographer_earnings_cfa,
        balance_after_cfa=wallet.balance_cfa,
        reference=order.order_number,
        note=f"Vente {order.order_number} (commission {order.platform_commission_cfa} CFA déduite)",
    )

    for item in order.items.select_related("photo").all():
        if item.photo is not None:
            PhotoAccess.objects.get_or_create(
                photo=item.photo, client_email=order.client_email, order_item=item,
                defaults={"expires_at": None},
            )

    record(actor=None, action="PAIEMENT_VALIDE", target=order, target_label=order.order_number,
           details=f"{order.total_amount_cfa} CFA via {order.payment_method}")
    return order
