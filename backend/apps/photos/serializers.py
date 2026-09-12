from rest_framework import serializers

from .access import can_download_original
from .models import Photo


class PhotoSerializer(serializers.ModelSerializer):
    """Photographer-facing: their own photo, every derived version."""

    original_url = serializers.SerializerMethodField()
    preview_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    watermarked_url = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = [
            "id", "event", "gallery", "title", "original_filename",
            "original_url", "preview_url", "thumbnail_url", "watermarked_url",
            "width", "height", "size_bytes", "price_cfa", "tags", "photo_number",
            "status", "created_at",
        ]
        read_only_fields = ["status", "width", "height", "size_bytes", "photo_number", "created_at"]

    def get_original_url(self, obj: Photo) -> str | None:
        return obj.original.url if obj.original else None

    def get_preview_url(self, obj: Photo) -> str | None:
        return obj.preview.url if obj.preview else None

    def get_thumbnail_url(self, obj: Photo) -> str | None:
        return obj.thumbnail.url if obj.thumbnail else None

    def get_watermarked_url(self, obj: Photo) -> str | None:
        return obj.watermarked.url if obj.watermarked else None


class PublicPhotoSerializer(serializers.ModelSerializer):
    """Client-facing: never the original, only display-safe derivatives.

    `hd_available` reflects whether the requesting client (identified by
    `context['client_email']`) has already paid for this specific photo —
    the frontend uses it to switch a card from "Ajouter au panier" to
    "Télécharger la HD" without a second round trip.
    """

    display_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    hd_available = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ["id", "photo_number", "thumbnail_url", "display_url", "price_cfa", "tags", "hd_available"]

    def get_thumbnail_url(self, obj: Photo) -> str | None:
        return obj.thumbnail.url if obj.thumbnail else None

    def get_display_url(self, obj: Photo) -> str | None:
        if obj.watermarked:
            return obj.watermarked.url
        return obj.preview.url if obj.preview else None

    def get_hd_available(self, obj: Photo) -> bool:
        client_email = self.context.get("client_email")
        if not client_email:
            return False
        return can_download_original(obj, client_email)


class HDDownloadRequestSerializer(serializers.Serializer):
    client_email = serializers.EmailField()
