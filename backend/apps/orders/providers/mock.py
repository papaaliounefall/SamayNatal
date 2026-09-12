import json
import uuid

from .base import InitiateResult, PaymentProvider, WebhookResult


class MockProvider(PaymentProvider):
    """Local development / demo double — NOT wired to any real payment
    network. Wave/Orange Money/Free Money/card each need their own
    provider class implementing signature verification against their
    actual webhook secret before being used with real money.
    """

    name = "MOCK"

    def initiate(self, *, order, amount_cfa: int) -> InitiateResult:
        return InitiateResult(provider_reference=f"mock_{uuid.uuid4().hex[:16]}")

    def verify_webhook(self, *, payload: bytes, headers: dict) -> WebhookResult:
        data = json.loads(payload)
        return WebhookResult(
            provider_reference=data["provider_reference"],
            succeeded=data.get("status") == "SUCCEEDED",
            raw_payload=data,
        )
