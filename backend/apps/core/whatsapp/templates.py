TEMPLATES: dict[str, str] = {
    "order_confirmed": (
        'Bonjour {client_name}, votre commande pour "{event_title}" est confirmée ! '
        "Vos photos sont disponibles ici : {gallery_url}"
    ),
    "photographer_approved": (
        "Bonne nouvelle {business_name} ! Votre profil photographe a été approuvé. "
        "Vous pouvez dès maintenant créer votre premier événement sur Samay Natal."
    ),
    "photographer_rejected": (
        "Bonjour {business_name}, votre candidature photographe n'a pas été retenue. Raison : {reason}"
    ),
    "photographer_suspended": (
        "Bonjour {business_name}, votre compte photographe a été suspendu. Raison : {reason}"
    ),
    "payout_approved": (
        "Bonjour, votre demande de retrait de {amount_cfa} CFA a été traitée et envoyée. Merci !"
    ),
    "payout_rejected": (
        "Bonjour, votre demande de retrait de {amount_cfa} CFA a été refusée. Raison : {reason}"
    ),
}


def render_template(template_key: str, params: dict) -> str:
    text = TEMPLATES[template_key]
    return text.format(**params)
