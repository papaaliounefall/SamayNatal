from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminModerationActionViewSet, AdminReportViewSet, CreateReportView

router = DefaultRouter()
router.register("admin/reports", AdminReportViewSet, basename="admin-report")
router.register("admin/moderation-actions", AdminModerationActionViewSet, basename="admin-moderation-action")

urlpatterns = [
    path("reports/", CreateReportView.as_view(), name="create-report"),
    path("", include(router.urls)),
]
