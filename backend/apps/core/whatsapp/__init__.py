from django.conf import settings

from .base import WhatsAppProvider
from .mock import MockWhatsAppProvider
from .twilio_provider import TwilioWhatsAppProvider

_PROVIDERS = {
    "MOCK": MockWhatsAppProvider,
    "TWILIO": TwilioWhatsAppProvider,
}


def get_whatsapp_provider(name: str | None = None) -> WhatsAppProvider:
    key = (name or getattr(settings, "WHATSAPP_PROVIDER", "MOCK")).upper()
    try:
        return _PROVIDERS[key]()
    except KeyError as exc:
        raise ValueError(f"Fournisseur WhatsApp inconnu ou non implémenté: {key}") from exc
