import phonenumbers


def normalize_phone_e164(raw: str, default_region: str = "SN") -> str | None:
    """Best-effort cleanup of free-text phone numbers.

    Nothing in this project validates User.phone / Order.client_phone /
    PayoutRequest.phone_number today — they're plain CharFields, so real
    data is a mix of "+221771234567", "221771234567", "77 123 45 67",
    etc. Returns None for anything unparseable so callers can skip
    sending rather than crash on a malformed number.
    """
    if not raw or not raw.strip():
        return None
    try:
        parsed = phonenumbers.parse(raw, default_region)
    except phonenumbers.NumberParseException:
        return None
    if not phonenumbers.is_valid_number(parsed):
        return None
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
