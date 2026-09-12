import io

import qrcode
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.permissions import IsApprovedPhotographer

from .access_control import can_view_event, mark_session_unlocked
from .models import Event, Gallery
from .serializers import (
    EventSerializer,
    GallerySerializer,
    PublicEventSerializer,
    UnlockEventSerializer,
)


class EventViewSet(viewsets.ModelViewSet):
    """A photographer's own events — full CRUD, strictly scoped to them."""

    permission_classes = [IsApprovedPhotographer]
    serializer_class = EventSerializer
    filterset_fields = ["status", "category", "privacy"]
    search_fields = ["title", "location"]

    def get_queryset(self):
        return Event.objects.filter(photographer=self.request.user.photographer_profile).prefetch_related("galleries")

    @action(detail=True, methods=["get"])
    def qr_code(self, request, pk=None):
        event = self.get_object()
        public_url = f"{settings.FRONTEND_BASE_URL}/g/{event.slug}"
        img = qrcode.make(public_url)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return HttpResponse(buffer.getvalue(), content_type="image/png")


class GalleryViewSet(viewsets.ModelViewSet):
    """Galleries within one of the requester's own events."""

    permission_classes = [IsApprovedPhotographer]
    serializer_class = GallerySerializer

    def get_queryset(self):
        return Gallery.objects.filter(event__photographer=self.request.user.photographer_profile)

    def perform_create(self, serializer):
        event = get_object_or_404(
            Event, pk=self.request.data.get("event"), photographer=self.request.user.photographer_profile
        )
        serializer.save(event=event)


class PublicEventDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        event = get_object_or_404(Event.objects.select_related("photographer"), slug=slug)
        if event.status not in (Event.Status.ACTIF, Event.Status.ARCHIVE):
            return Response({"detail": "Cet événement n'est pas disponible."}, status=status.HTTP_404_NOT_FOUND)

        Event.objects.filter(pk=event.pk).update(views_count=event.views_count + 1)

        data = PublicEventSerializer(event).data
        data["unlocked"] = can_view_event(event, request)
        return Response(data)


class UnlockEventView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "gallery-unlock"

    def post(self, request, slug):
        event = get_object_or_404(Event, slug=slug)
        if event.privacy != "CODE_PIN":
            return Response({"detail": "Cet événement ne nécessite pas de code."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UnlockEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not event.check_pin(serializer.validated_data["pin"]):
            return Response({"detail": "Code incorrect."}, status=status.HTTP_403_FORBIDDEN)

        mark_session_unlocked(request, event)
        return Response({"unlocked": True})
