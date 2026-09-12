from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminAuditLogViewSet, AdminPlatformSettingsView

router = DefaultRouter()
router.register("admin/audit-logs", AdminAuditLogViewSet, basename="admin-audit-log")

urlpatterns = [
    path("admin/settings/", AdminPlatformSettingsView.as_view(), name="admin-settings"),
    path("", include(router.urls)),
]
