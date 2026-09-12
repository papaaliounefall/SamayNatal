from django.db import transaction

from apps.core.audit import record
from apps.events.models import Event, Gallery

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
