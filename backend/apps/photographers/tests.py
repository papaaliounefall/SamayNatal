from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.models import Notification

from .models import LedgerEntry, PayoutRequest, PhotographerProfile, Wallet
from .services import (
    PayoutValidationError,
    approve_payout,
    change_photographer_status,
    get_available_balance_cfa,
    register_photographer,
    reject_payout,
    request_payout,
)


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


class PhotographerRegistrationNotificationTests(TestCase):
    def test_registration_notifies_existing_admins(self):
        admin = User.objects.create_superuser(email="reg-admin@test.com", password="AdminPass123!")
        register_photographer(
            email="new-applicant@test.com", password="TestPass123!", first_name="A", last_name="B",
            phone="", business_name="Nouveau Studio", city="Dakar", country="Sénégal", bio="",
            specialties=["mariage"],
        )
        self.assertTrue(
            Notification.objects.filter(recipient=admin, title__icontains="candidature").exists()
        )


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PhotographerStatusEmailTests(TestCase):
    def setUp(self):
        self.profile = register_photographer(
            email="notify@test.com", password="TestPass123!", first_name="A", last_name="B",
            phone="77 123 45 67", business_name="Studio Notify", city="Dakar", country="Sénégal", bio="",
            specialties=["mariage"],
        )
        self.admin = User.objects.create_superuser(email="admin2@test.com", password="AdminPass123!")

    def test_approval_sends_an_email_to_the_photographer(self):
        from apps.core.whatsapp.mock import MockWhatsAppProvider

        MockWhatsAppProvider.sent = []
        with self.captureOnCommitCallbacks(execute=True):
            change_photographer_status(
                profile=self.profile, new_status=PhotographerProfile.Status.APPROUVE,
                admin_user=self.admin, reason="Portfolio vérifié",
            )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["notify@test.com"])
        self.assertIn("approuvé", mail.outbox[0].subject.lower())
        self.assertTrue(
            Notification.objects.filter(recipient=self.profile.user, title__icontains="approuvé").exists()
        )
        self.assertEqual(len(MockWhatsAppProvider.sent), 1)
        self.assertEqual(MockWhatsAppProvider.sent[0]["to"], "+221771234567")

    def test_rejection_sends_a_different_email(self):
        with self.captureOnCommitCallbacks(execute=True):
            change_photographer_status(
                profile=self.profile, new_status=PhotographerProfile.Status.REFUSE,
                admin_user=self.admin, reason="Portfolio insuffisant",
            )
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Portfolio insuffisant", mail.outbox[0].body)


def _make_approved_photographer_with_balance(email: str, business_name: str, balance_cfa: int) -> PhotographerProfile:
    user = User.objects.create_user(email=email, password="TestPass123!", role=User.Role.PHOTOGRAPHE)
    profile = PhotographerProfile.objects.create(
        user=user, business_name=business_name, city="Dakar", country="Sénégal",
        status=PhotographerProfile.Status.APPROUVE,
    )
    Wallet.objects.create(photographer=profile, balance_cfa=balance_cfa)
    return profile


class PayoutRequestServiceTests(TestCase):
    """There is no live payout API — approve_payout is the only thing
    that ever debits a wallet for a withdrawal, and only once, manually,
    after an admin has actually sent the money outside the platform."""

    def setUp(self):
        self.profile = _make_approved_photographer_with_balance("payout@test.com", "Payout Studio", 10_000)
        self.admin = User.objects.create_superuser(email="payout-admin@test.com", password="AdminPass123!")

    def test_available_balance_excludes_other_pending_requests(self):
        request_payout(photographer=self.profile, amount_cfa=4_000, method="WAVE", phone_number="+221770000000")
        self.assertEqual(get_available_balance_cfa(self.profile), 6_000)

    def test_request_payout_notifies_admins(self):
        request_payout(photographer=self.profile, amount_cfa=4_000, method="WAVE", phone_number="+221770000000")
        self.assertTrue(
            Notification.objects.filter(recipient=self.admin, title__icontains="retrait").exists()
        )

    def test_cannot_request_more_than_available_balance(self):
        with self.assertRaises(PayoutValidationError):
            request_payout(photographer=self.profile, amount_cfa=10_001, method="WAVE", phone_number="+221770000000")

    def test_cannot_double_request_the_same_funds(self):
        request_payout(photographer=self.profile, amount_cfa=6_000, method="WAVE", phone_number="+221770000000")
        with self.assertRaises(PayoutValidationError):
            request_payout(photographer=self.profile, amount_cfa=5_000, method="WAVE", phone_number="+221770000000")

    def test_approve_debits_wallet_and_writes_ledger_entry(self):
        payout = request_payout(photographer=self.profile, amount_cfa=4_000, method="WAVE", phone_number="+221770000000")
        approve_payout(payout=payout, admin_user=self.admin, note="Envoyé via Wave Business")

        self.profile.wallet.refresh_from_db()
        payout.refresh_from_db()
        self.assertEqual(self.profile.wallet.balance_cfa, 6_000)
        self.assertEqual(payout.status, PayoutRequest.Status.PAYE)
        self.assertEqual(payout.processed_by, self.admin)

        entry = LedgerEntry.objects.get(reference=str(payout.id))
        self.assertEqual(entry.entry_type, LedgerEntry.EntryType.PAYOUT)
        self.assertEqual(entry.amount_cfa, -4_000)
        self.assertEqual(entry.balance_after_cfa, 6_000)

        self.assertTrue(
            Notification.objects.filter(recipient=self.profile.user, title__icontains="Retrait effectué").exists()
        )

    def test_reject_does_not_touch_the_wallet(self):
        payout = request_payout(photographer=self.profile, amount_cfa=4_000, method="WAVE", phone_number="+221770000000")
        reject_payout(payout=payout, admin_user=self.admin, note="Numéro invalide")

        self.profile.wallet.refresh_from_db()
        payout.refresh_from_db()
        self.assertEqual(self.profile.wallet.balance_cfa, 10_000)
        self.assertEqual(payout.status, PayoutRequest.Status.REJETE)

    def test_cannot_process_an_already_processed_request(self):
        payout = request_payout(photographer=self.profile, amount_cfa=4_000, method="WAVE", phone_number="+221770000000")
        approve_payout(payout=payout, admin_user=self.admin)
        with self.assertRaises(PayoutValidationError):
            approve_payout(payout=payout, admin_user=self.admin)
        with self.assertRaises(PayoutValidationError):
            reject_payout(payout=payout, admin_user=self.admin)


