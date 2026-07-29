import pytest
from django.urls import reverse

from accounts.models import User

pytestmark = pytest.mark.django_db


def test_customer_can_update_profile_without_changing_authority(
    authenticated_client,
    user,
):
    response = authenticated_client.patch(
        reverse("me"),
        {
            "first_name": "Amina",
            "last_name": "Ahmadi",
            "phone": "+93700123456",
            "role": User.Role.ADMIN,
        },
        format="json",
    )

    assert response.status_code == 200
    user.refresh_from_db()
    assert user.first_name == "Amina"
    assert user.phone == "+93700123456"
    assert user.role == User.Role.CUSTOMER


def test_customer_changes_password_with_current_password(
    authenticated_client,
    user,
):
    response = authenticated_client.post(
        reverse("change-password"),
        {
            "current_password": "Strong-Test-Password-123!",
            "new_password": "Stronger-Test-Password-456!",
        },
        format="json",
    )

    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password("Stronger-Test-Password-456!")

    rejected = authenticated_client.post(
        reverse("change-password"),
        {
            "current_password": "wrong-password",
            "new_password": "Another-Strong-Password-789!",
        },
        format="json",
    )
    assert rejected.status_code == 400


def test_account_deactivation_requires_email_and_password(
    authenticated_client,
    user,
):
    rejected = authenticated_client.post(
        reverse("deactivate-account"),
        {
            "current_password": "Strong-Test-Password-123!",
            "confirmation": "wrong@example.test",
        },
        format="json",
    )
    assert rejected.status_code == 400

    response = authenticated_client.post(
        reverse("deactivate-account"),
        {
            "current_password": "Strong-Test-Password-123!",
            "confirmation": user.email,
        },
        format="json",
    )

    assert response.status_code == 204
    user.refresh_from_db()
    assert user.is_active is False
