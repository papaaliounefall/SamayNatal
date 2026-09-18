import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

from .phone import normalize_phone_e164

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_email_task(self, subject: str, message: str, recipient_list: list[str]) -> None:
    """The one place anything in this project sends an email — so
    swapping the real SMTP provider in later is a settings change, not a
    hunt through every feature that happens to notify someone."""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001 - transient SMTP errors should retry
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_whatsapp_task(self, phone_raw: str, template_key: str, params: dict) -> None:
    """The one place anything in this project sends a WhatsApp message —
    mirrors send_email_task above. Phone numbers stored today are
    unvalidated free text, so an unparseable one is a silent no-op
    (logged, not retried) rather than a task failure."""
    from .whatsapp import get_whatsapp_provider

    to_e164 = normalize_phone_e164(phone_raw)
    if not to_e164:
        logger.warning("send_whatsapp_task: unusable phone number %r, skipping", phone_raw)
        return
    try:
        get_whatsapp_provider().send(to_e164=to_e164, template_key=template_key, params=params)
    except Exception as exc:  # noqa: BLE001 - transient provider errors should retry
        raise self.retry(exc=exc)