class PayoutRequestEndpointTests(TestCase):
    def setUp(self):
        self.profile_a = _make_approved_photographer_with_balance("payout-a@test.com", "Studio A", 10_000)
        self.profile_b = _make_approved_photographer_with_balance("payout-b@test.com", "Studio B", 10_000)
        self.admin = User.objects.create_superuser(email="payout-admin2@test.com", password="AdminPass123!")

        self.client_a = APIClient()
        self.client_a.force_authenticate(self.profile_a.user)
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(self.admin)

    def test_photographer_can_request_a_payout(self):
        response = self.client_a.post(
            "/api/payouts/", {"amount_cfa": 3000, "method": "ORANGE_MONEY", "phone_number": "+221771234567"}, format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "EN_ATTENTE")

    def test_request_over_balance_is_rejected_with_400(self):
        response = self.client_a.post(
            "/api/payouts/", {"amount_cfa": 999_999, "method": "WAVE", "phone_number": "+221771234567"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_photographer_cannot_see_another_photographers_payouts(self):
        payout_b = request_payout(photographer=self.profile_b, amount_cfa=1000, method="WAVE", phone_number="+221770000000")
        response = self.client_a.get("/api/payouts/")
        ids = {row["id"] for row in response.data["results"]}
        self.assertNotIn(str(payout_b.id), ids)

    def test_photographer_cannot_access_admin_payout_endpoint(self):
        response = self.client_a.get("/api/admin/payouts/")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_list_and_approve_a_payout(self):
        payout = request_payout(photographer=self.profile_a, amount_cfa=2000, method="WAVE", phone_number="+221770000000")

        list_response = self.admin_client.get("/api/admin/payouts/")
        ids = {row["id"] for row in list_response.data["results"]}
        self.assertIn(str(payout.id), ids)

        approve_response = self.admin_client.post(f"/api/admin/payouts/{payout.id}/approve/", {"note": "ok"}, format="json")
        self.assertEqual(approve_response.status_code, 200)
        self.assertEqual(approve_response.data["status"], "PAYE")

    def test_photographer_cannot_approve_their_own_payout(self):
        payout = request_payout(photographer=self.profile_a, amount_cfa=2000, method="WAVE", phone_number="+221770000000")
        response = self.client_a.post(f"/api/admin/payouts/{payout.id}/approve/", {}, format="json")
        self.assertEqual(response.status_code, 403)


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PayoutEmailTests(TestCase):
    def setUp(self):
        self.profile = _make_approved_photographer_with_balance("payout-email@test.com", "Studio Email", 5_000)
        self.admin = User.objects.create_superuser(email="payout-admin3@test.com", password="AdminPass123!")

    def test_approved_payout_emails_the_photographer(self):
        from apps.core.whatsapp.mock import MockWhatsAppProvider

        MockWhatsAppProvider.sent = []
        payout = request_payout(photographer=self.profile, amount_cfa=2000, method="WAVE", phone_number="+221770000000")
        with self.captureOnCommitCallbacks(execute=True):
            approve_payout(payout=payout, admin_user=self.admin)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["payout-email@test.com"])
        self.assertIn("effectué", mail.outbox[0].subject.lower())
        self.assertEqual(len(MockWhatsAppProvider.sent), 1)
        self.assertEqual(MockWhatsAppProvider.sent[0]["to"], "+221770000000")

    def test_rejected_payout_emails_the_photographer_with_the_reason(self):
        payout = request_payout(photographer=self.profile, amount_cfa=2000, method="WAVE", phone_number="+221770000000")
        with self.captureOnCommitCallbacks(execute=True):
            reject_payout(payout=payout, admin_user=self.admin, note="Numéro de téléphone invalide")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Numéro de téléphone invalide", mail.outbox[0].body)
