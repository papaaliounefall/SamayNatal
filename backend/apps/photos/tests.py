import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.events.models import Event, Gallery
from apps.photographers.models import PhotographerProfile, Wallet

from .access import can_download_original
from .models import Photo, PhotoAccess
from .security import InvalidPhotoUpload, validate_photo_upload


def _make_approved_photographer() -> tuple[User, PhotographerProfile]:
    user = User.objects.create_user(email="p@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
    profile = PhotographerProfile.objects.create(
        user=user, business_name="Studio", city="Dakar", country="Sénégal",
        status=PhotographerProfile.Status.APPROUVE,
    )
    Wallet.objects.create(photographer=profile)
    return user, profile


def _make_event_and_gallery(profile: PhotographerProfile) -> tuple[Event, Gallery]:
    event = Event.objects.create(photographer=profile, title="Event", date="2026-01-01", category="mariage")
    gallery = event.galleries.first() or Gallery.objects.create(event=event, name="Principale", is_default=True)
    return event, gallery


class TempMediaTestCase(TestCase):
    """Any test that saves a real file to a FileField must neither write
    into the developer's actual backend/media/ directory nor depend on a
    real S3/MinIO bucket existing — the test suite must pass identically
    whether it's run locally, in Docker, or in CI with no bucket set up."""

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


def _make_photo(event: Event, gallery: Gallery, price_cfa: int = 2000) -> Photo:
    photo = Photo(
        event=event, gallery=gallery, original_filename="test.jpg", price_cfa=price_cfa, photo_number=1,
    )
    buf = io.BytesIO()
    Image.new("RGB", (100, 100), color="red").save(buf, format="JPEG")
    photo.original.save("test.jpg", SimpleUploadedFile("test.jpg", buf.getvalue()), save=False)
    photo.save()
    return photo


class HDDownloadAccessTests(TempMediaTestCase):
    """The HD original must only ever be reachable by someone who
    actually has a PhotoAccess grant — never by cart state, session
    state, or anything the client alone controls."""

    def setUp(self):
        _, self.profile = _make_approved_photographer()
        self.event, self.gallery = _make_event_and_gallery(self.profile)
        self.photo = _make_photo(self.event, self.gallery)

    def test_no_access_without_grant(self):
        self.assertFalse(can_download_original(self.photo, "client@test.com"))

    def test_access_granted_after_purchase_grant_created(self):
        PhotoAccess.objects.create(photo=self.photo, client_email="client@test.com")
        self.assertTrue(can_download_original(self.photo, "client@test.com"))

    def test_grant_is_scoped_to_the_purchasing_email_only(self):
        PhotoAccess.objects.create(photo=self.photo, client_email="client@test.com")
        self.assertFalse(can_download_original(self.photo, "someone-else@test.com"))

    def test_download_endpoint_refuses_without_grant(self):
        client = APIClient()
        response = client.post(
            f"/api/photos/{self.photo.id}/download/", {"client_email": "client@test.com"}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_download_endpoint_succeeds_with_grant(self):
        PhotoAccess.objects.create(photo=self.photo, client_email="client@test.com")
        client = APIClient()
        response = client.post(
            f"/api/photos/{self.photo.id}/download/", {"client_email": "client@test.com"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("download_url", response.data)


class PhotoUploadValidationTests(TestCase):
    """Never trust a client-supplied filename/content-type alone — the
    bytes must actually decode as one of the allowed image formats."""

    def _jpeg_bytes(self) -> bytes:
        buf = io.BytesIO()
        Image.new("RGB", (100, 100), color="blue").save(buf, format="JPEG")
        return buf.getvalue()

    def test_valid_jpeg_is_accepted(self):
        upload = SimpleUploadedFile("photo.jpg", self._jpeg_bytes(), content_type="image/jpeg")
        width, height = validate_photo_upload(upload)
        self.assertEqual((width, height), (100, 100))

    def test_renamed_non_image_is_rejected_despite_jpeg_extension(self):
        fake = SimpleUploadedFile("malware.jpg", b"not actually an image", content_type="image/jpeg")
        with self.assertRaises(InvalidPhotoUpload):
            validate_photo_upload(fake)

    def test_disallowed_content_type_is_rejected(self):
        upload = SimpleUploadedFile("photo.gif", self._jpeg_bytes(), content_type="image/gif")
        with self.assertRaises(InvalidPhotoUpload):
            validate_photo_upload(upload)


class PhotographerPhotoIsolationTests(TempMediaTestCase):
    def setUp(self):
        self.user_a, self.profile_a = _make_approved_photographer()
        self.event_a, self.gallery_a = _make_event_and_gallery(self.profile_a)
        self.photo_a = _make_photo(self.event_a, self.gallery_a)

        user_b = User.objects.create_user(email="b@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.profile_b = PhotographerProfile.objects.create(
            user=user_b, business_name="Studio B", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.APPROUVE,
        )
        Wallet.objects.create(photographer=self.profile_b)

        self.client_b = APIClient()
        self.client_b.force_authenticate(user_b)

    def test_photographer_cannot_list_another_photographers_photos(self):
        response = self.client_b.get("/api/photos/")
        ids = {row["id"] for row in response.data["results"]}
        self.assertNotIn(str(self.photo_a.id), ids)

    def test_photographer_cannot_delete_another_photographers_photo(self):
        response = self.client_b.delete(f"/api/photos/{self.photo_a.id}/")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Photo.objects.filter(pk=self.photo_a.pk).exists())
