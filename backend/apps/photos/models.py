from django.db import models

from apps.core.models import BaseModel
from apps.events.models import Event, Gallery


def _upload_path(instance: "Photo", variant: str, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    return (
        f"{instance.event.photographer_id}/events/{instance.event_id}/{variant}/"
        f"{instance.id}.{ext}"
    )


def original_upload_path(instance, filename):
    return _upload_path(instance, "originals", filename)


def preview_upload_path(instance, filename):
    return _upload_path(instance, "previews", filename)


def thumbnail_upload_path(instance, filename):
    return _upload_path(instance, "thumbnails", filename)


def watermarked_upload_path(instance, filename):
    return _upload_path(instance, "watermarked", filename)


class Photo(BaseModel):
    class ProcessingStatus(models.TextChoices):
        PROCESSING = "PROCESSING", "En traitement"
        READY = "READY", "Prête"
        FAILED = "FAILED", "Échec du traitement"
        QUARANTINED = "QUARANTINED", "En quarantaine"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="photos")
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name="photos")

    title = models.CharField(max_length=255, blank=True)
    original_filename = models.CharField(max_length=255)

    # Original is private and never served directly to a browser — only
    # through a signed URL and only to someone with the right (see
    # apps.photos.access). Previews/thumbnails/watermarked are what the
    # gallery UI actually renders.
    # Default max_length (100) is too short for {photographer_uuid}/events/
    # {event_uuid}/{variant}/{photo_uuid}.ext — that alone is ~110 chars
    # before django-storages' de-duplication suffix.
    original = models.FileField(upload_to=original_upload_path, max_length=300)
    preview = models.ImageField(upload_to=preview_upload_path, max_length=300, blank=True)
    thumbnail = models.ImageField(upload_to=thumbnail_upload_path, max_length=300, blank=True)
    watermarked = models.ImageField(upload_to=watermarked_upload_path, max_length=300, blank=True)

    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)
    size_bytes = models.PositiveBigIntegerField(default=0)

    price_cfa = models.PositiveIntegerField(default=0)
    tags = models.JSONField(default=list, blank=True)
    photo_number = models.PositiveIntegerField()

    status = models.CharField(max_length=20, choices=ProcessingStatus.choices, default=ProcessingStatus.PROCESSING)
    processing_error = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["event", "gallery"]),
            models.Index(fields=["event", "photo_number"]),
        ]
        ordering = ["photo_number"]

    def __str__(self) -> str:
        return self.title or self.original_filename


class PhotoAccess(BaseModel):
    """Grants a specific client the right to download one photo's HD
    original — created once an order line item is paid. Checked on every
    download request; never inferred from anything else (e.g. cart state)."""

    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name="grants")
    client_email = models.EmailField()
    order_item = models.ForeignKey(
        "orders.OrderItem", null=True, blank=True, on_delete=models.SET_NULL, related_name="photo_accesses"
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["photo", "client_email"])]

    def __str__(self) -> str:
        return f"{self.client_email} -> {self.photo}"
