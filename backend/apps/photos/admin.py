from django.contrib import admin

from .models import Photo, PhotoAccess


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ("photo_number", "event", "gallery", "status", "price_cfa", "created_at")
    list_filter = ("status", "event")
    search_fields = ("title", "original_filename")


@admin.register(PhotoAccess)
class PhotoAccessAdmin(admin.ModelAdmin):
    list_display = ("photo", "client_email", "granted_at", "expires_at")
    search_fields = ("client_email",)
