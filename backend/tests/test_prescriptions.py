from datetime import timedelta
from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import User
from commerce.models import CartItem, Order
from commerce.services import create_order, transition_order_status
from prescriptions.models import Notification, Prescription
from prescriptions.storage import private_prescription_storage

from .test_api import make_address


def image_upload(name="prescription.png", content_type="image/png"):
    content = BytesIO()
    Image.new("RGB", (20, 20), "white").save(content, format="PNG")
    return SimpleUploadedFile(name, content.getvalue(), content_type=content_type)


@pytest.fixture
def pharmacist(db):
    return User.objects.create_user(
        email="pharmacist@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.PHARMACIST,
    )


@pytest.fixture(autouse=True)
def isolated_private_uploads(tmp_path, settings):
    settings.PRIVATE_MEDIA_ROOT = tmp_path / "private"
    private_prescription_storage._clear_cached_properties(
        setting="PRIVATE_MEDIA_ROOT",
        value=settings.PRIVATE_MEDIA_ROOT,
        enter=True,
    )


@pytest.fixture
def pharmacist_client(pharmacist):
    client = APIClient()
    client.force_authenticate(pharmacist)
    return client


def submit(client, **data):
    payload = {
        "document": image_upload(),
        "patient_name": "احمد",
        "contact_phone": "0700123456",
        **data,
    }
    return client.post("/api/v1/prescriptions/", payload, format="multipart")


@pytest.mark.django_db
def test_customer_submission_is_private_and_internal_notes_never_leak(
    authenticated_client, other_user, pharmacist_client
):
    response = submit(authenticated_client)
    assert response.status_code == 201
    prescription_id = response.data["id"]
    prescription = Prescription.objects.get(pk=prescription_id)
    assert prescription.document.name.startswith("prescriptions/")
    assert prescription.original_filename == "prescription.png"
    assert prescription.history.values_list("to_status", flat=True).get() == "SUBMITTED"
    assert Notification.objects.filter(
        user=prescription.customer,
        kind=Notification.Kind.PRESCRIPTION_SUBMITTED,
    ).exists()

    other_client = APIClient()
    other_client.force_authenticate(other_user)
    assert other_client.get(f"/api/v1/prescriptions/{prescription_id}/").status_code == 404
    assert other_client.get(f"/api/v1/prescriptions/{prescription_id}/file/").status_code == 404

    started = pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{prescription_id}/start-review/",
        {"internal_staff_note": "Private pharmacy observation"},
        format="json",
    )
    assert started.status_code == 200
    detail = authenticated_client.get(f"/api/v1/prescriptions/{prescription_id}/")
    assert "internal_staff_note" not in detail.data
    assert "Private pharmacy observation" not in str(detail.data)
    assert (
        authenticated_client.get(f"/api/v1/prescriptions/{prescription_id}/file/").status_code
        == 200
    )


@pytest.mark.django_db
def test_upload_validation_rejects_extension_mime_magic_and_size(authenticated_client):
    executable = SimpleUploadedFile(
        "danger.exe", b"MZ-not-allowed", content_type="application/octet-stream"
    )
    response = authenticated_client.post(
        "/api/v1/prescriptions/",
        {"document": executable},
        format="multipart",
    )
    assert response.status_code == 400

    wrong_mime = image_upload(content_type="application/pdf")
    response = authenticated_client.post(
        "/api/v1/prescriptions/",
        {"document": wrong_mime},
        format="multipart",
    )
    assert response.status_code == 400

    fake_pdf = SimpleUploadedFile(
        "prescription.pdf",
        b"%PDF-1.7\nmissing safe trailer",
        content_type="application/pdf",
    )
    response = authenticated_client.post(
        "/api/v1/prescriptions/",
        {"document": fake_pdf},
        format="multipart",
    )
    assert response.status_code == 400

    with override_settings(PRESCRIPTION_MAX_UPLOAD_BYTES=10):
        response = submit(authenticated_client)
    assert response.status_code == 400


