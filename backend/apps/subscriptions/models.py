from django.db import models

from apps.core.models import BaseModel
from apps.photographers.models import PhotographerProfile


class SubscriptionPlan(BaseModel):
    class Code(models.TextChoices):
        FREE = "FREE", "Free"
        PRO = "PRO", "Pro"
        STUDIO = "STUDIO", "Studio"

    code = models.CharField(max_length=20, choices=Code.choices, unique=True)
    name = models.CharField(max_length=100)
    price_cfa_per_month = models.PositiveIntegerField(default=0)
    storage_limit_mb = models.PositiveBigIntegerField()
    max_active_events = models.PositiveIntegerField(null=True, blank=True, help_text="null = illimité")
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name


class Subscription(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Actif"
        CANCELED = "CANCELED", "Annulé"
        PAST_DUE = "PAST_DUE", "Paiement en retard"

    photographer = models.OneToOneField(PhotographerProfile, on_delete=models.CASCADE, related_name="subscription")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name="subscriptions")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    current_period_end = models.DateField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.photographer.business_name} — {self.plan.name}"
