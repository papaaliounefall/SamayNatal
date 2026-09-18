from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.models import Notification
from apps.events.models import Event, Gallery
from apps.photographers.models import PhotographerProfile, Wallet
from apps.photos.models import Photo, PhotoAccess

from .services import confirm_payment, create_order, list_clients_for_photographer, list_galleries_for_client


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

        with self.captureOnCommitCallbacks(execute=True):
            confirmed = confirm_payment(
                provider_reference=provider_result["provider_reference"], succeeded=True, raw_payload={},
            )

        self.assertEqual(confirmed.payment_status, "COMPLETED")
        self.profile.wallet.refresh_from_db()
        self.assertEqual(self.profile.wallet.balance_cfa, confirmed.photographer_earnings_cfa)
        self.assertTrue(PhotoAccess.objects.filter(photo=self.photo, client_email="client@test.com").exists())
        self.assertTrue(
            Notification.objects.filter(recipient=self.profile.user, title__icontains="Nouvelle vente").exists()
        )

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

    def test_confirmed_payment_whatsapps_the_client(self):
        from apps.core.whatsapp.mock import MockWhatsAppProvider

        MockWhatsAppProvider.sent = []
        order, provider_result = create_order(
            event=self.event, client_name="Client Test", client_email="buyer@test.com",
            client_phone="77 123 45 67", payment_method="WAVE",
            cart_items=[{"item_type": "SINGLE", "photo_id": str(self.photo.id)}],
        )

        with self.captureOnCommitCallbacks(execute=True):
            confirm_payment(provider_reference=provider_result["provider_reference"], succeeded=True, raw_payload={})

        self.assertEqual(len(MockWhatsAppProvider.sent), 1)
        self.assertEqual(MockWhatsAppProvider.sent[0]["to"], "+221771234567")
        self.assertIn(self.event.title, MockWhatsAppProvider.sent[0]["body"])

    def test_failed_payment_sends_no_email(self):
        order, provider_result = create_order(
            event=self.event, client_name="Client Test", client_email="buyer@test.com",
            client_phone="", payment_method="WAVE",
            cart_items=[{"item_type": "SINGLE", "photo_id": str(self.photo.id)}],
        )

        with self.captureOnCommitCallbacks(execute=True):
            confirm_payment(provider_reference=provider_result["provider_reference"], succeeded=False, raw_payload={})

        self.assertEqual(len(mail.outbox), 0)


class AdminOrderViewSetTests(TestCase):
    """The admin order view is platform-wide by design — it must see
    every photographer's orders, but only for an actual admin."""

    def setUp(self):
        user_a = User.objects.create_user(email="seller-a@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        profile_a = PhotographerProfile.objects.create(
            user=user_a, business_name="Studio A", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=profile_a)
        event_a = Event.objects.create(photographer=profile_a, title="Event A", date="2026-01-01", category="mariage", default_price_per_photo_cfa=2000)
        gallery_a = event_a.galleries.first() or Gallery.objects.create(event=event_a, name="Principale", is_default=True)
        photo_a = Photo.objects.create(event=event_a, gallery=gallery_a, original_filename="a.jpg", price_cfa=2000, photo_number=1, status=Photo.ProcessingStatus.READY)

        user_b = User.objects.create_user(email="seller-b@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        profile_b = PhotographerProfile.objects.create(
            user=user_b, business_name="Studio B", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=profile_b)
        event_b = Event.objects.create(photographer=profile_b, title="Event B", date="2026-01-01", category="mariage", default_price_per_photo_cfa=3000)
        gallery_b = event_b.galleries.first() or Gallery.objects.create(event=event_b, name="Principale", is_default=True)
        photo_b = Photo.objects.create(event=event_b, gallery=gallery_b, original_filename="b.jpg", price_cfa=3000, photo_number=1, status=Photo.ProcessingStatus.READY)

        self.order_a, _ = create_order(
            event=event_a, client_name="Client A", client_email="client-a@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo_a.id)}],
        )
        self.order_b, _ = create_order(
            event=event_b, client_name="Client B", client_email="client-b@test.com", client_phone="",
            payment_method="ORANGE_MONEY", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo_b.id)}],
        )

        self.admin = User.objects.create_user(email="admin-orders@test.com", password="TestPass123!", role=User.Role.ADMIN)
        self.photographer_client = APIClient()
        self.photographer_client.force_authenticate(user_a)
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(self.admin)

    def test_photographer_cannot_access_admin_orders_endpoint(self):
        response = self.photographer_client.get("/api/admin/orders/")
        self.assertEqual(response.status_code, 403)

    def test_admin_sees_orders_across_all_photographers(self):
        response = self.admin_client.get("/api/admin/orders/")
        self.assertEqual(response.status_code, 200)
        order_numbers = {row["order_number"] for row in response.data["results"]}
        self.assertIn(self.order_a.order_number, order_numbers)
        self.assertIn(self.order_b.order_number, order_numbers)

    def test_admin_can_filter_by_payment_method(self):
        response = self.admin_client.get("/api/admin/orders/?payment_method=ORANGE_MONEY")
        order_numbers = {row["order_number"] for row in response.data["results"]}
        self.assertIn(self.order_b.order_number, order_numbers)
        self.assertNotIn(self.order_a.order_number, order_numbers)

    def test_admin_can_search_by_client_email(self):
        response = self.admin_client.get("/api/admin/orders/?search=client-a@test.com")
        order_numbers = {row["order_number"] for row in response.data["results"]}
        self.assertIn(self.order_a.order_number, order_numbers)
        self.assertNotIn(self.order_b.order_number, order_numbers)


