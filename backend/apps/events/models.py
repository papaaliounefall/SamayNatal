import uuid

from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils.text import slugify

from apps.core.models import BaseModel
from apps.photographers.models import PhotographerProfile

EVENT_CATEGORIES = [
    ("mariage", "Mariage"),
    ("sport", "Sport"),
    ("bapteme", "Baptême"),
    ("anniversaire", "Anniversaire"),
    ("evenement_religieux", "Événement religieux"),
    ("concert", "Concert"),
    ("remise_diplome", "Remise de diplôme"),
    ("ecole", "École"),
    ("entreprise", "Entreprise"),
    ("mode", "Mode"),
    ("shooting_individuel", "Shooting individuel"),
    ("evenement_public", "Événement public"),
    ("artistique", "Artistique"),
    ("autre", "Autre"),
]


class Privacy(models.TextChoices):
    PUBLIC = "PUBLIC", "Public"
    CODE_PIN = "CODE_PIN", "Protégé par code"
    PRIVE = "PRIVE", "Privé (invitation uniquement)"


class PinProtectedMixin(models.Model):
    """Shared PIN-hashing behaviour for Event and Gallery.

    The PIN is never stored or returned in clear text — only a hash, checked
    the same way a password would be. A previous mock implementation
    compared plaintext PINs directly; that's the kind of shortcut we do not
    want to carry into the real backend.
    """

    access_pin_hash = models.CharField(max_length=255, blank=True)

    class Meta:
        abstract = True

    def set_pin(self, raw_pin: str | None) -> None:
        self.access_pin_hash = make_password(raw_pin) if raw_pin else ""

    def check_pin(self, raw_pin: str) -> bool:
        if not self.access_pin_hash:
            return False
        return check_password(raw_pin, self.access_pin_hash)


class Event(BaseModel, PinProtectedMixin):
    class Status(models.TextChoices):
        BROUILLON = "BROUILLON", "Brouillon"
        ACTIF = "ACTIF", "Actif"
        ARCHIVE = "ARCHIVÉ", "Archivé"
        SUSPENDU = "SUSPENDU", "Suspendu"

    photographer = models.ForeignKey(PhotographerProfile, on_delete=models.CASCADE, related_name="events")
    slug = models.SlugField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    date = models.DateField()
    location = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=40, choices=EVENT_CATEGORIES)
    cover_photo_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BROUILLON)
    privacy = models.CharField(max_length=20, choices=Privacy.choices, default=Privacy.PUBLIC)

    views_count = models.PositiveIntegerField(default=0)
    downloads_count = models.PositiveIntegerField(default=0)
    photos_count = models.PositiveIntegerField(default=0)

    default_price_per_photo_cfa = models.PositiveIntegerField(default=2000)
    pack_price_cfa = models.PositiveIntegerField(null=True, blank=True)
    full_gallery_price_cfa = models.PositiveIntegerField(null=True, blank=True)

    watermark_enabled = models.BooleanField(default=True)
    watermark_text = models.CharField(max_length=255, blank=True)
    watermark_position = models.CharField(
        max_length=20,
        choices=[("center", "Centre"), ("bottom-right", "Bas droite"), ("bottom-left", "Bas gauche"),
                 ("top-right", "Haut droite"), ("tile", "Mosaïque")],
        default="center",
    )
    watermark_opacity = models.FloatField(default=0.45)

    class Meta:
        indexes = [
            models.Index(fields=["photographer", "status"]),
            models.Index(fields=["slug"]),
        ]
        ordering = ["-date"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or f"evenement-{uuid.uuid4().hex[:8]}"
            slug = base_slug
            counter = 1
            while Event.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f"{base_slug}-{counter}"
            self.slug = slug
        super().save(*args, **kwargs)


class Gallery(BaseModel, PinProtectedMixin):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="galleries")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    privacy = models.CharField(max_length=20, choices=Privacy.choices, default=Privacy.PUBLIC)
    photo_count = models.PositiveIntegerField(default=0)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name_plural = "galleries"
        ordering = ["sort_order", "created_at"]

    def __str__(self) -> str:
        return f"{self.event.title} — {self.name}"


class ClientGalleryAccess(models.Model):
    """Explicit invitation to browse a PRIVE (invitation-only) event —
    independent of any purchase, granted by the photographer or by the
    admin. Checked by apps.events.access_control.can_view_event."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="client_accesses")
    client_email = models.EmailField()
    invited_by = models.ForeignKey(
        "accounts.User", null=True, on_delete=models.SET_NULL, related_name="+"
    )
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "client_email")
        verbose_name_plural = "client gallery accesses"

    def __str__(self) -> str:
        return f"{self.client_email} @ {self.event.title}"


