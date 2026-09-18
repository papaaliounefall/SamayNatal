from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.accounts.models import User

from .models import LedgerEntry, PayoutRequest, PhotographerProfile, PhotographerStatusChange, Wallet

VALID_SPECIALTIES = {
    "mariage", "sport", "bapteme", "anniversaire", "evenement_religieux", "concert",
    "remise_diplome", "ecole", "entreprise", "mode", "shooting_individuel",
    "evenement_public", "artistique", "autre",
}


class PhotographerRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    business_name = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=120)
    country = serializers.CharField(max_length=120)
    bio = serializers.CharField(required=False, allow_blank=True)
    specialties = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    portfolio_url = serializers.URLField(required=False, allow_blank=True)
    accepted_terms = serializers.BooleanField()

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value.lower()

    def validate_specialties(self, value: list[str]) -> list[str]:
        unknown = set(value) - VALID_SPECIALTIES
        if unknown:
            raise serializers.ValidationError(f"Spécialités inconnues: {', '.join(unknown)}")
        return value

    def validate_accepted_terms(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("Vous devez accepter les conditions d'utilisation.")
        return value


class StatusChangeHistorySerializer(serializers.ModelSerializer):
    changed_by_label = serializers.CharField(source="changed_by.get_full_name", default="Système", read_only=True)

    class Meta:
        model = PhotographerStatusChange
        fields = ["status", "changed_by_label", "reason", "changed_at"]


class PhotographerProfileSerializer(serializers.ModelSerializer):
    status_history = StatusChangeHistorySerializer(many=True, read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    wallet_balance_cfa = serializers.IntegerField(source="wallet.balance_cfa", read_only=True)

    class Meta:
        model = PhotographerProfile
        fields = [
            "id", "email", "business_name", "city", "country", "bio", "specialties",
            "portfolio_url", "avatar_url", "social_links", "status", "subscription_plan",
            "storage_used_mb", "storage_max_mb", "wallet_balance_cfa", "status_history",
            "created_at",
        ]
        read_only_fields = ["status", "subscription_plan", "storage_used_mb", "storage_max_mb", "created_at"]


class PhotographerAdminActionSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ["id", "entry_type", "amount_cfa", "balance_after_cfa", "reference", "note", "created_at"]


class WalletSerializer(serializers.ModelSerializer):
    entries = LedgerEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ["balance_cfa", "updated_at", "entries"]


class PayoutRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutRequest
        fields = ["id", "amount_cfa", "method", "phone_number", "status", "admin_note", "processed_at", "created_at"]
        read_only_fields = ["id", "status", "admin_note", "processed_at", "created_at"]


class CreatePayoutRequestSerializer(serializers.Serializer):
    amount_cfa = serializers.IntegerField(min_value=1)
    method = serializers.ChoiceField(choices=PayoutRequest.Method.choices)
    phone_number = serializers.CharField(max_length=30)


class AdminPayoutRequestSerializer(serializers.ModelSerializer):
    photographer_business_name = serializers.CharField(source="photographer.business_name", read_only=True)
    processed_by_label = serializers.CharField(source="processed_by.get_full_name", default="", read_only=True)

    class Meta:
        model = PayoutRequest
        fields = [
            "id", "photographer", "photographer_business_name", "amount_cfa", "method", "phone_number",
            "status", "admin_note", "processed_at", "processed_by_label", "created_at",
        ]
        read_only_fields = fields


class PayoutActionSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, default="")
