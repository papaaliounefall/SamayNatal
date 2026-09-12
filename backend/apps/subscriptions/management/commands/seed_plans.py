from django.core.management.base import BaseCommand

from apps.subscriptions.models import SubscriptionPlan

PLANS = [
    {
        "code": SubscriptionPlan.Code.FREE,
        "name": "Free",
        "price_cfa_per_month": 0,
        "storage_limit_mb": 5_000,
        "max_active_events": 2,
        "features": ["1 galerie par événement", "Watermark obligatoire", "Support communautaire"],
    },
    {
        "code": SubscriptionPlan.Code.PRO,
        "name": "Pro",
        "price_cfa_per_month": 15_000,
        "storage_limit_mb": 100_000,
        "max_active_events": None,
        "features": ["Événements illimités", "Watermark personnalisable", "QR code", "Support prioritaire"],
    },
    {
        "code": SubscriptionPlan.Code.STUDIO,
        "name": "Studio",
        "price_cfa_per_month": 45_000,
        "storage_limit_mb": 500_000,
        "max_active_events": None,
        "features": ["Tout Pro", "Multi-utilisateurs", "Statistiques avancées", "Support dédié"],
    },
]


class Command(BaseCommand):
    help = "Creates or updates the default subscription plans (FREE/PRO/STUDIO)."

    def handle(self, *args, **options):
        for plan_data in PLANS:
            plan, created = SubscriptionPlan.objects.update_or_create(
                code=plan_data["code"], defaults={**plan_data, "is_active": True}
            )
            verb = "Créé" if created else "Mis à jour"
            self.stdout.write(self.style.SUCCESS(f"{verb}: {plan.name}"))
