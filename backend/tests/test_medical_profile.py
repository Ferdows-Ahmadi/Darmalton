import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_customer_can_manage_only_their_minimal_medical_profile(
    authenticated_client,
    user,
    other_user,
):
    response = authenticated_client.put(
        "/api/v1/auth/me/medical-profile/",
        {
            "allergies": ["Penicillin", " penicillin ", "Peanuts"],
            "medical_notes": "Avoid sedating medicines when possible.  ",
        },
        format="json",
    )
    assert response.status_code == 200
    assert response.data["allergies"] == ["Penicillin", "Peanuts"]
    assert response.data["medical_notes"] == "Avoid sedating medicines when possible."
    user.customer_profile.refresh_from_db()
    assert user.customer_profile.allergies == ["Penicillin", "Peanuts"]

    other_client = APIClient()
    other_client.force_authenticate(other_user)
    other = other_client.get("/api/v1/auth/me/medical-profile/")
    assert other.status_code == 200
    assert other.data["allergies"] == []
    assert other.data["medical_notes"] == ""


@pytest.mark.django_db
def test_medical_profile_rejects_unbounded_or_non_text_allergies(
    authenticated_client,
):
    response = authenticated_client.patch(
        "/api/v1/auth/me/medical-profile/",
        {"allergies": ["Valid", 7]},
        format="json",
    )
    assert response.status_code == 400
    assert "allergies" in response.data["error"]["fields"]

    response = authenticated_client.patch(
        "/api/v1/auth/me/medical-profile/",
        {"medical_notes": "x" * 2001},
        format="json",
    )
    assert response.status_code == 400
    assert "medical_notes" in response.data["error"]["fields"]
