from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .audit import record
from .models import AuditLog, PlatformSettings
from .permissions import IsAdmin
from .serializers import AuditLogSerializer, PlatformSettingsSerializer


class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.all()
    filterset_fields = ["action", "target_type"]
    search_fields = ["actor_label", "target_label", "details"]


class AdminPlatformSettingsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(PlatformSettingsSerializer(PlatformSettings.load()).data)

    def patch(self, request):
        settings_obj = PlatformSettings.load()
        serializer = PlatformSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        previous_rate = settings_obj.commission_rate
        serializer.save()
        record(
            actor=request.user,
            action="MODIFICATION_TAUX_COMMISSION",
            details=f"{previous_rate * 100:.1f}% -> {serializer.instance.commission_rate * 100:.1f}%",
            request=request,
        )
        return Response(serializer.data)
