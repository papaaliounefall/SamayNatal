import io
import logging

from django.conf import settings
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB per original


class InvalidPhotoUpload(Exception):
    pass


def validate_photo_upload(uploaded_file) -> tuple[int, int]:
    """Reject anything that isn't actually a decodable image of an
    allowed type, regardless of what extension/content-type it claims —
    trusting the client-supplied MIME type alone is how a renamed
    executable ends up served back to other users."""

    if uploaded_file.size > MAX_UPLOAD_SIZE_BYTES:
        raise InvalidPhotoUpload(
            f"Fichier trop volumineux ({uploaded_file.size} octets, max {MAX_UPLOAD_SIZE_BYTES})."
        )
    if uploaded_file.content_type not in ALLOWED_CONTENT_TYPES:
        raise InvalidPhotoUpload(f"Type de fichier non autorisé: {uploaded_file.content_type}")

    uploaded_file.seek(0)
    try:
        probe = Image.open(uploaded_file)
        probe.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise InvalidPhotoUpload("Le fichier n'est pas une image valide.") from exc

    uploaded_file.seek(0)
    image = Image.open(uploaded_file)
    width, height = image.size
    uploaded_file.seek(0)
    return width, height


def scan_for_malware(file_bytes: bytes) -> None:
    """Hook point for antivirus scanning (e.g. ClamAV via `clamd`).

    Disabled by default — no antivirus daemon ships with this project.
    Set CLAMAV_HOST in the environment and wire a real client here before
    relying on this in production; until then this is a documented gap,
    not a false guarantee.
    """
    if not getattr(settings, "CLAMAV_HOST", ""):
        logger.debug("Antivirus scanning disabled (CLAMAV_HOST not set); skipping scan_for_malware.")
        return
    raise NotImplementedError("CLAMAV_HOST is set but no ClamAV client is wired up yet.")
