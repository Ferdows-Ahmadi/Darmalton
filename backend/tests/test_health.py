import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_health_endpoint_is_public_and_checks_database(api_client):
    response = api_client.get(reverse("health"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "darmalton-api"}
