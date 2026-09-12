from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User

from .models import PhotographerProfile, Wallet
from .services import change_photographer_status, register_photographer


class PhotographerApprovalGateTests(TestCase):
    """A photographer must be APPROUVÉ before touching any professional
    feature — EN_ATTENTE/REFUSÉ/SUSPENDU accounts can log in (to check
    their status) but must be blocked from writes."""

    def setUp(self):
        self.profile = register_photographer(
            email="new@test.com", password="TestPass123!", first_name="Nouveau", last_name="Photographe",
            phone="", business_name="Nouveau Studio", city="Dakar", country="Sénégal", bio="",
            specialties=["mariage"],
        )
        self.client_api = APIClient()
        self.client_api.force_authenticate(self.profile.user)

    def test_pending_photographer_cannot_create_event(self):
        response = self.client_api.post(
            "/api/events/", {"title": "Test", "date": "2026-01-01", "category": "mariage"}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_pending_photographer_can_still_read_own_profile(self):
        response = self.client_api.get("/api/photographers/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "EN_ATTENTE")

    def test_approved_photographer_can_create_event(self):
        admin = User.objects.create_superuser(email="admin@test.com", password="AdminPass123!")
        change_photographer_status(
            profile=self.profile, new_status=PhotographerProfile.Status.APPROUVE,
            admin_user=admin, reason="Test approval",
        )
        response = self.client_api.post(
            "/api/events/", {"title": "Test", "date": "2026-01-01", "category": "mariage"}, format="json"
        )
        self.assertEqual(response.status_code, 201)

    def test_suspended_photographer_loses_access_immediately(self):
        admin = User.objects.create_superuser(email="admin@test.com", password="AdminPass123!")
        change_photographer_status(
            profile=self.profile, new_status=PhotographerProfile.Status.APPROUVE, admin_user=admin, reason="ok",
        )
        change_photographer_status(
            profile=self.profile, new_status=PhotographerProfile.Status.SUSPENDU, admin_user=admin, reason="fraude",
        )
        response = self.client_api.post(
            "/api/events/", {"title": "Test", "date": "2026-01-01", "category": "mariage"}, format="json"
        )
        self.assertEqual(response.status_code, 403)


class AdminEndpointAccessTests(TestCase):
    def setUp(self):
        user = User.objects.create_user(email="p@test.com", password="TestPass123!", role=User.Role.PHOTOGRAPHE)
        self.profile = PhotographerProfile.objects.create(
            user=user, business_name="Studio", city="Dakar", country="Sénégal",
            status=PhotographerProfile.Status.EN_ATTENTE,
        )
        Wallet.objects.create(photographer=self.profile)
        self.photographer_client = APIClient()
        self.photographer_client.force_authenticate(user)

    def test_photographer_cannot_access_admin_review_endpoint(self):
        response = self.photographer_client.get("/api/admin/photographers/")
        self.assertEqual(response.status_code, 403)

    def test_photographer_cannot_self_approve(self):
        response = self.photographer_client.post(f"/api/admin/photographers/{self.profile.id}/approve/")
        self.assertIn(response.status_code, (403, 404))
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.status, PhotographerProfile.Status.EN_ATTENTE)
