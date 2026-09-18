from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.accounts.models import User
from apps.core.audit import record
from apps.core.notifications import notify, notify_admins
from apps.core.tasks import send_email_task, send_whatsapp_task

from .models import LedgerEntry, PayoutRequest, PhotographerProfile, PhotographerStatusChange, Wallet

_STATUS_WHATSAPP_TEMPLATE = {
    PhotographerProfile.Status.APPROUVE: "photographer_approved",
    PhotographerProfile.Status.REFUSE: "photographer_rejected",
    PhotographerProfile.Status.SUSPENDU: "photographer_suspended",
}

_STATUS_EMAIL_COPY = {
    PhotographerProfile.Status.APPROUVE: (
        "Votre profil photographe a été approuvé",
        "Bonne nouvelle : votre profil professionnel a été approuvé. Vous pouvez dès maintenant "
        "vous connecter et créer votre premier événement.",
    ),
    PhotographerProfile.Status.REFUSE: (
        "Votre candidature n'a pas été retenue",
        "Après examen de votre dossier, nous ne sommes pas en mesure d'activer votre profil "
        "photographe pour le moment.",
    ),
    PhotographerProfile.Status.SUSPENDU: (
        "Votre compte a été suspendu",
        "Votre compte photographe a été suspendu par l'administration. Vos événements et galeries "
        "existants restent en l'état mais ne sont plus modifiables tant que le compte est suspendu.",
    ),
}


def _notify_photographer_status_change(profile: PhotographerProfile, new_status: str, reason: str) -> None:
    copy = _STATUS_EMAIL_COPY.get(new_status)
    if not copy:
        return
    subject, body = copy
    message = f"Bonjour {profile.business_name},\n\n{body}"
    if reason:
        message += f"\n\nMotif indiqué par l'administrateur : {reason}"
    send_email_task.delay(
        subject=f"{subject} — Samay Natal",
        message=message,
        recipient_list=[profile.user.email],
    )
    template_key = _STATUS_WHATSAPP_TEMPLATE.get(new_status)
    if template_key:
        send_whatsapp_task.delay(
            profile.user.phone, template_key, {"business_name": profile.business_name, "reason": reason}
        )


@transaction.atomic
def register_photographer(*, email, password, first_name, last_name, phone, business_name, city, country, bio,
                           specialties, portfolio_url="", request=None) -> PhotographerProfile:
    user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role=User.Role.PHOTOGRAPHE,
    )
    profile = PhotographerProfile.objects.create(
        user=user,
        business_name=business_name,
        city=city,
        country=country,
        bio=bio,
        specialties=specialties,
        portfolio_url=portfolio_url,
        status=PhotographerProfile.Status.EN_ATTENTE,
        storage_max_mb=settings.SUBSCRIPTION_PLAN_LIMITS_MB["FREE"],
    )
    Wallet.objects.create(photographer=profile)
    PhotographerStatusChange.objects.create(
        photographer=profile,
        status=PhotographerProfile.Status.EN_ATTENTE,
        changed_by=None,
        reason="Dossier soumis pour examen",
    )
    record(
        actor=user,
        action="INSCRIPTION_PHOTOGRAPHE_SOUMISE",
        target=profile,
        target_label=business_name,
        request=request,
    )
    notify_admins(
        title="Nouvelle candidature photographe",
        body=f"{business_name} ({email}) a soumis son profil pour examen.",
        action_url="/admin",
    )
    return profile


@transaction.atomic
def change_photographer_status(*, profile: PhotographerProfile, new_status: str, admin_user, reason: str,
                                request=None) -> PhotographerProfile:
    previous_status = profile.status
    profile.status = new_status
    profile.save(update_fields=["status", "updated_at"])
    PhotographerStatusChange.objects.create(
        photographer=profile,
        status=new_status,
        changed_by=admin_user,
        reason=reason,
    )
    record(
        actor=admin_user,
        action=f"PHOTOGRAPHE_STATUT_{previous_status}_VERS_{new_status}",
        target=profile,
        target_label=profile.business_name,
        details=reason,
        request=request,
    )
    copy = _STATUS_EMAIL_COPY.get(new_status)
    if copy:
        notify(recipient=profile.user, title=copy[0], body=reason or copy[1], action_url="/dashboard")
    transaction.on_commit(lambda: _notify_photographer_status_change(profile, new_status, reason))
    return profile


class PayoutValidationError(Exception):
    pass


def get_available_balance_cfa(photographer: PhotographerProfile) -> int:
    """Wallet balance minus whatever is already tied up in other pending
    requests — otherwise a photographer could request the same funds
    twice before either one is processed."""
    pending_total = PayoutRequest.objects.filter(
        photographer=photographer, status=PayoutRequest.Status.EN_ATTENTE
    ).aggregate(total=Sum("amount_cfa"))["total"] or 0
    return photographer.wallet.balance_cfa - pending_total


