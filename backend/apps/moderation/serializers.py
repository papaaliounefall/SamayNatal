from rest_framework import serializers

from .models import ModerationAction, Report


class CreateReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["target_type", "target_id", "target_label", "reporter_email", "reason", "details"]


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            "id", "target_type", "target_id", "target_label", "reporter_email",
            "reason", "details", "status", "created_at",
        ]
        read_only_fields = ["status", "created_at"]


class ModerationActionSerializer(serializers.ModelSerializer):
    admin_label = serializers.CharField(source="admin.get_full_name", read_only=True)

    class Meta:
        model = ModerationAction
        fields = ["id", "report", "admin_label", "action_type", "target_type", "target_id", "notes", "created_at"]
        read_only_fields = fields


class ApplyActionSerializer(serializers.Serializer):
    action_type = serializers.ChoiceField(choices=ModerationAction.ActionType.choices)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
