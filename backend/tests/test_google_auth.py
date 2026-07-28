from unittest.mock import patch

import pytest
from django.urls import reverse

from accounts.models import SocialIdentity, User

pytestmark = pytest.mark.django_db


def google_claims(
    *,
    subject="google-subject-1",
    email="newbuyer@gmail.com",
    verified=True,
    issuer="https://accounts.google.com",
    hosted_domain=None,
):
    claims = {
        "sub": subject,
        "email": email,
        "email_verified": verified,
        "iss": issuer,
        "given_name": "Google",
        "family_name": "Buyer",
    }
    if hosted_domain:
        claims["hd"] = hosted_domain
    return claims


@patch("accounts.services.verify_google_id_token")
def test_google_sign_in_creates_customer_and_reuses_identity(verify_token, api_client):
    verify_token.return_value = google_claims()

    first = api_client.post(
        reverse("google-login"),
        {"id_token": "valid-google-id-token"},
        format="json",
    )
    assert first.status_code == 200
    assert first.data["access"]
    assert first.data["refresh"]
    user = User.objects.get(email="newbuyer@gmail.com")
    assert not user.has_usable_password()
    assert user.first_name == "Google"
    assert user.customer_profile
    assert (
        SocialIdentity.objects.get(
            provider=SocialIdentity.Provider.GOOGLE,
            subject="google-subject-1",
        ).user
        == user
    )

    second = api_client.post(
        reverse("google-login"),
        {"id_token": "another-valid-token-for-the-same-subject"},
        format="json",
    )
    assert second.status_code == 200
    assert second.data["user"]["id"] == first.data["user"]["id"]
    assert User.objects.filter(email="newbuyer@gmail.com").count() == 1
    assert SocialIdentity.objects.count() == 1


@patch("accounts.services.verify_google_id_token")
def test_google_sign_in_links_authoritative_email(verify_token, api_client, user):
    user.email = "existing@gmail.com"
    user.save(update_fields=("email",))
    verify_token.return_value = google_claims(email="existing@gmail.com")

    result = api_client.post(
        reverse("google-login"),
        {"id_token": "valid-google-id-token"},
        format="json",
    )
    assert result.status_code == 200
    assert result.data["user"]["id"] == str(user.id)
    assert SocialIdentity.objects.get(user=user).subject == "google-subject-1"


@patch("accounts.services.verify_google_id_token")
def test_google_sign_in_does_not_auto_link_third_party_email(verify_token, api_client, user):
    verify_token.return_value = google_claims(email=user.email)

    result = api_client.post(
        reverse("google-login"),
        {"id_token": "valid-google-id-token"},
        format="json",
    )
    assert result.status_code == 409
    assert result.data["error"]["code"] == "google_link_required"
    assert not SocialIdentity.objects.exists()


@pytest.mark.parametrize(
    ("claims", "expected_code"),
    [
        (google_claims(verified=False), "google_email_unverified"),
        (google_claims(issuer="https://attacker.invalid"), "invalid_google_token"),
        (google_claims(subject=""), "google_email_unverified"),
    ],
)
@patch("accounts.services.verify_google_id_token")
def test_google_sign_in_rejects_untrusted_claims(verify_token, api_client, claims, expected_code):
    verify_token.return_value = claims
    result = api_client.post(
        reverse("google-login"),
        {"id_token": "untrusted-token"},
        format="json",
    )
    assert result.status_code == 401
    assert result.data["error"]["code"] == expected_code
    assert not User.objects.exists()


def test_google_sign_in_requires_server_configuration(api_client, settings):
    settings.GOOGLE_CLIENT_ID = ""
    result = api_client.post(
        reverse("google-login"),
        {"id_token": "cannot-be-verified"},
        format="json",
    )
    assert result.status_code == 503
    assert result.data["error"]["code"] == "google_sign_in_unavailable"
