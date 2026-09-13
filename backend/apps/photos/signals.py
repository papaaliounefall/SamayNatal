import logging

from django.db.models import F, Value
from django.db.models.functions import Greatest
from django.db.models.signals import post_delete
from django.dispatch import receiver

from apps.photographers.models import PhotographerProfile

from .models import Photo

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=Photo)
def delete_photo_files_and_reclaim_storage(sender, instance: Photo, **kwargs):
    """Django never deletes the files behind a FileField/ImageField on its
    own — without this, every deleted photo leaves its original, preview,
    thumbnail and watermarked copies behind in MinIO/S3 forever."""
    for field_name in ("original", "preview", "thumbnail", "watermarked"):
        field_file = getattr(instance, field_name)
        if not field_file:
            continue
        try:
            field_file.storage.delete(field_file.name)
        except Exception:  # noqa: BLE001 - a storage hiccup must not block the delete
            logger.exception("Failed to delete %s for photo %s", field_name, instance.id)

    if instance.size_bytes:
        try:
            photographer_id = instance.event.photographer_id
        except Exception:  # noqa: BLE001 - e.g. the whole Event was cascade-deleted first
            logger.warning("Could not resolve photographer for deleted photo %s; skipping storage reclaim", instance.id)
            return
        # Greatest(..., 0) rather than a plain subtraction: photos created
        # before storage accounting existed never incremented the counter,
        # so naively subtracting from them could drive it negative — and
        # PositiveBigIntegerField has a DB-level non-negative constraint.
        PhotographerProfile.objects.filter(pk=photographer_id).update(
            storage_used_mb=Greatest(F("storage_used_mb") - instance.size_bytes // (1024 * 1024), Value(0))
        )