@pytest.mark.django_db
def test_only_pharmacist_can_review_and_transitions_are_validated(
    authenticated_client, pharmacist_client
):
    created = submit(authenticated_client)
    prescription_id = created.data["id"]
    customer_attempt = authenticated_client.post(
        f"/api/v1/staff/prescriptions/{prescription_id}/start-review/",
        {},
        format="json",
    )
    assert customer_attempt.status_code == 403

    started = pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{prescription_id}/start-review/",
        {},
        format="json",
    )
    assert started.status_code == 200
    conflict = pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{prescription_id}/start-review/",
        {},
        format="json",
    )
    assert conflict.status_code == 400

    clarification = pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{prescription_id}/request-clarification/",
        {
            "clarification_request": "لطفاً تاریخ نسخه را واضح‌تر بفرستید.",
            "internal_staff_note": "Date unreadable",
        },
        format="json",
    )
    assert clarification.status_code == 200
    replied = authenticated_client.post(
        f"/api/v1/prescriptions/{prescription_id}/respond/",
        {"response": "نسخه امروز صادر شده است."},
        format="json",
    )
    assert replied.status_code == 200
    assert replied.data["status"] == Prescription.Status.UNDER_REVIEW
    prescription = Prescription.objects.get(pk=prescription_id)
    assert prescription.reviewer.email == "pharmacist@example.test"
    assert prescription.reviewer != prescription.customer


@pytest.mark.django_db
def test_approved_prescription_authorizes_one_order_only(
    authenticated_client,
    pharmacist_client,
    pharmacist,
    user,
    branch,
    medicine,
):
    medicine.prescription_required = True
    medicine.save(update_fields=("prescription_required",))
    created = submit(authenticated_client)
    prescription_id = created.data["id"]
    before_approval = authenticated_client.post(
        f"/api/v1/prescriptions/{prescription_id}/add-authorized-to-cart/",
        {},
        format="json",
    )
    assert before_approval.status_code == 400
    pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{prescription_id}/start-review/",
        {},
        format="json",
    )
    approved = pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{prescription_id}/approve/",
        {
            "expires_at": (timezone.now() + timedelta(days=30)).isoformat(),
            "customer_visible_note": "یک بسته مجاز است.",
            "internal_staff_note": "Verified against original",
            "authorized_items": [
                {
                    "medicine_id": str(medicine.id),
                    "max_quantity": 1,
                    "instructions": "طبق هدایت داکتر",
                }
            ],
        },
        format="json",
    )
    assert approved.status_code == 200
    assert approved.data["reviewer_email"] == "pharmacist@example.test"

    added = authenticated_client.post(
        "/api/v1/cart/items/",
        {
            "medicine_id": str(medicine.id),
            "prescription_id": prescription_id,
            "quantity": 1,
        },
        format="json",
    )
    assert added.status_code == 201
    address = make_address(user)
    order = create_order(customer=user, address=address)
    assert str(order.prescription_id) == prescription_id
    assert order.prescription_status_snapshot == Prescription.Status.APPROVED
    consumed = authenticated_client.get(f"/api/v1/prescriptions/{prescription_id}/")
    assert consumed.status_code == 200
    assert consumed.data["can_add_to_cart"] is False
    placed_notification = Notification.objects.get(
        user=user, order=order, kind=Notification.Kind.ORDER_PLACED
    )
    assert placed_notification.title_en == "Order placed"

    transition_order_status(
        order=order,
        new_status=Order.Status.CONFIRMED,
        actor=pharmacist,
    )
    assert Notification.objects.filter(
        user=user,
        order=order,
        kind=Notification.Kind.ORDER_STATUS_CHANGED,
        title_en="Order confirmed",
    ).exists()

    second = authenticated_client.post(
        "/api/v1/cart/items/",
        {
            "medicine_id": str(medicine.id),
            "prescription_id": prescription_id,
            "quantity": 1,
        },
        format="json",
    )
    assert second.status_code == 400
    assert Order.objects.filter(prescription_id=prescription_id).count() == 1


