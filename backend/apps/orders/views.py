from django.conf import settings
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin, IsApprovedPhotographer, IsClient
from apps.events.models import Event

from .models import Order
from .providers import get_provider
from .serializers import (
    AdminOrderSerializer,
    ClientGallerySummarySerializer,
    ClientSummarySerializer,
    CreateOrderSerializer,
    DevConfirmPaymentSerializer,
    OrderSerializer,
)
from .services import (
    CartValidationError,
    confirm_payment,
    create_order,
    list_clients_for_photographer,
    list_galleries_for_client,
)


class CreateOrderView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"

    def post(self, request, event_slug):
        event = get_object_or_404(Event, slug=event_slug)
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        cart_items = [dict(item) for item in data.pop("cart_items")]

        try:
            order, provider_result = create_order(
                event=event,
                client_name=data["client_name"],
                client_email=data["client_email"],
                client_phone=data.get("client_phone", ""),
                payment_method=data["payment_method"],
                cart_items=cart_items,
                idempotency_key=data.get("idempotency_key") or None,
                request=request,
            )
        except CartValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"order": OrderSerializer(order).data, "payment": provider_result},
            status=status.HTTP_201_CREATED,
        )


class PaymentWebhookView(APIView):
    """Server-to-server callback from a payment provider.

    This — not the checkout response, not anything the browser reports —
    is the only thing allowed to mark an order paid.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, provider):
        try:
            provider_impl = get_provider(provider)
        except ValueError:
            raise Http404("Fournisseur inconnu")

        result = provider_impl.verify_webhook(payload=request.body, headers=dict(request.headers))
        order = confirm_payment(
            provider_reference=result.provider_reference,
            succeeded=result.succeeded,
            raw_payload=result.raw_payload,
        )
        return Response({"order_number": order.order_number, "status": order.payment_status})


class DevConfirmPaymentView(APIView):
    """Local-only stand-in for a real provider webhook.

    There is no live Wave/Orange Money/Free Money integration yet (no
    API credentials configured) — this lets the checkout flow be
    exercised end-to-end in development without one. Refuses to run
    unless DEBUG is on, so it can never be reachable in production.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.DEBUG:
            raise Http404
        serializer = DevConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = confirm_payment(
            provider_reference=serializer.validated_data["provider_reference"],
            succeeded=serializer.validated_data["succeeded"],
            raw_payload={"dev": True, **serializer.validated_data},
        )
        return Response(OrderSerializer(order).data)


class PhotographerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsApprovedPhotographer]
    serializer_class = OrderSerializer
    filterset_fields = ["payment_status", "event"]

    def get_queryset(self):
        return (
            Order.objects.filter(photographer=self.request.user.photographer_profile)
            .select_related("event")
            .prefetch_related("items")
        )


class PhotographerClientListView(APIView):
    """A photographer's clients, derived entirely from their own Order
    history — there is no separate Client model to keep in sync."""

    permission_classes = [IsApprovedPhotographer]

    def get(self, request):
        clients = list_clients_for_photographer(request.user.photographer_profile)
        return Response(ClientSummarySerializer(clients, many=True).data)


class ClientGalleryListView(APIView):
    """The galleries a logged-in client has purchased into, derived
    entirely from their own Order history matched by email — mirrors
    PhotographerClientListView but grouped by event instead of by buyer."""

    permission_classes = [IsClient]

    def get(self, request):
        galleries = list_galleries_for_client(request.user.email)
        return Response(ClientGallerySummarySerializer(galleries, many=True).data)


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Platform-wide order visibility for support/fraud investigation —
    an admin never creates or edits an order, only reads it."""

    permission_classes = [IsAdmin]
    serializer_class = AdminOrderSerializer
    filterset_fields = ["payment_status", "payment_method"]
    search_fields = ["order_number", "client_name", "client_email"]

    def get_queryset(self):
        return Order.objects.select_related("event", "photographer").prefetch_related("items").order_by("-created_at")
