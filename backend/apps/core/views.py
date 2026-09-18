import time
from datetime import timedelta

from django.core.cache import cache
from django.db import connection
from django.db.models import Count, Sum
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .audit import record
from .models import AuditLog, Notification, PlatformSettings
from .permissions import IsAdmin
from .serializers import AuditLogSerializer, NotificationSerializer, PlatformSettingsSerializer


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


class AdminStatsView(APIView):
    """Platform-wide numbers for the admin overview — lives in core (not
    e.g. apps.orders) since it aggregates across several apps rather than
    belonging to one of them."""

    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.events.models import Event
        from apps.orders.models import Order
        from apps.photographers.models import PhotographerProfile

        photographer_counts = {
            row["status"]: row["count"]
            for row in PhotographerProfile.objects.values("status").annotate(count=Count("id"))
        }

        completed_orders = Order.objects.filter(payment_status=Order.PaymentStatus.COMPLETED)
        totals = completed_orders.aggregate(
            total_revenue_cfa=Sum("total_amount_cfa"),
            total_commission_cfa=Sum("platform_commission_cfa"),
            total_photographer_earnings_cfa=Sum("photographer_earnings_cfa"),
        )

        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_completed = completed_orders.filter(created_at__gte=thirty_days_ago)

        return Response(
            {
                "photographers_total": PhotographerProfile.objects.count(),
                "photographers_approved": photographer_counts.get(PhotographerProfile.Status.APPROUVE, 0),
                "photographers_pending": photographer_counts.get(PhotographerProfile.Status.EN_ATTENTE, 0),
                "events_total": Event.objects.count(),
                "events_active": Event.objects.filter(status=Event.Status.ACTIF).count(),
                "orders_total": Order.objects.count(),
                "orders_completed": completed_orders.count(),
                "orders_pending": Order.objects.filter(payment_status=Order.PaymentStatus.PENDING).count(),
                "total_revenue_cfa": totals["total_revenue_cfa"] or 0,
                "total_commission_cfa": totals["total_commission_cfa"] or 0,
                "total_photographer_earnings_cfa": totals["total_photographer_earnings_cfa"] or 0,
                "revenue_last_30_days_cfa": recent_completed.aggregate(total=Sum("total_amount_cfa"))["total"] or 0,
                "orders_last_30_days": recent_completed.count(),
            }
        )


def _timed_check(fn) -> dict:
    started = time.monotonic()
    try:
        fn()
        return {"status": "up", "latency_ms": round((time.monotonic() - started) * 1000)}
    except Exception as exc:  # noqa: BLE001 — a health check must never itself 500
        return {"status": "down", "latency_ms": round((time.monotonic() - started) * 1000), "error": str(exc)[:200]}


def _check_database() -> None:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")


def _check_cache() -> None:
    cache.set("health_check_probe", "1", timeout=5)
    if cache.get("health_check_probe") != "1":
        raise RuntimeError("cache round-trip mismatch")


def _check_storage() -> None:
    # Just needs to reach the bucket without erroring — the probe key is
    # never expected to exist, so `exists() -> False` is still a pass.
    default_storage.exists("__health_check_probe__")


def _check_celery() -> None:
    from config.celery import app as celery_app

    responses = celery_app.control.ping(timeout=1.5)
    if not responses:
        raise RuntimeError("no worker responded")


class AdminSystemHealthView(APIView):
    """Live connectivity check for every service the platform depends on
    — lets an admin spot an outage before users start reporting it."""

    permission_classes = [IsAdmin]

    def get(self, request):
        checks = {
            "database": _timed_check(_check_database),
            "cache": _timed_check(_check_cache),
            "storage": _timed_check(_check_storage),
            "celery": _timed_check(_check_celery),
        }
        return Response({"checks": checks, "healthy": all(c["status"] == "up" for c in checks.values())})


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """A user's own in-app notifications — always scoped to the requester,
    there is no cross-user access here regardless of role."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user, channel=Notification.Channel.IN_APP)

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = self.get_queryset().filter(read_at__isnull=True).count()
        return Response({"unread_count": count})

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = get_object_or_404(self.get_queryset(), pk=pk)
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at"])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        self.get_queryset().filter(read_at__isnull=True).update(read_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)