@pytest.mark.django_db
def test_customer_adds_approved_bundle_to_cart_idempotently(
    authenticated_client,
    pharmacist_client,
    medicine,
):
    medicine.prescription_required = True
    medicine.save(update_fields=("prescription_required",))
    created = submit(authenticated_client)
    prescription_id = created.data["id"]
    pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{prescription_id}/start-review/",
        {},
        format="json",
    )
    approved = pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{prescription_id}/approve/",
        {
            "expires_at": (timezone.now() + timedelta(days=30)).isoformat(),
            "authorized_items": [
                {
                    "medicine_id": str(medicine.id),
                    "max_quantity": 2,
                    "instructions": "Use as directed",
                }
            ],
        },
        format="json",
    )
    assert approved.status_code == 200

    first = authenticated_client.post(
        f"/api/v1/prescriptions/{prescription_id}/add-authorized-to-cart/",
        {},
        format="json",
    )
    assert first.status_code == 200
    assert first.data["added_count"] == 1
    assert first.data["already_present_count"] == 0
    assert first.data["cart"]["item_count"] == 1

    repeated = authenticated_client.post(
        f"/api/v1/prescriptions/{prescription_id}/add-authorized-to-cart/",
        {},
        format="json",
    )
    assert repeated.status_code == 200
    assert repeated.data["added_count"] == 0
    assert repeated.data["already_present_count"] == 1
    assert CartItem.objects.filter(prescription_id=prescription_id, medicine=medicine).count() == 1


@pytest.mark.django_db
def test_bundle_rejects_other_customer_and_conflicting_cart_item(
    authenticated_client,
    other_user,
    pharmacist_client,
    medicine,
):
    medicine.prescription_required = True
    medicine.save(update_fields=("prescription_required",))
    first = submit(authenticated_client)
    first_id = first.data["id"]
    pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{first_id}/start-review/", {}, format="json"
    )
    pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{first_id}/approve/",
        {
            "expires_at": (timezone.now() + timedelta(days=30)).isoformat(),
            "authorized_items": [{"medicine_id": str(medicine.id), "max_quantity": 1}],
        },
        format="json",
    )
    assert (
        authenticated_client.post(
            f"/api/v1/prescriptions/{first_id}/add-authorized-to-cart/", {}, format="json"
        ).status_code
        == 200
    )

    other_client = APIClient()
    other_client.force_authenticate(other_user)
    assert (
        other_client.post(
            f"/api/v1/prescriptions/{first_id}/add-authorized-to-cart/", {}, format="json"
        ).status_code
        == 404
    )

    second = submit(authenticated_client)
    second_id = second.data["id"]
    pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{second_id}/start-review/", {}, format="json"
    )
    pharmacist_client.post(
        f"/api/v1/staff/prescriptions/{second_id}/approve/",
        {
            "expires_at": (timezone.now() + timedelta(days=30)).isoformat(),
            "authorized_items": [{"medicine_id": str(medicine.id), "max_quantity": 1}],
        },
        format="json",
    )
    conflict = authenticated_client.post(
        f"/api/v1/prescriptions/{second_id}/add-authorized-to-cart/",
        {},
        format="json",
    )
    assert conflict.status_code == 400
    assert "other approved prescription" in str(conflict.data)


@pytest.mark.django_db
def test_notifications_are_owner_scoped_filterable_and_readable(
    authenticated_client,
    other_user,
):
    submitted = submit(authenticated_client)
    prescription_id = submitted.data["id"]
    other_notification = Notification.objects.create(
        user=other_user,
        kind=Notification.Kind.PRESCRIPTION_SUBMITTED,
        title="Private",
        message="Other customer",
    )

    listed = authenticated_client.get("/api/v1/notifications/?unread=true")
    assert listed.status_code == 200
    assert len(listed.data["results"]) == 1
    notification = listed.data["results"][0]
    assert notification["prescription_id"] == prescription_id
    assert notification["order_id"] is None
    assert str(other_notification.id) not in str(listed.data)

    marked = authenticated_client.post(
        f"/api/v1/notifications/{notification['id']}/read/", {}, format="json"
    )
    assert marked.status_code == 200
    assert marked.data["read_at"] is not None
    assert authenticated_client.get("/api/v1/notifications/?unread=true").data["count"] == 0

    submit(authenticated_client)
    read_all = authenticated_client.post("/api/v1/notifications/read-all/", {}, format="json")
    assert read_all.status_code == 200
    assert read_all.data["updated"] == 1


@pytest.mark.django_db
def test_customer_can_cancel_only_allowed_states(authenticated_client):
    created = submit(authenticated_client)
    prescription_id = created.data["id"]
    cancelled = authenticated_client.post(
        f"/api/v1/prescriptions/{prescription_id}/cancel/",
        {},
        format="json",
    )
    assert cancelled.status_code == 200
    assert cancelled.data["status"] == Prescription.Status.CANCELLED
    repeated = authenticated_client.post(
        f"/api/v1/prescriptions/{prescription_id}/cancel/",
        {},
        format="json",
    )
    assert repeated.status_code == 400
