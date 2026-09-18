from rest_framework import serializers

from .models import Order, OrderItem


class CartItemSerializer(serializers.Serializer):
    item_type = serializers.ChoiceField(choices=["SINGLE", "PACK", "FULL_GALLERY"])
    photo_id = serializers.UUIDField(required=False)
    photo_ids = serializers.ListField(child=serializers.UUIDField(), required=False)


class CreateOrderSerializer(serializers.Serializer):
    client_name = serializers.CharField(max_length=255)
    client_email = serializers.EmailField()
    client_phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    cart_items = CartItemSerializer(many=True)
    idempotency_key = serializers.CharField(max_length=255, required=False, allow_blank=True)


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "photo", "item_type", "title_snapshot", "price_cfa"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "event", "event_title", "client_name", "client_email", "client_phone",
            "items", "total_amount_cfa", "platform_commission_cfa", "photographer_earnings_cfa",
            "payment_method", "payment_status", "access_granted_until", "created_at",
        ]
        read_only_fields = fields


class AdminOrderSerializer(OrderSerializer):
    """Same shape as the photographer-facing serializer, plus who the
    seller was — the one thing an admin needs that a photographer
    already knows implicitly about their own orders."""

    photographer_business_name = serializers.CharField(source="photographer.business_name", read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ["photographer", "photographer_business_name"]
        read_only_fields = fields


class DevConfirmPaymentSerializer(serializers.Serializer):
    provider_reference = serializers.CharField()
    succeeded = serializers.BooleanField(default=True)


class ClientSummarySerializer(serializers.Serializer):
    """Output-only — serializes the aggregated dicts from
    services.list_clients_for_photographer, not a model instance."""

    client_email = serializers.EmailField()
    client_name = serializers.CharField()
    client_phone = serializers.CharField()
    orders_count = serializers.IntegerField()
    completed_orders_count = serializers.IntegerField()
    total_spent_cfa = serializers.IntegerField()
    first_purchase_at = serializers.DateTimeField()
    last_purchase_at = serializers.DateTimeField()


class ClientGallerySummarySerializer(serializers.Serializer):
    """Output-only — serializes the aggregated dicts from
    services.list_galleries_for_client, not a model instance."""

    event_slug = serializers.CharField()
    event_title = serializers.CharField()
    photographer_business_name = serializers.CharField()
    cover_photo_url = serializers.SerializerMethodField()
    purchased_photos_count = serializers.IntegerField()
    total_spent_cfa = serializers.IntegerField()
    last_order_at = serializers.DateTimeField()

    def get_cover_photo_url(self, obj: dict) -> str | None:
        photo = obj.get("cover_photo")
        if not photo:
            return None
        return photo.watermarked.url if photo.watermarked else (photo.preview.url if photo.preview else None)
