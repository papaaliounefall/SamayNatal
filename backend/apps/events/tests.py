from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.photographers.models import PhotographerProfile, Wallet

from .models import Event


def _make_approved_photographer(email: str, business_name: str) -> tuple[User, PhotographerProfile]:
    user = User.objects.create_user(email=email, password="TestPass123!", role=User.Role.PHOTOGRAPHE)
    profile = PhotographerProfile.objects.create(
        user=user, business_name=business_name, city="Dakar", country="Sénégal",
        status=PhotographerProfile.Status.APPROUVE,
    )
    Wallet.objects.create(photographer=profile)
    return user, profile


class EventTenantIsolationTests(TestCase):
    """The single most important invariant in a multi-photographer SaaS:
    photographer A must never be able to read or write photographer B's
    events through the API, no matter how the request is shaped."""

    def setUp(self):
        self.user_a, self.profile_a = _make_approved_photographer("a@test.com", "Studio A")
        self.user_b, self.profile_b = _make_approved_photographer("b@test.com", "Studio B")

        self.event_a = Event.objects.create(
            photographer=self.profile_a, title="Mariage A", date="2026-01-01", category="mariage",
        )
        self.event_b = Event.objects.create(
            photographer=self.profile_b, title="Mariage B", date="2026-01-01", category="mariage",
        )

        self.client_a = APIClient()
        self.client_a.force_authenticate(self.user_a)

    def test_event_list_only_shows_own_events(self):
        response = self.client_a.get("/api/events/")
        ids = {row["id"] for row in response.data["results"]}
        self.assertIn(str(self.event_a.id), ids)
        self.assertNotIn(str(self.event_b.id), ids)

    def test_cannot_retrieve_another_photographers_event(self):
        response = self.client_a.get(f"/api/events/{self.event_b.id}/")
        self.assertEqual(response.status_code, 404)

    def test_cannot_update_another_photographers_event(self):
        response = self.client_a.patch(f"/api/events/{self.event_b.id}/", {"title": "Hacked"}, format="json")
        self.assertEqual(response.status_code, 404)
        self.event_b.refresh_from_db()
        self.assertEqual(self.event_b.title, "Mariage B")

    def test_cannot_delete_another_photographers_event(self):
        response = self.client_a.delete(f"/api/events/{self.event_b.id}/")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Event.objects.filter(pk=self.event_b.pk).exists())


class EventPinSecurityTests(TestCase):
    def setUp(self):
        self.user, self.profile = _make_approved_photographer("pin@test.com", "PIN Studio")
        self.event = Event.objects.create(
            photographer=self.profile, title="Événement privé", date="2026-01-01",
            category="mariage", privacy="CODE_PIN",
        )
        self.event.set_pin("1234")
        self.event.save()

    def test_pin_is_never_stored_in_clear_text(self):
        self.assertNotEqual(self.event.access_pin_hash, "1234")
        self.assertTrue(self.event.access_pin_hash.startswith("pbkdf2") or "$" in self.event.access_pin_hash)

    def test_correct_pin_validates(self):
        self.assertTrue(self.event.check_pin("1234"))

    def test_wrong_pin_is_rejected(self):
        self.assertFalse(self.event.check_pin("0000"))

    def test_public_event_serializer_never_exposes_pin_hash(self):
        client = APIClient()
        response = client.get(f"/api/public/events/{self.event.slug}/")
        self.assertNotIn("access_pin_hash", response.data)
        self.assertNotIn("access_pin", response.data)
