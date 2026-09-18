import io
import logging

from celery import shared_task
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

THUMBNAIL_MAX_SIZE = (500, 500)
# Capped well below print-usable resolution — large enough to look sharp
# browsing on a phone, small enough that a screenshot of it is a poor
# substitute for the paid original (which is never capped like this).
PREVIEW_MAX_SIZE = (1100, 1100)
JPEG_QUALITY = 85


def _resized_jpeg_bytes(image: Image.Image, max_size: tuple[int, int]) -> bytes:
    resized = image.copy()
    resized.thumbnail(max_size, Image.LANCZOS)
    buffer = io.BytesIO()
    resized.convert("RGB").save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buffer.getvalue()


def _apply_watermark(image: Image.Image, text: str, position: str, opacity: float) -> Image.Image:
    """Burns the watermark into the pixels server-side.

    This must never be a CSS/DOM overlay applied in the browser — that
    kind of "watermark" is removed by anyone who opens devtools. Only the
    image bytes we generate here are what a client without a purchase
    ever receives.
    """
    base = image.convert("RGBA")
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_size = max(18, base.width // 25)
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except OSError:
        font = ImageFont.load_default()

    alpha = max(0, min(255, int(opacity * 255)))
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]

    positions = {
        "center": ((base.width - text_w) / 2, (base.height - text_h) / 2),
        "bottom-right": (base.width - text_w - 24, base.height - text_h - 24),
        "bottom-left": (24, base.height - text_h - 24),
        "top-right": (base.width - text_w - 24, 24),
    }

    if position == "tile":
        step_x, step_y = text_w + 120, text_h + 120
        for y in range(0, base.height, step_y):
            for x in range(0, base.width, step_x):
                draw.text((x, y), text, font=font, fill=(255, 255, 255, alpha))
    else:
        x, y = positions.get(position, positions["center"])
        draw.text((x, y), text, font=font, fill=(255, 255, 255, alpha))

    return Image.alpha_composite(base, overlay).convert("RGB")


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_photo(self, photo_id: str) -> None:
    from .models import Photo

    try:
        photo = Photo.objects.select_related("event").get(pk=photo_id)
    except Photo.DoesNotExist:
        logger.warning("process_photo: photo %s no longer exists", photo_id)
        return

    try:
        with photo.original.open("rb") as f:
            source = Image.open(f)
            source.load()

        photo.width, photo.height = source.size

        thumb_bytes = _resized_jpeg_bytes(source, THUMBNAIL_MAX_SIZE)
        preview_bytes = _resized_jpeg_bytes(source, PREVIEW_MAX_SIZE)

        preview_image = Image.open(io.BytesIO(preview_bytes))
        event = photo.event
        if event.watermark_enabled and event.watermark_text:
            watermarked_image = _apply_watermark(
                preview_image, event.watermark_text, event.watermark_position, event.watermark_opacity
            )
            wm_buffer = io.BytesIO()
            watermarked_image.save(wm_buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
            photo.watermarked.save(f"{photo.id}.jpg", ContentFile(wm_buffer.getvalue()), save=False)

        photo.thumbnail.save(f"{photo.id}.jpg", ContentFile(thumb_bytes), save=False)
        photo.preview.save(f"{photo.id}.jpg", ContentFile(preview_bytes), save=False)
        photo.status = Photo.ProcessingStatus.READY
        photo.processing_error = ""
        photo.save()
    except Exception as exc:  # noqa: BLE001 - any failure must not crash the worker
        logger.exception("process_photo failed for %s", photo_id)
        photo.status = Photo.ProcessingStatus.FAILED
        photo.processing_error = str(exc)[:2000]
        photo.save(update_fields=["status", "processing_error"])
        raise self.retry(exc=exc)
