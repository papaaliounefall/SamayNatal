from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminAuditLogViewSet, AdminPlatformSettingsView, AdminStatsView, AdminSystemHealthView, NotificationViewSet

router = DefaultRouter()
router.register("admin/audit-logs", AdminAuditLogViewSet, basename="admin-audit-log")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("admin/settings/", AdminPlatformSettingsView.as_view(), name="admin-settings"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/health/", AdminSystemHealthView.as_view(), name="admin-health"),
    path("", include(router.urls)),
]
