from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class TargetType(models.TextChoices):
    PHOTO = "PHOTO", "Photo"
    EVENT = "EVENT", "Événement"
    PHOTOGRAPHER = "PHOTOGRAPHER", "Photographe"


class Report(BaseModel):
    class Reason(models.TextChoices):
        CONTENU_INAPPROPRIE = "CONTENU_INAPPROPRIE", "Contenu inapproprié"
        DROITS_AUTEUR = "DROITS_AUTEUR", "Atteinte aux droits d'auteur"
        SPAM = "SPAM", "Spam / arnaque"
        AUTRE = "AUTRE", "Autre"

    class Status(models.TextChoices):
        OUVERT = "OUVERT", "Ouvert"
        EN_COURS = "EN_COURS", "En cours d'examen"
        RESOLU = "RESOLU", "Résolu"
        REJETE = "REJETE", "Rejeté"

    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.UUIDField()
    target_label = models.CharField(max_length=255, blank=True)

    reporter_email = models.EmailField(blank=True)
    reason = models.CharField(max_length=30, choices=Reason.choices)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OUVERT)

    class Meta:
        indexes = [models.Index(fields=["target_type", "target_id"]), models.Index(fields=["status"])]

    def __str__(self) -> str:
        return f"{self.reason} sur {self.target_type}:{self.target_id}"


class ModerationAction(BaseModel):
    class ActionType(models.TextChoices):
        SUPPRESSION_PHOTO = "SUPPRESSION_PHOTO", "Suppression de photo"
        SUSPENSION_EVENEMENT = "SUSPENSION_EVENEMENT", "Suspension d'événement"
        SUSPENSION_PHOTOGRAPHE = "SUSPENSION_PHOTOGRAPHE", "Suspension de photographe"
        AVERTISSEMENT = "AVERTISSEMENT", "Avertissement"
        REJET_SIGNALEMENT = "REJET_SIGNALEMENT", "Signalement rejeté sans action"

    report = models.ForeignKey(Report, null=True, blank=True, on_delete=models.SET_NULL, related_name="actions")
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="moderation_actions")
    action_type = models.CharField(max_length=30, choices=ActionType.choices)
    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.UUIDField()
    notes = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.action_type} on {self.target_type}:{self.target_id}"
