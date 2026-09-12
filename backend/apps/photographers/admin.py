from django.contrib import admin

from .models import LedgerEntry, PhotographerProfile, PhotographerStatusChange, Wallet


class StatusHistoryInline(admin.TabularInline):
    model = PhotographerStatusChange
    extra = 0
    readonly_fields = ("status", "changed_by", "reason", "changed_at")
    can_delete = False


@admin.register(PhotographerProfile)
class PhotographerProfileAdmin(admin.ModelAdmin):
    list_display = ("business_name", "user", "city", "country", "status", "subscription_plan", "created_at")
    list_filter = ("status", "subscription_plan", "country")
    search_fields = ("business_name", "user__email", "city")
    inlines = [StatusHistoryInline]


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("photographer", "balance_cfa", "updated_at")

    def has_add_permission(self, request):
        return False


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ("wallet", "entry_type", "amount_cfa", "balance_after_cfa", "reference", "created_at")
    list_filter = ("entry_type",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
