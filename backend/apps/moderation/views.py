from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.notifications import notify_admins
from apps.core.permissions import IsAdmin

from .models import ModerationAction, Report
from .serializers import ApplyActionSerializer, CreateReportSerializer, ModerationActionSerializer, ReportSerializer
from .services import apply_action


class CreateReportView(APIView):
    """Public: anyone (client or visitor) can flag a photo/event/photographer."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"  # same conservative rate as other public write endpoints

    def post(self, request):
        serializer = CreateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        notify_admins(
            title="Nouveau signalement",
            body=f"{report.get_reason_display()} — {report.target_label or report.target_type}",
            action_url="/admin",
        )
        return Response(ReportSerializer(report).data, status=201)


class AdminReportViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = ReportSerializer
    filterset_fields = ["status", "target_type", "reason"]

    def get_queryset(self):
        return Report.objects.all()

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        report = self.get_object()
        serializer = ApplyActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        apply_action(
            report=report,
            admin_user=request.user,
            action_type=serializer.validated_data["action_type"],
            target_type=report.target_type,
            target_id=report.target_id,
            notes=serializer.validated_data["notes"],
            request=request,
        )
        report.refresh_from_db()
        return Response(ReportSerializer(report).data)


class AdminModerationActionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = ModerationActionSerializer
    queryset = ModerationAction.objects.select_related("admin", "report")
