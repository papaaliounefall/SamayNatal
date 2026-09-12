from django.conf import settings

from .base import PaymentProvider
from .mock import MockProvider

_PROVIDERS = {
    "MOCK": MockProvider,
    # "WAVE": WaveProvider,           # TODO: implement once API credentials exist
    # "ORANGE_MONEY": OrangeMoneyProvider,
    # "FREE_MONEY": FreeMoneyProvider,
    # "CARTE_BANCAIRE": CardProvider,
}


def get_provider(name: str | None = None) -> PaymentProvider:
    key = (name or getattr(settings, "PAYMENT_PROVIDER", "MOCK")).upper()
    try:
        return _PROVIDERS[key]()
    except KeyError as exc:
        raise ValueError(f"Fournisseur de paiement inconnu ou non implémenté: {key}") from exc
