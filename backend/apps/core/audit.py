"""Single entry point for writing audit log entries.

Services call `record()` instead of creating AuditLog rows directly so the
shape of an entry stays consistent everywhere it's written.
"""
from .models import AuditLog


def record(*, actor, action: str, target=None, target_label: str = "", details: str = "", request=None) -> AuditLog:
    actor_label = "Système"
    if actor is not None:
        actor_label = getattr(actor, "get_full_name", lambda: str(actor))() or str(actor)

    ip_address = None
    if request is not None:
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else request.META.get("REMOTE_ADDR")

    return AuditLog.objects.create(
        actor=actor if actor is not None and getattr(actor, "is_authenticated", False) else None,
        actor_label=actor_label,
        action=action,
        target_type=target.__class__.__name__ if target is not None else "",
        target_id=str(getattr(target, "id", "")) if target is not None else "",
        target_label=target_label,
        details=details,
        ip_address=ip_address,
    )
