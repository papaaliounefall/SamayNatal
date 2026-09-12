from django.contrib import admin

from .models import ModerationAction, Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("target_type", "target_label", "reason", "status", "reporter_email", "created_at")
    list_filter = ("status", "reason", "target_type")


@admin.register(ModerationAction)
class ModerationActionAdmin(admin.ModelAdmin):
    list_display = ("action_type", "target_type", "target_id", "admin", "created_at")
    list_filter = ("action_type", "target_type")

    def has_add_permission(self, request):
        return False