class PhotographerClientListTests(TestCase):
    """The client list is derived entirely from Order rows — no separate
    Client model — so these pin down the aggregation semantics directly."""

    def setUp(self):
        user = User.objects.create_user(email="crm@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.profile = PhotographerProfile.objects.create(
            user=user, business_name="Studio", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=self.profile)
        self.event = Event.objects.create(photographer=self.profile, title="Event", date="2026-01-01", category="mariage", default_price_per_photo_cfa=2000)
        self.gallery = self.event.galleries.first() or Gallery.objects.create(event=self.event, name="Principale", is_default=True)

        other_user = User.objects.create_user(email="other-crm@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.other_profile = PhotographerProfile.objects.create(
            user=other_user, business_name="Autre Studio", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=self.other_profile)
        self.other_event = Event.objects.create(photographer=self.other_profile, title="Autre Event", date="2026-01-01", category="mariage", default_price_per_photo_cfa=2000)
        self.other_gallery = self.other_event.galleries.first() or Gallery.objects.create(event=self.other_event, name="Principale", is_default=True)

        self.client_api = APIClient()
        self.client_api.force_authenticate(user)

    def _photo(self, event, gallery, number):
        return Photo.objects.create(
            event=event, gallery=gallery, original_filename=f"{number}.jpg",
            price_cfa=2000, photo_number=number, status=Photo.ProcessingStatus.READY,
        )

    def test_aggregates_orders_by_client_email_using_most_recent_name(self):
        photo1 = self._photo(self.event, self.gallery, 1)
        photo2 = self._photo(self.event, self.gallery, 2)

        order1, result1 = create_order(
            event=self.event, client_name="Aissatou D.", client_email="aissatou@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo1.id)}],
        )
        confirm_payment(provider_reference=result1["provider_reference"], succeeded=True, raw_payload={})

        order2, _ = create_order(
            event=self.event, client_name="Aissatou Diallo", client_email="aissatou@test.com", client_phone="+221771112233",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo2.id)}],
        )

        clients = list_clients_for_photographer(self.profile)
        self.assertEqual(len(clients), 1)
        summary = clients[0]
        self.assertEqual(summary["client_email"], "aissatou@test.com")
        self.assertEqual(summary["client_name"], "Aissatou Diallo")
        self.assertEqual(summary["client_phone"], "+221771112233")
        self.assertEqual(summary["orders_count"], 2)
        self.assertEqual(summary["completed_orders_count"], 1)
        self.assertEqual(summary["total_spent_cfa"], order1.total_amount_cfa)

    def test_only_includes_this_photographers_own_clients(self):
        photo = self._photo(self.other_event, self.other_gallery, 1)
        create_order(
            event=self.other_event, client_name="Client Autre", client_email="autre@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo.id)}],
        )
        clients = list_clients_for_photographer(self.profile)
        self.assertEqual(clients, [])

    def test_endpoint_returns_the_aggregated_list(self):
        photo = self._photo(self.event, self.gallery, 1)
        create_order(
            event=self.event, client_name="Client Test", client_email="client@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo.id)}],
        )
        response = self.client_api.get("/api/clients/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["client_email"], "client@test.com")


class ClientGalleryListTests(TestCase):
    """Mirror of PhotographerClientListTests, but from the buyer's side:
    galleries grouped by event for a given client email, matched by
    login email rather than by a stored FK."""

    def setUp(self):
        user = User.objects.create_user(email="crm2@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.profile = PhotographerProfile.objects.create(
            user=user, business_name="Studio", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=self.profile)
        self.event = Event.objects.create(photographer=self.profile, title="Event", date="2026-01-01", category="mariage", default_price_per_photo_cfa=2000)
        self.gallery = self.event.galleries.first() or Gallery.objects.create(event=self.event, name="Principale", is_default=True)

        other_user = User.objects.create_user(email="other-crm2@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.other_profile = PhotographerProfile.objects.create(
            user=other_user, business_name="Autre Studio", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=self.other_profile)
        self.other_event = Event.objects.create(photographer=self.other_profile, title="Autre Event", date="2026-01-01", category="mariage", default_price_per_photo_cfa=2000)
        self.other_gallery = self.other_event.galleries.first() or Gallery.objects.create(event=self.other_event, name="Principale", is_default=True)

        self.client_user = User.objects.create_user(email="buyer@test.com", password="TestPass123!", role=User.Role.CLIENT)
        self.client_api = APIClient()
        self.client_api.force_authenticate(self.client_user)

    def _photo(self, event, gallery, number):
        return Photo.objects.create(
            event=event, gallery=gallery, original_filename=f"{number}.jpg",
            price_cfa=2000, photo_number=number, status=Photo.ProcessingStatus.READY,
        )

    def test_only_completed_orders_are_counted(self):
        photo = self._photo(self.event, self.gallery, 1)
        create_order(
            event=self.event, client_name="Buyer", client_email="buyer@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo.id)}],
        )
        galleries = list_galleries_for_client("buyer@test.com")
        self.assertEqual(galleries, [])

    def test_aggregates_by_event_for_the_matching_email(self):
        photo1 = self._photo(self.event, self.gallery, 1)
        photo2 = self._photo(self.event, self.gallery, 2)

        order1, result1 = create_order(
            event=self.event, client_name="Buyer", client_email="buyer@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo1.id)}],
        )
        confirm_payment(provider_reference=result1["provider_reference"], succeeded=True, raw_payload={})

        order2, result2 = create_order(
            event=self.event, client_name="Buyer", client_email="buyer@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo2.id)}],
        )
        confirm_payment(provider_reference=result2["provider_reference"], succeeded=True, raw_payload={})

        galleries = list_galleries_for_client("buyer@test.com")
        self.assertEqual(len(galleries), 1)
        entry = galleries[0]
        self.assertEqual(entry["event_slug"], self.event.slug)
        self.assertEqual(entry["photographer_business_name"], "Studio")
        self.assertEqual(entry["purchased_photos_count"], 2)
        self.assertEqual(entry["total_spent_cfa"], order1.total_amount_cfa + order2.total_amount_cfa)

    def test_purchases_across_two_photographers_yield_two_entries(self):
        photo1 = self._photo(self.event, self.gallery, 1)
        photo2 = self._photo(self.other_event, self.other_gallery, 1)

        _, result1 = create_order(
            event=self.event, client_name="Buyer", client_email="buyer@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo1.id)}],
        )
        confirm_payment(provider_reference=result1["provider_reference"], succeeded=True, raw_payload={})

        _, result2 = create_order(
            event=self.other_event, client_name="Buyer", client_email="buyer@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo2.id)}],
        )
        confirm_payment(provider_reference=result2["provider_reference"], succeeded=True, raw_payload={})

        galleries = list_galleries_for_client("buyer@test.com")
        self.assertEqual(len(galleries), 2)
        slugs = {g["event_slug"] for g in galleries}
        self.assertEqual(slugs, {self.event.slug, self.other_event.slug})

    def test_client_never_sees_another_clients_purchases(self):
        photo = self._photo(self.event, self.gallery, 1)
        _, result = create_order(
            event=self.event, client_name="Someone Else", client_email="someone-else@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo.id)}],
        )
        confirm_payment(provider_reference=result["provider_reference"], succeeded=True, raw_payload={})

        self.assertEqual(list_galleries_for_client("buyer@test.com"), [])

    def test_endpoint_returns_the_aggregated_list_for_the_authenticated_client(self):
        photo = self._photo(self.event, self.gallery, 1)
        _, result = create_order(
            event=self.event, client_name="Buyer", client_email="buyer@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo.id)}],
        )
        confirm_payment(provider_reference=result["provider_reference"], succeeded=True, raw_payload={})

        response = self.client_api.get("/api/client/galleries/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["event_slug"], self.event.slug)

    def test_photographer_cannot_access_the_client_galleries_endpoint(self):
        photographer_client = APIClient()
        photographer_user = User.objects.get(email="crm2@test.com")
        photographer_client.force_authenticate(photographer_user)
        response = photographer_client.get("/api/client/galleries/")
        self.assertEqual(response.status_code, 403)
