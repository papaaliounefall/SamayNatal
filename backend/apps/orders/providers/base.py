import abc
from dataclasses import dataclass


@dataclass
class InitiateResult:
    provider_reference: str
    redirect_url: str | None = None


@dataclass
class WebhookResult:
    provider_reference: str
    succeeded: bool
    raw_payload: dict


class PaymentProvider(abc.ABC):
    """Every payment integration (Wave, Orange Money, Free Money, card...)
    implements this interface. Nothing in apps.orders should import a
    specific provider's SDK directly — that coupling is exactly what made
    swapping/adding a payment method risky in a single-provider design."""

    name: str

    @abc.abstractmethod
    def initiate(self, *, order, amount_cfa: int) -> InitiateResult:
        """Start a payment with the provider for this order."""

    @abc.abstractmethod
    def verify_webhook(self, *, payload: bytes, headers: dict) -> WebhookResult:
        """Verify the provider's signature and normalize its callback.

        Must raise on an invalid/unverifiable signature — a webhook is the
        only source of truth for "did the money actually arrive", so a
        provider implementation that can't cryptographically verify its
        sender is not safe to trust here.
        """
