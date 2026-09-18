import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.photographers.models import PhotographerProfile, Wallet
from apps.photos.models import Photo

from .models import Event, Gallery


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

    def test_authenticated_client_with_completed_order_bypasses_the_pin(self):
        from apps.orders.services import confirm_payment, create_order
        from apps.photos.models import Photo

        self.event.status = Event.Status.ACTIF
        self.event.save(update_fields=["status"])
        buyer = User.objects.create_user(email="pin-buyer@test.com", password="TestPass123!", role=User.Role.CLIENT)
        gallery = self.event.galleries.first() or Gallery.objects.create(event=self.event, name="Principale", is_default=True)
        photo = Photo.objects.create(
            event=self.event, gallery=gallery, original_filename="a.jpg",
            price_cfa=2000, photo_number=1, status=Photo.ProcessingStatus.READY,
        )
        _, result = create_order(
            event=self.event, client_name="Buyer", client_email="pin-buyer@test.com", client_phone="",
            payment_method="WAVE", cart_items=[{"item_type": "SINGLE", "photo_id": str(photo.id)}],
        )
        confirm_payment(provider_reference=result["provider_reference"], succeeded=True, raw_payload={})

        client = APIClient()
        client.force_authenticate(buyer)
        response = client.get(f"/api/public/events/{self.event.slug}/")
        self.assertTrue(response.data["unlocked"])

    def test_authenticated_client_without_an_order_on_this_event_still_needs_the_pin(self):
        self.event.status = Event.Status.ACTIF
        self.event.save(update_fields=["status"])
        buyer = User.objects.create_user(email="pin-no-order@test.com", password="TestPass123!", role=User.Role.CLIENT)
        client = APIClient()
        client.force_authenticate(buyer)
        response = client.get(f"/api/public/events/{self.event.slug}/")
        self.assertFalse(response.data["unlocked"])


class EventPublishFlowTests(TestCase):
    """A newly created event defaults to BROUILLON and is not publicly
    reachable — it must be explicitly published (status -> ACTIF) before
    a client can view it. This is the exact gap the EventDetailView
    "Publier la galerie" banner exists to close."""

    def setUp(self):
        self.user, self.profile = _make_approved_photographer("publish@test.com", "Publish Studio")
        self.client_api = APIClient()
        self.client_api.force_authenticate(self.user)

    def test_new_event_defaults_to_brouillon(self):
        response = self.client_api.post(
            "/api/events/",
            {"title": "Mariage", "date": "2026-06-01", "category": "mariage", "privacy": "PUBLIC", "default_price_per_photo_cfa": 2000},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "BROUILLON")

    def test_brouillon_event_is_not_publicly_visible(self):
        event = Event.objects.create(photographer=self.profile, title="Mariage", date="2026-06-01", category="mariage")
        public_client = APIClient()
        response = public_client.get(f"/api/public/events/{event.slug}/")
        self.assertEqual(response.status_code, 404)

    def test_publishing_makes_the_event_publicly_visible(self):
        event = Event.objects.create(photographer=self.profile, title="Mariage", date="2026-06-01", category="mariage")

        patch_response = self.client_api.patch(f"/api/events/{event.id}/", {"status": "ACTIF"}, format="json")
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["status"], "ACTIF")

        public_client = APIClient()
        response = public_client.get(f"/api/public/events/{event.slug}/")
        self.assertEqual(response.status_code, 200)


class EventCoverPhotoTests(TestCase):
    """The cover photo is stored as a FK to a Photo, not a raw URL — a
    signed storage URL both expires and can overflow a plain URLField
    (see the migration removing the old cover_photo_url column). These
    cover the /set-cover/ action that replaced direct field assignment."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._media_root = tempfile.mkdtemp(prefix="samay_natal_test_media_")
        cls._override = override_settings(
            MEDIA_ROOT=cls._media_root,
            STORAGES={
                "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
                "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
            },
        )
        cls._override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._override.disable()
        shutil.rmtree(cls._media_root, ignore_errors=True)
        super().tearDownClass()

    def _make_photo(self, event: Event, gallery: Gallery) -> Photo:
        photo = Photo(event=event, gallery=gallery, original_filename="test.jpg", photo_number=1)
        buf = io.BytesIO()
        Image.new("RGB", (100, 100), color="green").save(buf, format="JPEG")
        photo.original.save("test.jpg", SimpleUploadedFile("test.jpg", buf.getvalue()), save=False)
        photo.preview.save("test.jpg", SimpleUploadedFile("test.jpg", buf.getvalue()), save=False)
        photo.save()
        return photo

    def setUp(self):
        self.user, self.profile = _make_approved_photographer("cover@test.com", "Cover Studio")
        self.event = Event.objects.create(photographer=self.profile, title="Mariage", date="2026-01-01", category="mariage")
        self.gallery = Gallery.objects.create(event=self.event, name="Principale", is_default=True)
        self.photo = self._make_photo(self.event, self.gallery)

        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_set_cover_assigns_photo_and_exposes_a_fresh_display_url(self):
        response = self.client.post(f"/api/events/{self.event.id}/set-cover/", {"photo_id": str(self.photo.id)}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["cover_photo_url"])
        self.event.refresh_from_db()
        self.assertEqual(self.event.cover_photo_id, self.photo.id)

    def test_cannot_set_cover_to_a_photo_from_a_different_event(self):
        other_event = Event.objects.create(photographer=self.profile, title="Autre", date="2026-01-01", category="mariage")
        other_gallery = Gallery.objects.create(event=other_event, name="Principale", is_default=True)
        other_photo = self._make_photo(other_event, other_gallery)

        response = self.client.post(f"/api/events/{self.event.id}/set-cover/", {"photo_id": str(other_photo.id)}, format="json")
        self.assertEqual(response.status_code, 404)
        self.event.refresh_from_db()
        self.assertIsNone(self.event.cover_photo_id)

    def test_cannot_set_cover_on_another_photographers_event(self):
        _, other_profile = _make_approved_photographer("other-cover@test.com", "Other Studio")
        other_event = Event.objects.create(photographer=other_profile, title="Autre", date="2026-01-01", category="mariage")
        other_gallery = Gallery.objects.create(event=other_event, name="Principale", is_default=True)
        other_photo = self._make_photo(other_event, other_gallery)

        response = self.client.post(f"/api/events/{other_event.id}/set-cover/", {"photo_id": str(other_photo.id)}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_public_event_serializer_exposes_cover_photo_url_once_set(self):
        self.event.status = Event.Status.ACTIF
        self.event.save(update_fields=["status"])
        self.client.post(f"/api/events/{self.event.id}/set-cover/", {"photo_id": str(self.photo.id)}, format="json")

        public_client = APIClient()
        response = public_client.get(f"/api/public/events/{self.event.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["cover_photo_url"])

    def test_public_event_serializer_returns_none_when_no_cover_set(self):
        self.event.status = Event.Status.ACTIF
        self.event.save(update_fields=["status"])

        public_client = APIClient()
        response = public_client.get(f"/api/public/events/{self.event.slug}/")
        self.assertIsNone(response.data["cover_photo_url"])
