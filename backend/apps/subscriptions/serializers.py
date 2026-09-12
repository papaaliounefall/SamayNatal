from rest_framework import serializers

from .models import Subscription, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ["id", "code", "name", "price_cfa_per_month", "storage_limit_mb", "max_active_events", "features"]


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_code = serializers.SlugRelatedField(
        source="plan", slug_field="code", queryset=SubscriptionPlan.objects.filter(is_active=True), write_only=True
    )

    class Meta:
        model = Subscription
        fields = ["id", "plan", "plan_code", "status", "current_period_end", "created_at"]
        read_only_fields = ["status", "current_period_end", "created_at"]
