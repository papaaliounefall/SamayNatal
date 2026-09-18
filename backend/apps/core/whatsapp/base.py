import abc


class WhatsAppProvider(abc.ABC):
    """Every WhatsApp integration (Twilio, or a direct Meta Cloud API
    provider later) implements this interface. Mirrors
    apps.orders.providers.PaymentProvider — nothing outside this package
    should import a specific provider's SDK directly."""

    name: str

    @abc.abstractmethod
    def send(self, *, to_e164: str, template_key: str, params: dict) -> None:
        """Send a WhatsApp message built from a named template.

        Must raise on a transient failure so the caller (a Celery task)
        can retry — never fail silently on something that might succeed
        on a second attempt.
        """
