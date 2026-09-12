from django.conf import settings
from django.db import transaction

from apps.accounts.models import User
from apps.core.audit import record

from .models import PhotographerProfile, PhotographerStatusChange, Wallet


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
    return profile
