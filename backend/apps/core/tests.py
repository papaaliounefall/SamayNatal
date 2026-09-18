from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.events.models import Event, Gallery
from apps.orders.services import confirm_payment, create_order
from apps.photographers.models import PhotographerProfile, Wallet
from apps.photos.models import Photo

from .models import Notification
from .notifications import notify, notify_admins
from .phone import normalize_phone_e164
from .tasks import send_whatsapp_task
from .whatsapp.mock import MockWhatsAppProvider


class AdminStatsViewTests(TestCase):
    def setUp(self):
        approved_user = User.objects.create_user(email="approved@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.profile = PhotographerProfile.objects.create(
            user=approved_user, business_name="Studio", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=self.profile)

        pending_user = User.objects.create_user(email="pending@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        PhotographerProfile.objects.create(
            user=pending_user, business_name="Studio en attente", city="Dakar", country="Sénégal",
        )

        self.event = Event.objects.create(
            photographer=self.profile, title="Event", date="2026-01-01", category="mariage",
            status=Event.Status.ACTIF, default_price_per_photo_cfa=2000,
        )
        self.gallery = self.event.galleries.first() or Gallery.objects.create(event=self.event, name="Principale", is_default=True)
        self.photo = Photo.objects.create(
            event=self.event, gallery=self.gallery, original_filename="a.jpg",
            price_cfa=2000, photo_number=1, status=Photo.ProcessingStatus.READY,
        )

        self.admin = User.objects.create_user(email="stats-admin@test.com", password="TestPass123!", role=User.Role.ADMIN)
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(self.admin)

        self.photographer_client = APIClient()
        self.photographer_client.force_authenticate(approved_user)

    def test_photographer_cannot_access_stats_endpoint(self):
        response = self.photographer_client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, 403)

    def test_stats_reflect_photographer_counts(self):
        response = self.admin_client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["photographers_total"], 2)
        self.assertEqual(response.data["photographers_approved"], 1)
        self.assertEqual(response.data["photographers_pending"], 1)
        self.assertEqual(response.data["events_active"], 1)

    def test_stats_only_count_completed_orders_toward_revenue(self):
        order, provider_result = create_order(
            event=self.event, client_name="Client", client_email="client@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(self.photo.id)}],
        )
        confirm_payment(provider_reference=provider_result["provider_reference"], succeeded=True, raw_payload={})

        pending_photo = Photo.objects.create(
            event=self.event, gallery=self.gallery, original_filename="b.jpg",
            price_cfa=2000, photo_number=2, status=Photo.ProcessingStatus.READY,
        )
        create_order(
            event=self.event, client_name="Client 2", client_email="client2@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(pending_photo.id)}],
        )

        response = self.admin_client.get("/api/admin/stats/")
        self.assertEqual(response.data["orders_total"], 2)
        self.assertEqual(response.data["orders_completed"], 1)
        self.assertEqual(response.data["orders_pending"], 1)
        self.assertEqual(response.data["total_revenue_cfa"], order.total_amount_cfa)


