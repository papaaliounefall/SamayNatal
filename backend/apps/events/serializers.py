from rest_framework import serializers

from .models import Event, Gallery


class GallerySerializer(serializers.ModelSerializer):
    access_pin = serializers.CharField(write_only=True, required=False, allow_blank=True)
    has_pin = serializers.SerializerMethodField()

    class Meta:
        model = Gallery
        fields = [
            "id", "event", "name", "description", "is_default", "privacy",
            "photo_count", "sort_order", "access_pin", "has_pin", "created_at",
        ]
        read_only_fields = ["photo_count", "created_at"]

    def get_has_pin(self, obj: Gallery) -> bool:
        return bool(obj.access_pin_hash)

    def create(self, validated_data):
        pin = validated_data.pop("access_pin", "")
        gallery = Gallery(**validated_data)
        gallery.set_pin(pin)
        gallery.save()
        return gallery

    def update(self, instance, validated_data):
        pin = validated_data.pop("access_pin", None)
        if pin is not None:
            instance.set_pin(pin)
        return super().update(instance, validated_data)


def _photo_display_url(photo) -> str | None:
    if not photo:
        return None
    if photo.watermarked:
        return photo.watermarked.url
    return photo.preview.url if photo.preview else None


class EventSerializer(serializers.ModelSerializer):
    """Full serializer for the owning photographer — includes counters and
    watermark settings, but still never exposes the PIN itself."""

    galleries = GallerySerializer(many=True, read_only=True)
    access_pin = serializers.CharField(write_only=True, required=False, allow_blank=True)
    has_pin = serializers.SerializerMethodField()
    public_url = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()
    cover_photo_id = serializers.PrimaryKeyRelatedField(source="cover_photo", read_only=True)

    class Meta:
        model = Event
        fields = [
            "id", "slug", "title", "description", "date", "location", "category",
            "cover_photo_url", "cover_photo_id", "status", "privacy", "access_pin", "has_pin",
            "views_count", "downloads_count", "photos_count",
            "default_price_per_photo_cfa", "pack_price_cfa", "full_gallery_price_cfa",
            "watermark_enabled", "watermark_text", "watermark_position", "watermark_opacity",
            "galleries", "public_url", "created_at",
        ]
        read_only_fields = ["slug", "views_count", "downloads_count", "photos_count", "created_at"]

    def get_has_pin(self, obj: Event) -> bool:
        return bool(obj.access_pin_hash)

    def get_public_url(self, obj: Event) -> str:
        from django.conf import settings
        return f"{settings.FRONTEND_BASE_URL}/g/{obj.slug}"

    def get_cover_photo_url(self, obj: Event) -> str | None:
        return _photo_display_url(obj.cover_photo)

    def create(self, validated_data):
        pin = validated_data.pop("access_pin", "")
        request = self.context["request"]
        photographer = request.user.photographer_profile
        validated_data.setdefault("watermark_text", f"{photographer.business_name.upper()} © PROOF")
        event = Event(photographer=photographer, **validated_data)
        event.set_pin(pin)
        event.save()
        Gallery.objects.create(event=event, name="Galerie Principale", is_default=True, privacy=event.privacy)
        return event

    def update(self, instance, validated_data):
        pin = validated_data.pop("access_pin", None)
        if pin is not None:
            instance.set_pin(pin)
        return super().update(instance, validated_data)


class PublicGallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Gallery
        fields = ["id", "name", "description", "is_default", "photo_count"]


class PublicEventSerializer(serializers.ModelSerializer):
    """What an anonymous client is allowed to see — no counts a competitor
    could scrape, no internal pricing logic beyond the sale prices."""

    photographer_name = serializers.CharField(source="photographer.business_name", read_only=True)
    galleries = PublicGallerySerializer(many=True, read_only=True)
    requires_pin = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "slug", "title", "description", "date", "location", "category",
            "cover_photo_url", "photographer_name", "photos_count", "privacy",
            "requires_pin", "default_price_per_photo_cfa", "pack_price_cfa",
            "full_gallery_price_cfa", "galleries",
        ]

    def get_requires_pin(self, obj: Event) -> bool:
        return obj.privacy == "CODE_PIN"

    def get_cover_photo_url(self, obj: Event) -> str | None:
        return _photo_display_url(obj.cover_photo)


class UnlockEventSerializer(serializers.Serializer):
    pin = serializers.CharField()
