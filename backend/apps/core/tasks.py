from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


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
