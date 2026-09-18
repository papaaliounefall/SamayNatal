from django.conf import settings
from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.audit import record
from apps.core.permissions import IsApprovedPhotographer
from apps.events.access_control import can_view_event
from apps.events.models import Event, Gallery

from .access import can_download_original
from .models import Photo
from .serializers import HDDownloadRequestSerializer, PhotoSerializer, PhotoUpdateSerializer, PublicPhotoSerializer
from .services import bulk_create_photos
from .storage import signed_url


class PhotographerPhotoViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """A photographer's own photos, across all their events.

    Deliberately no create action — creation always goes through
    PhotoUploadView, which is the only place upload validation and
    processing kick-off happen. Update is restricted to the safe,
    post-upload-editable fields (see PhotoUpdateSerializer).
    """

    permission_classes = [IsApprovedPhotographer]
    serializer_class = PhotoSerializer
    filterset_fields = ["event", "gallery", "status"]

    def get_queryset(self):
        return Photo.objects.filter(event__photographer=self.request.user.photographer_profile)

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return PhotoUpdateSerializer
        return PhotoSerializer

    def perform_update(self, serializer):
        previous_gallery = serializer.instance.gallery
        photo = serializer.save()
        if photo.gallery_id != previous_gallery.id:
            Gallery.objects.filter(pk=previous_gallery.pk).update(photo_count=max(0, previous_gallery.photo_count - 1))
            Gallery.objects.filter(pk=photo.gallery_id).update(photo_count=models.F("photo_count") + 1)
        record(actor=self.request.user, action="MODIFICATION_PHOTO", target_label=photo.title or photo.original_filename, request=self.request)

    def perform_destroy(self, instance):
        event, gallery = instance.event, instance.gallery
        instance.delete()
        Event.objects.filter(pk=event.pk).update(photos_count=max(0, event.photos_count - 1))
        Gallery.objects.filter(pk=gallery.pk).update(photo_count=max(0, gallery.photo_count - 1))
        record(actor=self.request.user, action="SUPPRESSION_PHOTO", target_label=instance.title, request=self.request)


class PhotoUploadView(APIView):
    """Bulk upload endpoint: POST multipart, field name `files` (repeatable).

    Only the owning, approved photographer may upload into their own
    event/gallery — enforced by filtering the event queryset to the
    requester rather than trusting the URL alone.
    """

    permission_classes = [IsApprovedPhotographer]
    parser_classes = [MultiPartParser]

    def post(self, request, event_id, gallery_id):
        event = get_object_or_404(Event, pk=event_id, photographer=request.user.photographer_profile)
        gallery = get_object_or_404(Gallery, pk=gallery_id, event=event)

        uploaded_files = request.FILES.getlist("files")
        if not uploaded_files:
            return Response({"detail": "Aucun fichier reçu (champ 'files' attendu)."}, status=status.HTTP_400_BAD_REQUEST)

        created, errors = bulk_create_photos(
            event=event, gallery=gallery, uploaded_files=uploaded_files, uploader=request.user, request=request
        )
        return Response(
            {
                "created": PhotoSerializer(created, many=True, context={"request": request}).data,
                "errors": errors,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST,
        )


class PublicGalleryPhotosView(APIView):
    """Anonymous/public-facing photo listing for a gallery.

    Access is re-checked here even though the gallery listing endpoint
    already filtered by event — a direct request to this URL must not
    bypass the same PUBLIC/CODE_PIN/PRIVE rule.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, event_slug, gallery_id):
        event = get_object_or_404(Event, slug=event_slug)
        if not can_view_event(event, request):
            return Response({"detail": "Accès refusé à cette galerie."}, status=status.HTTP_403_FORBIDDEN)

        gallery = get_object_or_404(Gallery, pk=gallery_id, event=event)
        photos = Photo.objects.filter(gallery=gallery, status=Photo.ProcessingStatus.READY)

        client_email = request.query_params.get("client_email") or getattr(request.user, "email", None)
        serializer = PublicPhotoSerializer(photos, many=True, context={"client_email": client_email})
        return Response(serializer.data)


class PhotoHDDownloadView(APIView):
    """Issues a short-lived signed URL to the HD original — only if a
    PhotoAccess grant exists for the given email, never based on cart or
    session state alone."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"

    def post(self, request, photo_id):
        photo = get_object_or_404(Photo, pk=photo_id)
        serializer = HDDownloadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client_email = serializer.validated_data["client_email"]

        if not can_download_original(photo, client_email):
            return Response({"detail": "Aucun droit de téléchargement pour cette photo."}, status=status.HTTP_403_FORBIDDEN)

        url = signed_url(photo.original, expire_seconds=settings.HD_DOWNLOAD_URL_EXPIRE_SECONDS)
        Event.objects.filter(pk=photo.event_id).update(downloads_count=photo.event.downloads_count + 1)
        record(actor=None, action="TELECHARGEMENT_HD", target=photo, target_label=client_email, request=request)
        return Response({"download_url": url, "expires_in": settings.HD_DOWNLOAD_URL_EXPIRE_SECONDS})
