import random
import string

from django.db import models

from apps.core.models import BaseModel
from apps.events.models import Event
from apps.photos.models import Photo


def generate_order_number() -> str:
    from django.utils import timezone

    suffix = "".join(random.choices(string.digits, k=6))
    return f"CMD-{timezone.now().year}-{suffix}"


class Order(BaseModel):
    class PaymentMethod(models.TextChoices):
        WAVE = "WAVE", "Wave"
        ORANGE_MONEY = "ORANGE_MONEY", "Orange Money"
        FREE_MONEY = "FREE_MONEY", "Free Money"
        CARTE_BANCAIRE = "CARTE_BANCAIRE", "Carte bancaire"

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "En attente"
        COMPLETED = "COMPLETED", "Payée"
        FAILED = "FAILED", "Échouée"
        REFUNDED = "REFUNDED", "Remboursée"

    order_number = models.CharField(max_length=30, unique=True, default=generate_order_number)
    idempotency_key = models.CharField(max_length=255, unique=True, null=True, blank=True)

    event = models.ForeignKey(Event, on_delete=models.PROTECT, related_name="orders")
    photographer = models.ForeignKey(
        "photographers.PhotographerProfile", on_delete=models.PROTECT, related_name="orders"
    )

    client_name = models.CharField(max_length=255)
    client_email = models.EmailField()
    client_phone = models.CharField(max_length=30, blank=True)

    total_amount_cfa = models.PositiveIntegerField()
    platform_commission_cfa = models.PositiveIntegerField(default=0)
    photographer_earnings_cfa = models.PositiveIntegerField(default=0)

    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)

    access_granted_until = models.DateField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["photographer", "payment_status"]),
            models.Index(fields=["client_email"]),
        ]

    def __str__(self) -> str:
        return self.order_number


class OrderItem(BaseModel):
    class ItemType(models.TextChoices):
        SINGLE = "SINGLE", "Photo unique"
        PACK = "PACK", "Pack"
        FULL_GALLERY = "FULL_GALLERY", "Galerie complète"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    photo = models.ForeignKey(Photo, null=True, blank=True, on_delete=models.SET_NULL, related_name="order_items")
    item_type = models.CharField(max_length=20, choices=ItemType.choices, default=ItemType.SINGLE)
    title_snapshot = models.CharField(max_length=255)
    price_cfa = models.PositiveIntegerField()

    def __str__(self) -> str:
        return f"{self.title_snapshot} ({self.price_cfa} CFA)"


class Payment(BaseModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        SUCCEEDED = "SUCCEEDED", "Réussi"
        FAILED = "FAILED", "Échoué"

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    provider = models.CharField(max_length=30)
    provider_reference = models.CharField(max_length=255, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    raw_webhook_payload = models.JSONField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Payment({self.order.order_number}) = {self.status}"
