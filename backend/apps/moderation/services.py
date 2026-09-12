from django.db import transaction

from apps.core.audit import record
from apps.events.models import Event
from apps.photographers.models import PhotographerProfile
from apps.photos.models import Photo

from .models import ModerationAction, Report, TargetType


@transaction.atomic
def apply_action(*, report: Report | None, admin_user, action_type: str, target_type: str, target_id, notes: str,
                  request=None) -> ModerationAction:
    if action_type == ModerationAction.ActionType.SUPPRESSION_PHOTO and target_type == TargetType.PHOTO:
        Photo.objects.filter(pk=target_id).delete()
    elif action_type == ModerationAction.ActionType.SUSPENSION_EVENEMENT and target_type == TargetType.EVENT:
        Event.objects.filter(pk=target_id).update(status=Event.Status.SUSPENDU)
    elif action_type == ModerationAction.ActionType.SUSPENSION_PHOTOGRAPHE and target_type == TargetType.PHOTOGRAPHER:
        PhotographerProfile.objects.filter(pk=target_id).update(status=PhotographerProfile.Status.SUSPENDU)

    action = ModerationAction.objects.create(
        report=report, admin=admin_user, action_type=action_type,
        target_type=target_type, target_id=target_id, notes=notes,
    )
    if report is not None:
        report.status = Report.Status.RESOLU if action_type != ModerationAction.ActionType.REJET_SIGNALEMENT else Report.Status.REJETE
        report.save(update_fields=["status", "updated_at"])

    record(actor=admin_user, action=f"MODERATION_{action_type}", target_label=str(target_id), details=notes, request=request)
    return action
