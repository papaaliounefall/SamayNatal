from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin

from .models import PhotographerProfile
from .serializers import (
    PhotographerAdminActionSerializer,
    PhotographerProfileSerializer,
    PhotographerRegisterSerializer,
    WalletSerializer,
)
from .services import change_photographer_status, register_photographer


class PhotographerRegisterView(APIView):
    """Public sign-up. Always creates the profile as EN_ATTENTE — a
    photographer is never auto-approved, and never created directly by an
    admin through this endpoint (see section 7 of the product spec)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "registration"

    def post(self, request):
        serializer = PhotographerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data.pop("accepted_terms")
        profile = register_photographer(request=request, **data)
        return Response(PhotographerProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class MyPhotographerProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = get_object_or_404(PhotographerProfile, user=request.user)
        return Response(PhotographerProfileSerializer(profile).data)

    def patch(self, request):
        profile = get_object_or_404(PhotographerProfile, user=request.user)
        serializer = PhotographerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MyWalletView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = get_object_or_404(PhotographerProfile, user=request.user)
        return Response(WalletSerializer(profile.wallet).data)


class AdminPhotographerViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only: review, approve, reject and suspend photographers."""

    permission_classes = [IsAdmin]
    serializer_class = PhotographerProfileSerializer
    filterset_fields = ["status"]
    search_fields = ["business_name", "city", "user__email"]

    def get_queryset(self):
        return PhotographerProfile.objects.select_related("user", "wallet").prefetch_related("status_history")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._transition(request, pk, PhotographerProfile.Status.APPROUVE)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._transition(request, pk, PhotographerProfile.Status.REFUSE)

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        return self._transition(request, pk, PhotographerProfile.Status.SUSPENDU)

    @action(detail=True, methods=["post"])
    def reinstate(self, request, pk=None):
        return self._transition(request, pk, PhotographerProfile.Status.APPROUVE)

    def _transition(self, request, pk, new_status):
        profile = self.get_object()
        serializer = PhotographerAdminActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = change_photographer_status(
            profile=profile,
            new_status=new_status,
            admin_user=request.user,
            reason=serializer.validated_data["reason"],
            request=request,
        )
        # get_object() prefetched status_history before the transition
        # above inserted a new row into it — refetch so the response
        # reflects the row we just wrote instead of the stale cache.
        profile.refresh_from_db()
        return Response(PhotographerProfileSerializer(profile).data)
