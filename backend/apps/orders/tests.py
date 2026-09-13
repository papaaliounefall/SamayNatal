from django.core import mail
from django.test import TestCase, override_settings

from apps.accounts.models import User
from apps.events.models import Event, Gallery
from apps.photographers.models import PhotographerProfile, Wallet
from apps.photos.models import Photo, PhotoAccess

from .services import confirm_payment, create_order


class ConfirmPaymentTests(TestCase):
    """confirm_payment() locks the payment row with select_for_update() —
    on PostgreSQL, joining in the wallet via select_related on that same
    query fails ("FOR UPDATE cannot be applied to the nullable side of an
    outer join") because Wallet is a reverse OneToOne. SQLite doesn't
    enforce this, so this only reproduces against a real Postgres-backed
    test run (`docker compose exec backend python manage.py test`)."""

    def setUp(self):
        user = User.objects.create_user(email="p@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.profile = PhotographerProfile.objects.create(
            user=user, business_name="Studio", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=self.profile)
        self.event = Event.objects.create(
            photographer=self.profile, title="Event", date="2026-01-01", category="mariage",
            default_price_per_photo_cfa=2000,
        )
        self.gallery = self.event.galleries.first() or Gallery.objects.create(
            event=self.event, name="Principale", is_default=True
        )
        self.photo = Photo.objects.create(
            event=self.event, gallery=self.gallery, original_filename="a.jpg",
            price_cfa=2000, photo_number=1, status=Photo.ProcessingStatus.READY,
        )

    def test_confirm_payment_credits_wallet_and_grants_access(self):
        order, provider_result = create_order(
            event=self.event, client_name="Client", client_email="client@test.com",
            client_phone="", payment_method="WAVE",
            cart_items=[{"item_type": "SINGLE", "photo_id": str(self.photo.id)}],
        )

        confirmed = confirm_payment(
            provider_reference=provider_result["provider_reference"], succeeded=True, raw_payload={},
        )

        self.assertEqual(confirmed.payment_status, "COMPLETED")
        self.profile.wallet.refresh_from_db()
        self.assertEqual(self.profile.wallet.balance_cfa, confirmed.photographer_earnings_cfa)
        self.assertTrue(PhotoAccess.objects.filter(photo=self.photo, client_email="client@test.com").exists())

    def test_confirm_payment_is_idempotent(self):
        order, provider_result = create_order(
            event=self.event, client_name="Client", client_email="client@test.com",
            client_phone="", payment_method="WAVE",
            cart_items=[{"item_type": "SINGLE", "photo_id": str(self.photo.id)}],
        )
        ref = provider_result["provider_reference"]

        confirm_payment(provider_reference=ref, succeeded=True, raw_payload={})
        confirm_payment(provider_reference=ref, succeeded=True, raw_payload={})

        self.profile.wallet.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(self.profile.wallet.balance_cfa, order.photographer_earnings_cfa)


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class OrderConfirmationEmailTests(TestCase):
    def setUp(self):
        user = User.objects.create_user(email="p2@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.profile = PhotographerProfile.objects.create(
            user=user, business_name="Studio", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=self.profile)
        self.event = Event.objects.create(
            photographer=self.profile, title="Event", date="2026-01-01", category="mariage",
            default_price_per_photo_cfa=2000,
        )
        self.gallery = self.event.galleries.first() or Gallery.objects.create(
            event=self.event, name="Principale", is_default=True
        )
        self.photo = Photo.objects.create(
            event=self.event, gallery=self.gallery, original_filename="a.jpg",
            price_cfa=2000, photo_number=1, status=Photo.ProcessingStatus.READY,
        )

    def test_confirmed_payment_emails_the_client(self):
        order, provider_result = create_order(
            event=self.event, client_name="Client Test", client_email="buyer@test.com",
            client_phone="", payment_method="WAVE",
            cart_items=[{"item_type": "SINGLE", "photo_id": str(self.photo.id)}],
        )

        with self.captureOnCommitCallbacks(execute=True):
            confirm_payment(provider_reference=provider_result["provider_reference"], succeeded=True, raw_payload={})

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["buyer@test.com"])
        self.assertIn(order.order_number, mail.outbox[0].body)
        self.assertIn(f"/g/{self.event.slug}", mail.outbox[0].body)

    def test_failed_payment_sends_no_email(self):
        order, provider_result = create_order(
            event=self.event, client_name="Client Test", client_email="buyer@test.com",
            client_phone="", payment_method="WAVE",
            cart_items=[{"item_type": "SINGLE", "photo_id": str(self.photo.id)}],
        )

        with self.captureOnCommitCallbacks(execute=True):
            confirm_payment(provider_reference=provider_result["provider_reference"], succeeded=False, raw_payload={})

        self.assertEqual(len(mail.outbox), 0)
