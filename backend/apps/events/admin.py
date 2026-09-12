from django.contrib import admin

from .models import ClientGalleryAccess, Event, Gallery


class GalleryInline(admin.TabularInline):
    model = Gallery
    extra = 0
    fields = ("name", "is_default", "privacy", "photo_count", "sort_order")
    readonly_fields = ("photo_count",)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "photographer", "category", "status", "privacy", "date", "photos_count")
    list_filter = ("status", "category", "privacy")
    search_fields = ("title", "location", "photographer__business_name")
    prepopulated_fields = {}
    readonly_fields = ("slug", "views_count", "downloads_count", "photos_count")
    inlines = [GalleryInline]


@admin.register(Gallery)
class GalleryAdmin(admin.ModelAdmin):
    list_display = ("name", "event", "privacy", "photo_count", "is_default")
    list_filter = ("privacy",)


@admin.register(ClientGalleryAccess)
class ClientGalleryAccessAdmin(admin.ModelAdmin):
    list_display = ("event", "client_email", "invited_by", "granted_at")
