from django.utils import timezone

from .models import Photo, PhotoAccess


def can_download_original(photo: Photo, client_email: str) -> bool:
    qs = PhotoAccess.objects.filter(photo=photo, client_email__iexact=client_email)
    now = timezone.now()
    return qs.filter(expires_at__isnull=True).exists() or qs.filter(expires_at__gt=now).exists()
