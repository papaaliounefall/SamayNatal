from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import ClientProfile, User


class UserSerializer(serializers.ModelSerializer):
    photographer_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "phone", "role", "date_joined", "photographer_status"]
        read_only_fields = fields

    def get_photographer_status(self, obj: User) -> str | None:
        profile = getattr(obj, "photographer_profile", None)
        return profile.status if profile else None


class RegisterClientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    city = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "phone", "city", "country"]

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value.lower()

    def create(self, validated_data):
        city = validated_data.pop("city", "")
        country = validated_data.pop("country", "")
        password = validated_data.pop("password")
        user = User.objects.create_user(role=User.Role.CLIENT, password=password, **validated_data)
        ClientProfile.objects.create(user=user, city=city, country=country)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False, validators=[validate_password])
