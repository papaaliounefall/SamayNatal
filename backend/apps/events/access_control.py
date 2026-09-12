from .models import ClientGalleryAccess, Event


def session_unlock_key(event_id) -> str:
    return f"unlocked_event:{event_id}"


def has_unlocked_session(request, event: Event) -> bool:
    return bool(request.session.get(session_unlock_key(event.id)))


def mark_session_unlocked(request, event: Event) -> None:
    request.session[session_unlock_key(event.id)] = True


def can_view_event(event: Event, request) -> bool:
    if event.privacy == "PUBLIC":
        return True
    if event.privacy == "CODE_PIN":
        return has_unlocked_session(request, event)
    if event.privacy == "PRIVE":
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated:
            return ClientGalleryAccess.objects.filter(event=event, client_email__iexact=user.email).exists()
        return False
    return False
