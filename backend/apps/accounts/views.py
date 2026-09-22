from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from datetime import timedelta
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.audit import record
from apps.core.tasks import send_email_task

from .models import User
from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterClientSerializer,
    UserSerializer,
)


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    secure = getattr(settings, "AUTH_COOKIE_SECURE", True)
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=refresh_token,
        max_age=int(timedelta(days=14).total_seconds()),
        httponly=True,
        secure=secure,
        # SameSite=None is required when the frontend and backend are on
        # different sites (e.g. separate Render domains in production) —
        # a Lax cookie is never sent on the cross-site fetch() that
        # silentRefresh() makes. Browsers reject None without Secure, so
        # only use it when we're actually on HTTPS; local dev (plain
        # http://localhost) keeps Lax, which works there since frontend
        # and backend share the "localhost" site.
        samesite="None" if secure else "Lax",
        path="/api/auth/",
    )


def _tokens_for(user: User) -> RefreshToken:
    return RefreshToken.for_user(user)


class RegisterClientView(generics.CreateAPIView):
    """Public account registration for the CLIENT role only.

    Photographer sign-up is a separate, richer endpoint
    (apps.photographers) since it creates a PhotographerProfile pending
    admin review — it must never be reachable through this one.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "registration"
    serializer_class = RegisterClientSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        record(actor=user, action="INSCRIPTION_CLIENT", target=user, details=user.email, request=request)
        refresh = _tokens_for(user)
        response = Response(
            {"access": str(refresh.access_token), "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        _set_refresh_cookie(response, str(refresh))
        return response


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        password = serializer.validated_data["password"]

        try:
            candidate = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            candidate = None

        if candidate and candidate.locked_until and candidate.locked_until > timezone.now():
            return Response(
                {"detail": "Compte temporairement verrouillé suite à trop de tentatives échouées."},
                status=status.HTTP_423_LOCKED,
            )

        user = authenticate(request, username=email, password=password)

        if user is None:
            if candidate is not None:
                candidate.failed_login_attempts += 1
                if candidate.failed_login_attempts >= settings.AUTH_LOCKOUT_THRESHOLD:
                    candidate.locked_until = timezone.now() + timedelta(minutes=settings.AUTH_LOCKOUT_MINUTES)
                    candidate.failed_login_attempts = 0
                candidate.save(update_fields=["failed_login_attempts", "locked_until"])
            return Response({"detail": "Email ou mot de passe incorrect."}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({"detail": "Ce compte est désactivé."}, status=status.HTTP_403_FORBIDDEN)

        if user.failed_login_attempts or user.locked_until:
            user.failed_login_attempts = 0
            user.locked_until = None
            user.save(update_fields=["failed_login_attempts", "locked_until"])

        record(actor=user, action="CONNEXION", target=user, details=user.email, request=request)
        refresh = _tokens_for(user)
        response = Response({"access": str(refresh.access_token), "user": UserSerializer(user).data})
        _set_refresh_cookie(response, str(refresh))
        return response


class RefreshView(APIView):
    """Reads the refresh token from the HttpOnly cookie, never the body.

    Access tokens are never persisted in localStorage on the frontend
    precisely so an XSS payload can't exfiltrate a long-lived credential;
    this endpoint is how the SPA silently renews its short-lived access
    token using the cookie the browser already attaches automatically.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_NAME)
        if not raw_token:
            return Response({"detail": "Session absente ou expirée."}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(raw_token)
            if settings.SIMPLE_JWT["ROTATE_REFRESH_TOKENS"]:
                refresh.blacklist()
                user_id = refresh["user_id"]
                new_refresh = RefreshToken.for_user(User.objects.get(pk=user_id))
                access = str(new_refresh.access_token)
                response = Response({"access": access})
                _set_refresh_cookie(response, str(new_refresh))
                return response
            access = str(refresh.access_token)
            return Response({"access": access})
        except (TokenError, User.DoesNotExist):
            response = Response({"detail": "Session invalide."}, status=status.HTTP_401_UNAUTHORIZED)
            response.delete_cookie(settings.AUTH_COOKIE_NAME, path="/api/auth/")
            return response


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_NAME)
        if raw_token:
            try:
                RefreshToken(raw_token).blacklist()
            except TokenError:
                pass
        record(actor=request.user, action="DECONNEXION", target=request.user, request=request)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(settings.AUTH_COOKIE_NAME, path="/api/auth/")
        return response


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class PasswordResetRequestView(APIView):
    """Always returns the same response whether or not the email matches
    an account — confirming/denying an email's existence here is a user
    enumeration vector."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_BASE_URL}/reinitialiser-mot-de-passe/{uid}/{token}"
            send_email_task.delay(
                subject="Réinitialisation de votre mot de passe — Samay Natal",
                message=(
                    "Bonjour,\n\n"
                    "Vous avez demandé la réinitialisation de votre mot de passe.\n"
                    f"Cliquez sur ce lien pour en choisir un nouveau :\n{reset_url}\n\n"
                    "Ce lien n'est valable qu'une seule fois. Si vous n'êtes pas à l'origine "
                    "de cette demande, ignorez cet email — votre mot de passe reste inchangé."
                ),
                recipient_list=[user.email],
            )
            record(actor=user, action="DEMANDE_REINITIALISATION_MDP", target=user, request=request)

        return Response({"detail": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data["uid"]))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Lien de réinitialisation invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response(
                {"detail": "Lien de réinitialisation invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data["new_password"])
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save()

        # A password reset should end every existing session, not just
        # this request's — otherwise a stolen refresh token survives the
        # very action meant to lock the attacker out.
        for outstanding in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=outstanding)

        record(actor=user, action="REINITIALISATION_MOT_DE_PASSE", target=user, request=request)
        return Response({"detail": "Mot de passe réinitialisé avec succès."})
