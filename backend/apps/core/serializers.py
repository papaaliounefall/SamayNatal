from rest_framework import serializers

from .models import AuditLog, Notification, PlatformSettings


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id", "actor_label", "action", "target_type", "target_id",
            "target_label", "details", "created_at",
        ]
        read_only_fields = fields


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = ["commission_rate", "updated_at"]
        read_only_fields = ["updated_at"]

    def validate_commission_rate(self, value: float) -> float:
        if not 0 <= value <= 0.5:
            raise serializers.ValidationError("Le taux de commission doit être compris entre 0% et 50%.")
        return value


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "action_url", "read_at", "created_at"]
        read_only_fields = fields
