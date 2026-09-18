"""Single entry point for creating in-app notifications — mirrors
apps.core.audit.record() so every call site creates them the same way.

Deliberately IN_APP only for now: email already goes out from the same
service call sites that call notify() (order confirmation, status
changes, payouts) via apps.core.tasks.send_email_task — this is an
additional, faster channel, not a replacement.
"""
from apps.accounts.models import User

from .models import Notification


def notify(*, recipient: User, title: str, body: str = "", action_url: str = "") -> Notification:
    return Notification.objects.create(
        recipient=recipient, channel=Notification.Channel.IN_APP, title=title, body=body, action_url=action_url,
    )


def notify_admins(*, title: str, body: str = "", action_url: str = "") -> list[Notification]:
    admins = User.objects.filter(role=User.Role.ADMIN, is_active=True)
    return [notify(recipient=admin, title=title, body=body, action_url=action_url) for admin in admins]