class AdminSystemHealthViewTests(TestCase):
    """The database/cache/storage/celery checks talk to the real services
    configured for this environment (real Postgres, real MinIO, real
    Celery broker when run via `docker compose exec backend ...`) — this
    only asserts the response shape and access control, not that every
    dependency is up, so it stays meaningful even if one is briefly down."""

    def setUp(self):
        self.admin = User.objects.create_user(email="health-admin@test.com", password="TestPass123!", role=User.Role.ADMIN)
        self.photographer_user = User.objects.create_user(email="health-photog@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(self.admin)
        self.photographer_client = APIClient()
        self.photographer_client.force_authenticate(self.photographer_user)

    def test_non_admin_cannot_access_health_endpoint(self):
        response = self.photographer_client.get("/api/admin/health/")
        self.assertEqual(response.status_code, 403)

    def test_health_endpoint_reports_every_dependency(self):
        response = self.admin_client.get("/api/admin/health/")
        self.assertEqual(response.status_code, 200)
        for service in ("database", "cache", "storage", "celery"):
            self.assertIn(service, response.data["checks"])
            self.assertIn(response.data["checks"][service]["status"], ("up", "down"))
            self.assertIn("latency_ms", response.data["checks"][service])

    def test_database_check_is_up_during_a_real_test_run(self):
        # The test suite itself is proof the database is reachable.
        response = self.admin_client.get("/api/admin/health/")
        self.assertEqual(response.data["checks"]["database"]["status"], "up")


class NotificationTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(email="notif-a@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.user_b = User.objects.create_user(email="notif-b@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.admin1 = User.objects.create_user(email="notif-admin1@test.com", password="TestPass123!", role=User.Role.ADMIN)
        self.admin2 = User.objects.create_user(email="notif-admin2@test.com", password="TestPass123!", role=User.Role.ADMIN)

        self.client_a = APIClient()
        self.client_a.force_authenticate(self.user_a)

    def test_notify_admins_creates_one_notification_per_active_admin(self):
        created = notify_admins(title="Titre", body="Corps")
        self.assertEqual(len(created), 2)
        self.assertEqual(Notification.objects.filter(recipient=self.admin1).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.admin2).count(), 1)

    def test_user_only_sees_their_own_notifications(self):
        notify(recipient=self.user_a, title="Pour A")
        notify(recipient=self.user_b, title="Pour B")

        response = self.client_a.get("/api/notifications/")
        titles = {row["title"] for row in response.data["results"]}
        self.assertEqual(titles, {"Pour A"})

    def test_unread_count_reflects_only_unread(self):
        n1 = notify(recipient=self.user_a, title="Un")
        notify(recipient=self.user_a, title="Deux")

        response = self.client_a.get("/api/notifications/unread-count/")
        self.assertEqual(response.data["unread_count"], 2)

        self.client_a.post(f"/api/notifications/{n1.id}/read/")
        response = self.client_a.get("/api/notifications/unread-count/")
        self.assertEqual(response.data["unread_count"], 1)

    def test_cannot_mark_another_users_notification_as_read(self):
        n = notify(recipient=self.user_b, title="Pour B")
        response = self.client_a.post(f"/api/notifications/{n.id}/read/")
        self.assertEqual(response.status_code, 404)
        n.refresh_from_db()
        self.assertIsNone(n.read_at)

    def test_read_all_marks_every_unread_notification(self):
        notify(recipient=self.user_a, title="Un")
        notify(recipient=self.user_a, title="Deux")

        response = self.client_a.post("/api/notifications/read-all/")
        self.assertEqual(response.status_code, 204)

        unread = self.client_a.get("/api/notifications/unread-count/")
        self.assertEqual(unread.data["unread_count"], 0)


class NormalizePhoneTests(TestCase):
    def test_accepts_various_real_world_formats(self):
        expected = "+221771234567"
        self.assertEqual(normalize_phone_e164("+221771234567"), expected)
        self.assertEqual(normalize_phone_e164("221771234567"), expected)
        self.assertEqual(normalize_phone_e164("77 123 45 67"), expected)
        self.assertEqual(normalize_phone_e164("77-123-45-67"), expected)

    def test_rejects_blank_and_unparseable_input(self):
        self.assertIsNone(normalize_phone_e164(""))
        self.assertIsNone(normalize_phone_e164("   "))
        self.assertIsNone(normalize_phone_e164("not a phone number"))
        self.assertIsNone(normalize_phone_e164("123"))


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class SendWhatsAppTaskTests(TestCase):
    def setUp(self):
        MockWhatsAppProvider.sent = []

    def test_valid_phone_renders_and_records_the_message(self):
        send_whatsapp_task.delay(
            "77 123 45 67", "order_confirmed",
            {"client_name": "Aissatou", "event_title": "Mariage", "gallery_url": "https://example.com/g/mariage"},
        )
        self.assertEqual(len(MockWhatsAppProvider.sent), 1)
        sent = MockWhatsAppProvider.sent[0]
        self.assertEqual(sent["to"], "+221771234567")
        self.assertIn("Aissatou", sent["body"])
        self.assertIn("Mariage", sent["body"])

    def test_blank_phone_is_a_silent_no_op(self):
        send_whatsapp_task.delay("", "order_confirmed", {"client_name": "A", "event_title": "B", "gallery_url": "C"})
        self.assertEqual(MockWhatsAppProvider.sent, [])

    def test_unparseable_phone_is_a_silent_no_op(self):
        send_whatsapp_task.delay(
            "not a phone", "order_confirmed", {"client_name": "A", "event_title": "B", "gallery_url": "C"}
        )
        self.assertEqual(MockWhatsAppProvider.sent, [])
