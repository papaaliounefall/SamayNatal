import logging

from .base import WhatsAppProvider
from .templates import render_template

logger = logging.getLogger(__name__)


class MockWhatsAppProvider(WhatsAppProvider):
    """Local development / demo double — NOT wired to any real WhatsApp
    account. Logs the rendered message instead of sending it, and keeps
    an in-memory record so tests can assert on it (same role as Django's
    mail.outbox for email)."""

    name = "MOCK"

    sent: list[dict] = []

    def send(self, *, to_e164: str, template_key: str, params: dict) -> None:
        body = render_template(template_key, params)
        MockWhatsAppProvider.sent.append({"to": to_e164, "template_key": template_key, "body": body})
        logger.info("MOCK WhatsApp -> %s [%s]: %s", to_e164, template_key, body)
