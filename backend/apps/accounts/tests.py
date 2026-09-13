from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetFlowTests(TestCase):
    def setUp(self):
        # DRF's ScopedRateThrottle state lives in the cache, which isn't
        # reset between test classes — without this, tests elsewhere that
        # also hit the "auth" scope (login, other reset tests) can exhaust
        # it before these ever run, failing with 429 depending on test order.
        cache.clear()
        self.user = User.objects.create_user(email="reset@test.com", password="OldPassword123!")
        self.client_api = APIClient()

    def test_request_does_not_reveal_whether_email_exists(self):
        known = self.client_api.post("/api/auth/password-reset/", {"email": "reset@test.com"}, format="json")
        unknown = self.client_api.post("/api/auth/password-reset/", {"email": "nobody@test.com"}, format="json")
        self.assertEqual(known.status_code, 200)
        self.assertEqual(unknown.status_code, 200)
        self.assertEqual(known.data["detail"], unknown.data["detail"])

    def test_request_sends_an_email_with_a_working_link(self):
        self.client_api.post("/api/auth/password-reset/", {"email": "reset@test.com"}, format="json")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("reinitialiser-mot-de-passe", mail.outbox[0].body)

    def test_unknown_email_sends_no_mail(self):
        self.client_api.post("/api/auth/password-reset/", {"email": "nobody@test.com"}, format="json")
        self.assertEqual(len(mail.outbox), 0)

    def _valid_uid_and_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        return uid, token

    def test_confirm_with_valid_token_changes_password(self):
        uid, token = self._valid_uid_and_token()
        response = self.client_api.post(
            "/api/auth/password-reset-confirm/",
            {"uid": uid, "token": token, "new_password": "BrandNewPassword456!"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("BrandNewPassword456!"))

    def test_confirm_with_garbage_token_is_rejected(self):
        uid, _ = self._valid_uid_and_token()
        response = self.client_api.post(
            "/api/auth/password-reset-confirm/",
            {"uid": uid, "token": "not-a-real-token", "new_password": "BrandNewPassword456!"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OldPassword123!"))

    def test_confirm_with_garbage_uid_is_rejected(self):
        response = self.client_api.post(
            "/api/auth/password-reset-confirm/",
            {"uid": "not-base64", "token": "irrelevant", "new_password": "BrandNewPassword456!"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_token_cannot_be_reused(self):
        uid, token = self._valid_uid_and_token()
        first = self.client_api.post(
            "/api/auth/password-reset-confirm/",
            {"uid": uid, "token": token, "new_password": "FirstNewPassword456!"},
            format="json",
        )
        self.assertEqual(first.status_code, 200)

        second = self.client_api.post(
            "/api/auth/password-reset-confirm/",
            {"uid": uid, "token": token, "new_password": "SecondNewPassword789!"},
            format="json",
        )
        self.assertEqual(second.status_code, 400)

    def test_confirm_blacklists_existing_refresh_tokens(self):
        # Creating a RefreshToken auto-records an OutstandingToken as long
        # as the token_blacklist app is installed (it is) — no manual setup.
        refresh = RefreshToken.for_user(self.user)
        outstanding = OutstandingToken.objects.get(jti=refresh["jti"])

        uid, token = self._valid_uid_and_token()
        self.client_api.post(
            "/api/auth/password-reset-confirm/",
            {"uid": uid, "token": token, "new_password": "BrandNewPassword456!"},
            format="json",
        )

        self.assertTrue(BlacklistedToken.objects.filter(token=outstanding).exists())
