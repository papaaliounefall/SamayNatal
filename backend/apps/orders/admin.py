from django.contrib import admin

from .models import Order, OrderItem, Payment


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("photo", "item_type", "title_snapshot", "price_cfa")
    can_delete = False


class PaymentInline(admin.StackedInline):
    model = Payment
    extra = 0
    readonly_fields = ("provider", "provider_reference", "status", "confirmed_at", "raw_webhook_payload")
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "event", "client_name", "total_amount_cfa", "payment_status", "created_at")
    list_filter = ("payment_status", "payment_method")
    search_fields = ("order_number", "client_name", "client_email")
    inlines = [OrderItemInline, PaymentInline]
    readonly_fields = [f.name for f in Order._meta.fields]

    def has_add_permission(self, request):
        return False
