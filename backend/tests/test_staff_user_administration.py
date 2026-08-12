import pytest
from rest_framework.test import APIClient

from accounts.models import User


@pytest.fixture
def admin_client(db):
    user = User.objects.create_user(
        email="portal-admin@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.ADMIN,
        is_staff=True,
    )
    client = APIClient()
    client.force_authenticate(user)
    return client, user


@pytest.fixture
def operations_client(db):
    user = User.objects.create_user(
        email="portal-operations@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
        is_staff=True,
    )
    client = APIClient()
    client.force_authenticate(user)
    return client, user


@pytest.mark.django_db
def test_only_admin_manages_users_and_self_lockout_is_blocked(
    authenticated_client, admin_client, operations_client
):
    admin, admin_user = admin_client
    staff, _ = operations_client
    assert authenticated_client.get("/api/v1/auth/staff/users/").status_code == 403
    assert staff.get("/api/v1/auth/staff/users/").status_code == 403

    created = admin.post(
        "/api/v1/auth/staff/users/",
        {
            "email": "new-pharmacist@example.test",
            "password": "Strong-Temporary-Password-123!",
            "first_name": "New",
            "last_name": "Pharmacist",
            "role": User.Role.PHARMACIST,
            "is_active": True,
        },
        format="json",
    )
    assert created.status_code == 201
    user = User.objects.get(pk=created.data["id"])
    assert user.check_password("Strong-Temporary-Password-123!")
    assert user.is_staff

    locked_out = admin.patch(
        f"/api/v1/auth/staff/users/{admin_user.pk}/",
        {"is_active": False},
        format="json",
    )
    assert locked_out.status_code == 400

    deactivated = admin.patch(
        f"/api/v1/auth/staff/users/{user.pk}/",
        {"is_active": False},
        format="json",
    )
    assert deactivated.status_code == 200
    user.refresh_from_db()
    assert not user.is_active
