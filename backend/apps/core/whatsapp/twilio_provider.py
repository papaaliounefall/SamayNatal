import requests
from django.conf import settings

from .base import WhatsAppProvider
from .templates import render_template

TWILIO_MESSAGES_URL = "https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"


class TwilioWhatsAppProvider(WhatsAppProvider):
    """Sends via Twilio's WhatsApp API as freeform text — this works
    against Twilio's Sandbox today, no Meta template approval needed.

    Production traffic outside a 24h customer-service window requires a
    Meta-approved message template. Once you have those, switch this
    call from Body= (freeform) to Twilio's Content API (ContentSid +
    ContentVariables) — the send() interface here doesn't need to
    change for callers, only this method's internals.
    """

    name = "TWILIO"

    def send(self, *, to_e164: str, template_key: str, params: dict) -> None:
        body = render_template(template_key, params)
        response = requests.post(
            TWILIO_MESSAGES_URL.format(sid=settings.TWILIO_ACCOUNT_SID),
            auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
            data={
                "From": f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}",
                "To": f"whatsapp:{to_e164}",
                "Body": body,
            },
            timeout=10,
        )
        response.raise_for_status()
