from django.db import transaction

from apps.core.audit import record

from .models import Subscription, SubscriptionPlan


@transaction.atomic
def change_plan(*, profile, plan: SubscriptionPlan, actor, request=None) -> Subscription:
    subscription, _ = Subscription.objects.update_or_create(
        photographer=profile,
        defaults={"plan": plan, "status": Subscription.Status.ACTIVE},
    )
    profile.subscription_plan = plan.code
    profile.storage_max_mb = plan.storage_limit_mb
    profile.save(update_fields=["subscription_plan", "storage_max_mb", "updated_at"])
    record(actor=actor, action="CHANGEMENT_ABONNEMENT", target=profile, target_label=plan.name, request=request)
    return subscription
