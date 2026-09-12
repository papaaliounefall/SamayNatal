import uuid

from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class PhotographerProfile(BaseModel):
    class Status(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        APPROUVE = "APPROUVÉ", "Approuvé"
        REFUSE = "REFUSÉ", "Refusé"
        SUSPENDU = "SUSPENDU", "Suspendu"

    class Plan(models.TextChoices):
        FREE = "FREE", "Free"
        PRO = "PRO", "Pro"
        STUDIO = "STUDIO", "Studio"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="photographer_profile")
    business_name = models.CharField(max_length=255)
    city = models.CharField(max_length=120)
    country = models.CharField(max_length=120)
    bio = models.TextField(blank=True)
    specialties = models.JSONField(default=list, blank=True)
    portfolio_url = models.URLField(blank=True)
    avatar_url = models.URLField(blank=True)
    social_links = models.JSONField(default=dict, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.EN_ATTENTE)
    subscription_plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.FREE)

    storage_used_mb = models.PositiveBigIntegerField(default=0)
    storage_max_mb = models.PositiveBigIntegerField(default=5_000)

    class Meta:
        indexes = [models.Index(fields=["status"])]

    def __str__(self) -> str:
        return f"{self.business_name} ({self.status})"

    @property
    def storage_used_ratio(self) -> float:
        return self.storage_used_mb / self.storage_max_mb if self.storage_max_mb else 0.0


class PhotographerStatusChange(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    photographer = models.ForeignKey(PhotographerProfile, on_delete=models.CASCADE, related_name="status_history")
    status = models.CharField(max_length=20, choices=PhotographerProfile.Status.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+"
    )
    reason = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["changed_at"]

    def __str__(self) -> str:
        return f"{self.photographer.business_name} -> {self.status}"


class Wallet(models.Model):
    """One ledger-backed wallet per photographer.

    `balance_cfa` is a materialized cache of the sum of LedgerEntry amounts —
    it must only ever be changed inside the same transaction that writes the
    corresponding ledger entry (see apps.orders.services). Never edited
    directly by a view or admin action.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    photographer = models.OneToOneField(PhotographerProfile, on_delete=models.CASCADE, related_name="wallet")
    balance_cfa = models.BigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Wallet({self.photographer.business_name}) = {self.balance_cfa} CFA"


class LedgerEntry(models.Model):
    class EntryType(models.TextChoices):
        SALE_CREDIT = "SALE_CREDIT", "Vente créditée"
        COMMISSION_DEBIT = "COMMISSION_DEBIT", "Commission plateforme"
        PAYOUT = "PAYOUT", "Versement au photographe"
        ADJUSTMENT = "ADJUSTMENT", "Ajustement manuel"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="entries")
    entry_type = models.CharField(max_length=30, choices=EntryType.choices)
    amount_cfa = models.BigIntegerField(help_text="Positive=credit, negative=debit")
    balance_after_cfa = models.BigIntegerField()
    reference = models.CharField(max_length=100, blank=True, help_text="e.g. related order number")
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.entry_type} {self.amount_cfa} CFA"
