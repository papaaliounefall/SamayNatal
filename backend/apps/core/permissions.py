from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == "ADMIN")


class IsApprovedPhotographer(BasePermission):
    """Only APPROUVÉ photographers may use professional features.

    EN_ATTENTE / REFUSÉ / SUSPENDU accounts can authenticate (to check their
    status) but are blocked from every write action gated behind this.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not (user and user.is_authenticated and user.role == "PHOTOGRAPHE"):
            return False
        profile = getattr(user, "photographer_profile", None)
        return bool(profile and profile.status == "APPROUVÉ")


class IsClient(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == "CLIENT")


class IsOwnerPhotographer(BasePermission):
    """Object-level check: the resource must belong to the requesting photographer.

    This is the single most important permission in the whole platform —
    it's what stops one photographer from ever reaching another's events,
    galleries, photos, orders or wallet. Every viewset touching photographer
    data must combine this with a queryset already filtered to request.user.
    """

    def has_object_permission(self, request, view, obj) -> bool:
        owner_id = getattr(obj, "photographer_id", None) or getattr(
            getattr(obj, "event", None), "photographer_id", None
        )
        return owner_id is not None and str(owner_id) == str(request.user.photographer_profile.id)


class ReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        return request.method in SAFE_METHODS
