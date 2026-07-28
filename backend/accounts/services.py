from dataclasses import dataclass

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from google.auth import exceptions as google_exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework.exceptions import APIException, AuthenticationFailed

from .models import CustomerProfile, SocialIdentity, User


class GoogleIdentityUnavailable(APIException):
    status_code = 503
    default_detail = "Google sign-in is temporarily unavailable. Please try again."
    default_code = "google_sign_in_unavailable"


class GoogleIdentityConflict(APIException):
    status_code = 409
    default_detail = (
        "This email already has an account. Sign in with your password before linking Google."
    )
    default_code = "google_link_required"


class InvalidGoogleIdentity(AuthenticationFailed):
    default_detail = "Google could not verify this sign-in. Please try again."
    default_code = "invalid_google_token"


class GoogleEmailUnverified(AuthenticationFailed):
    default_detail = "Google did not provide a verified email address."
    default_code = "google_email_unverified"


class InactiveGoogleAccount(AuthenticationFailed):
    default_detail = "This account is inactive."
    default_code = "inactive_account"


@dataclass(frozen=True)
class GoogleClaims:
    subject: str
    email: str
    first_name: str
    last_name: str
    google_is_authoritative_for_email: bool


def verify_google_id_token(encoded_token: str) -> dict:
    if not settings.GOOGLE_CLIENT_ID:
        raise GoogleIdentityUnavailable(
            "Google sign-in is not configured on this environment."
        )
    try:
        return google_id_token.verify_oauth2_token(
            encoded_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise InvalidGoogleIdentity() from exc
    except google_exceptions.GoogleAuthError as exc:
        raise GoogleIdentityUnavailable() from exc


def _validated_claims(encoded_token: str) -> GoogleClaims:
    payload = verify_google_id_token(encoded_token)
    subject = str(payload.get("sub", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    email_verified = payload.get("email_verified") in (True, "true", "True")
    if not subject or not email or not email_verified:
        raise GoogleEmailUnverified()
    issuer = str(payload.get("iss", "")).strip()
    if issuer not in {"accounts.google.com", "https://accounts.google.com"}:
        raise InvalidGoogleIdentity()
    return GoogleClaims(
        subject=subject,
        email=email,
        first_name=str(payload.get("given_name", "")).strip()[:150],
        last_name=str(payload.get("family_name", "")).strip()[:150],
        google_is_authoritative_for_email=(
            email.endswith("@gmail.com") or bool(str(payload.get("hd", "")).strip())
        ),
    )


@transaction.atomic
def authenticate_google_identity(encoded_token: str) -> User:
    claims = _validated_claims(encoded_token)
    identity = (
        SocialIdentity.objects.select_for_update()
        .select_related("user")
        .filter(provider=SocialIdentity.Provider.GOOGLE, subject=claims.subject)
        .first()
    )
    if identity:
        if not identity.user.is_active:
            raise InactiveGoogleAccount()
        identity.email_at_link = claims.email
        identity.last_login_at = timezone.now()
        identity.save(update_fields=("email_at_link", "last_login_at"))
        return identity.user

    user = User.objects.select_for_update().filter(email=claims.email).first()
    if user and not claims.google_is_authoritative_for_email:
        raise GoogleIdentityConflict()
    if user and not user.is_active:
        raise InactiveGoogleAccount()
    if not user:
        user = User.objects.create_user(
            email=claims.email,
            password=None,
            first_name=claims.first_name,
            last_name=claims.last_name,
        )
        CustomerProfile.objects.create(user=user)

    try:
        with transaction.atomic():
            SocialIdentity.objects.create(
                user=user,
                provider=SocialIdentity.Provider.GOOGLE,
                subject=claims.subject,
                email_at_link=claims.email,
            )
    except IntegrityError as exc:
        raise GoogleIdentityConflict(
            "This account is already linked to a different Google identity."
        ) from exc
    return user
