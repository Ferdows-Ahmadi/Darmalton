from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomerProfile, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "phone", "first_name", "last_name", "role")
        read_only_fields = ("id", "role")


class CustomerMedicalProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ("allergies", "medical_notes", "updated_at")
        read_only_fields = ("updated_at",)

    def validate_allergies(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Allergies must be a list.")
        if len(value) > 50:
            raise serializers.ValidationError("Record no more than 50 allergies.")
        normalized = []
        seen = set()
        for entry in value:
            if not isinstance(entry, str):
                raise serializers.ValidationError("Every allergy must be text.")
            allergy = entry.strip()
            if not allergy:
                raise serializers.ValidationError("Allergy entries cannot be blank.")
            if len(allergy) > 120:
                raise serializers.ValidationError(
                    "Each allergy must be 120 characters or fewer."
                )
            key = allergy.casefold()
            if key not in seen:
                normalized.append(allergy)
                seen.add(key)
        return normalized

    def validate_medical_notes(self, value):
        normalized = value.strip()
        if len(normalized) > 2000:
            raise serializers.ValidationError(
                "Medical notes must be 2000 characters or fewer."
            )
        return normalized


def token_payload(user):
    refresh = RefreshToken.for_user(user)
    return {
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "phone", "password", "first_name", "last_name")

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        CustomerProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            email=attrs["email"].lower(),
            password=attrs["password"],
        )
        if not user or not user.is_active:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs


class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField(write_only=True, trim_whitespace=True)
