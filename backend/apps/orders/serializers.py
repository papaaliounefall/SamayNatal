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

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "event", "client_name", "client_email", "client_phone",
            "items", "total_amount_cfa", "platform_commission_cfa", "photographer_earnings_cfa",
            "payment_method", "payment_status", "access_granted_until", "created_at",
        ]
        read_only_fields = fields


class DevConfirmPaymentSerializer(serializers.Serializer):
    provider_reference = serializers.CharField()
    succeeded = serializers.BooleanField(default=True)