@transaction.atomic
def request_payout(*, photographer: PhotographerProfile, amount_cfa: int, method: str, phone_number: str,
                    request=None) -> PayoutRequest:
    if amount_cfa <= 0:
        raise PayoutValidationError("Le montant doit être supérieur à zéro.")
    available = get_available_balance_cfa(photographer)
    if amount_cfa > available:
        raise PayoutValidationError(f"Montant supérieur au solde disponible ({available} CFA).")

    payout = PayoutRequest.objects.create(
        photographer=photographer, amount_cfa=amount_cfa, method=method, phone_number=phone_number,
    )
    record(
        actor=photographer.user, action="DEMANDE_RETRAIT", target=payout,
        target_label=f"{amount_cfa} CFA via {method}", request=request,
    )
    notify_admins(
        title="Nouvelle demande de retrait",
        body=f"{photographer.business_name} demande {amount_cfa} CFA via {method}.",
        action_url="/admin",
    )
    return payout


def _notify_payout_processed(payout: PayoutRequest) -> None:
    if payout.status == PayoutRequest.Status.PAYE:
        subject = "Votre retrait a été effectué"
        message = (
            f"Bonjour {payout.photographer.business_name},\n\n"
            f"Votre retrait de {payout.amount_cfa} CFA vers {payout.method} ({payout.phone_number}) a été traité."
        )
    else:
        subject = "Votre demande de retrait n'a pas été retenue"
        message = (
            f"Bonjour {payout.photographer.business_name},\n\n"
            f"Votre demande de retrait de {payout.amount_cfa} CFA n'a pas été retenue."
        )
        if payout.admin_note:
            message += f"\n\nMotif : {payout.admin_note}"
    send_email_task.delay(subject=f"{subject} — Samay Natal", message=message, recipient_list=[payout.photographer.user.email])

    template_key = "payout_approved" if payout.status == PayoutRequest.Status.PAYE else "payout_rejected"
    send_whatsapp_task.delay(
        payout.phone_number, template_key, {"amount_cfa": payout.amount_cfa, "reason": payout.admin_note}
    )


@transaction.atomic
def approve_payout(*, payout: PayoutRequest, admin_user, note: str = "", request=None) -> PayoutRequest:
    if payout.status != PayoutRequest.Status.EN_ATTENTE:
        raise PayoutValidationError("Cette demande a déjà été traitée.")

    # Lock the wallet row for the duration of the debit — mirrors the
    # same select_for_update pattern used in apps.orders.services when
    # crediting it on a sale, to avoid a race against a concurrent write.
    wallet = Wallet.objects.select_for_update().get(pk=payout.photographer.wallet.pk)
    if payout.amount_cfa > wallet.balance_cfa:
        raise PayoutValidationError("Solde du portefeuille insuffisant pour valider ce retrait.")

    wallet.balance_cfa -= payout.amount_cfa
    wallet.save(update_fields=["balance_cfa"])
    LedgerEntry.objects.create(
        wallet=wallet,
        entry_type=LedgerEntry.EntryType.PAYOUT,
        amount_cfa=-payout.amount_cfa,
        balance_after_cfa=wallet.balance_cfa,
        reference=str(payout.id),
        note=f"Retrait {payout.method} vers {payout.phone_number}",
    )

    payout.status = PayoutRequest.Status.PAYE
    payout.processed_at = timezone.now()
    payout.processed_by = admin_user
    payout.admin_note = note
    payout.save(update_fields=["status", "processed_at", "processed_by", "admin_note", "updated_at"])

    record(
        actor=admin_user, action="RETRAIT_APPROUVE", target=payout,
        target_label=f"{payout.amount_cfa} CFA — {payout.photographer.business_name}", details=note, request=request,
    )
    notify(
        recipient=payout.photographer.user, title="Retrait effectué",
        body=f"Votre retrait de {payout.amount_cfa} CFA a été traité.", action_url="/dashboard/portefeuille",
    )
    transaction.on_commit(lambda: _notify_payout_processed(payout))
    return payout


def reject_payout(*, payout: PayoutRequest, admin_user, note: str = "", request=None) -> PayoutRequest:
    if payout.status != PayoutRequest.Status.EN_ATTENTE:
        raise PayoutValidationError("Cette demande a déjà été traitée.")

    payout.status = PayoutRequest.Status.REJETE
    payout.processed_at = timezone.now()
    payout.processed_by = admin_user
    payout.admin_note = note
    payout.save(update_fields=["status", "processed_at", "processed_by", "admin_note", "updated_at"])

    record(
        actor=admin_user, action="RETRAIT_REJETE", target=payout,
        target_label=f"{payout.amount_cfa} CFA — {payout.photographer.business_name}", details=note, request=request,
    )
    notify(
        recipient=payout.photographer.user, title="Demande de retrait refusée",
        body=note or f"Votre demande de {payout.amount_cfa} CFA n'a pas été retenue.", action_url="/dashboard/portefeuille",
    )
    transaction.on_commit(lambda: _notify_payout_processed(payout))
    return payout
