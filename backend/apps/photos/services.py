from django.db import transaction
from django.db.models import F

from apps.core.audit import record
from apps.events.models import Event, Gallery
from apps.photographers.models import PhotographerProfile

from .models import Photo
from .security import InvalidPhotoUpload, validate_photo_upload
from .tasks import process_photo


@transaction.atomic
def create_photo_from_upload(*, event: Event, gallery: Gallery, uploaded_file, uploader, title: str = "",
                              tags: list[str] | None = None, request=None) -> Photo:
    if gallery.event_id != event.id:
        raise ValueError("La galerie n'appartient pas à cet événement.")

    width, height = validate_photo_upload(uploaded_file)

    next_number = (Photo.objects.filter(event=event).count()) + 1
    photo = Photo(
        event=event,
        gallery=gallery,
        title=title,
        original_filename=uploaded_file.name,
        width=width,
        height=height,
        size_bytes=uploaded_file.size,
        price_cfa=event.default_price_per_photo_cfa,
        tags=tags or [],
        photo_number=next_number,
        status=Photo.ProcessingStatus.PROCESSING,
    )
    photo.original.save(uploaded_file.name, uploaded_file, save=False)
    photo.save()

    Event.objects.filter(pk=event.pk).update(photos_count=event.photos_count + 1)
    Gallery.objects.filter(pk=gallery.pk).update(photo_count=gallery.photo_count + 1)
    # Accounted against the original's size only — thumbnails/previews/
    # watermarked derivatives together are typically a small fraction of
    # it, and this only needs to be right enough to gate a storage quota,
    # not byte-accurate for billing.
    PhotographerProfile.objects.filter(pk=event.photographer_id).update(
        storage_used_mb=F("storage_used_mb") + uploaded_file.size // (1024 * 1024)
    )

    transaction.on_commit(lambda: process_photo.delay(str(photo.id)))

    record(
        actor=uploader,
        action="UPLOAD_PHOTO",
        target=photo,
        target_label=f"{event.title} / {uploaded_file.name}",
        request=request,
    )
    return photo


class PhotoUploadError(Exception):
    pass


def bulk_create_photos(*, event: Event, gallery: Gallery, uploaded_files, uploader, request=None) -> tuple[list[Photo], list[dict]]:
    # One fresh read for the whole batch rather than per-file: checking
    # per-file against a photographer object fetched once at the top of
    # the loop would let a batch blow through the quota, since nothing
    # in memory reflects files this same batch already accounted for.
    photographer = PhotographerProfile.objects.get(pk=event.photographer_id)
    incoming_mb = sum(f.size for f in uploaded_files) // (1024 * 1024)
    if photographer.storage_used_mb + incoming_mb > photographer.storage_max_mb:
        remaining_mb = max(0, photographer.storage_max_mb - photographer.storage_used_mb)
        message = (
            f"Quota de stockage insuffisant : {remaining_mb} Mo restants, "
            f"{incoming_mb} Mo requis pour ce lot."
        )
        return [], [{"filename": f.name, "error": message} for f in uploaded_files]

    created: list[Photo] = []
    errors: list[dict] = []
    for uploaded_file in uploaded_files:
        try:
            photo = create_photo_from_upload(
                event=event, gallery=gallery, uploaded_file=uploaded_file, uploader=uploader, request=request
            )
            created.append(photo)
        except InvalidPhotoUpload as exc:
            errors.append({"filename": uploaded_file.name, "error": str(exc)})
    return created, errors
