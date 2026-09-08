from datetime import timedelta
from decimal import Decimal
from io import BytesIO, StringIO
from urllib.parse import urlparse

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone
from PIL import Image
from rest_framework.exceptions import ValidationError

from accounts.models import User
from catalog.models import (
    Category,
    DosageForm,
    InventoryBatch,
    Manufacturer,
    Medicine,
    MedicineImage,
)
from commerce.models import Cart, CartItem, CustomerAddress, Order
from commerce.services import create_order, transition_order_status

pytestmark = pytest.mark.django_db


def uploaded_png(name="medicine.png", size=(320, 320), color=(17, 159, 154)):
    content = BytesIO()
    Image.new("RGB", size, color).save(content, format="PNG")
    return SimpleUploadedFile(name, content.getvalue(), content_type="image/png")


def make_address(user):
    return CustomerAddress.objects.create(
        user=user,
        label="Home",
        recipient_name="Test Buyer",
        recipient_phone="+93-700-000-000",
        province="Kabul",
        city="Kabul",
        street_address="Test Street 1",
    )


def add_cart(user, branch, medicine, quantity=1):
    cart = Cart.objects.create(customer=user, branch=branch)
    CartItem.objects.create(cart=cart, medicine=medicine, quantity=quantity)
    return cart


def test_registration_and_authentication(api_client):
    payload = {
        "email": "new@example.test",
        "password": "Strong-New-Password-123!",
        "first_name": "New",
        "last_name": "Buyer",
        "phone": "۰۷۰۰ ۱۲۳ ۴۵۶",
    }
    response = api_client.post(reverse("register"), payload, format="json")
    assert response.status_code == 201
    assert response.data["user"]["email"] == payload["email"]
    assert response.data["access"]
    assert User.objects.get(email=payload["email"]).check_password(payload["password"])
    assert response.data["user"]["phone"] == "+93700123456"

    login = api_client.post(
        reverse("login"),
        {"email": payload["email"], "password": payload["password"]},
        format="json",
    )
    assert login.status_code == 200
    assert login.data["refresh"]


def test_medicine_listing_search_and_anonymous_access(api_client, medicine):
    listing = api_client.get("/api/v1/medicines/?search=Ingredient")
    assert listing.status_code == 200
    assert listing.data["count"] == 1
    assert listing.data["results"][0]["brand_name"] == "TestMed"
    assert "brand_name_dari" in listing.data["results"][0]
    assert "description_dari" in listing.data["results"][0]
    assert listing.data["results"][0]["price"] == "10.00"

    medicine.brand_name_dari = "داروی آزمایشی"
    medicine.save(update_fields=["brand_name_dari"])
    by_dari_name = api_client.get("/api/v1/medicines/?search=آزمایشی")
    assert by_dari_name.status_code == 200
    assert by_dari_name.data["count"] == 1

    by_slug = api_client.get(f"/api/v1/medicines/?category={medicine.category.slug}")
    assert by_slug.status_code == 200
    assert by_slug.data["count"] == 1

    by_id = api_client.get(f"/api/v1/medicines/?category={medicine.category_id}")
    assert by_id.status_code == 200
    assert by_id.data["count"] == 1


def test_public_catalogue_isolates_legacy_demo_rows_and_filters_families(api_client, medicine):
    medicine.family_code = "family-testmed"
    medicine.shopper_category = Medicine.ShopperCategory.MEDICINES
    medicine.save(update_fields=("family_code", "shopper_category", "updated_at"))
    demo_category = Category.objects.create(name="Legacy demo", slug="legacy-demo")
    demo_manufacturer = Manufacturer.objects.create(name="Legacy Demo Maker")
    demo_form = DosageForm.objects.create(code="DEMO_TABLET", name="Demo tablet")
    Medicine.objects.create(
        sku="DEMO-999",
        brand_name="Old demonstration item",
        category=demo_category,
        manufacturer=demo_manufacturer,
        dosage_form=demo_form,
    )

    public = api_client.get("/api/v1/medicines/?family_code=family-testmed")
    shopper = api_client.get("/api/v1/medicines/?shopper_category=medicines")
    categories = api_client.get("/api/v1/categories/")
    manufacturers = api_client.get("/api/v1/manufacturers/")

    assert public.status_code == 200
    assert [row["sku"] for row in public.data["results"]] == [medicine.sku]
    assert all(row["sku"] != "DEMO-999" for row in shopper.data["results"])
    assert all(row["slug"] != demo_category.slug for row in categories.data)
    assert all(row["name"] != demo_manufacturer.name for row in manufacturers.data)
    assert manufacturers.data[0]["product_count"] == 1
    assert api_client.get("/api/v1/medicines/?shopper_category=unknown").status_code == 400


def test_family_listing_returns_one_card_and_preserves_exact_variants(api_client, medicine):
    medicine.family_code = "family-two-strengths"
    medicine.save(update_fields=("family_code", "updated_at"))
    second = Medicine.objects.create(
        sku="MED-FAMILY-2",
        brand_name=medicine.brand_name,
        brand_name_dari=medicine.brand_name_dari,
        generic_name=medicine.generic_name,
        manufacturer=medicine.manufacturer,
        category=medicine.category,
        dosage_form=medicine.dosage_form,
        strength="20 mg",
        pack_size="20 tablets",
        family_code=medicine.family_code,
    )

    listing = api_client.get("/api/v1/medicines/?family_listing=true")
    exact_family = api_client.get(f"/api/v1/medicines/?family_code={medicine.family_code}")
    exact_detail = api_client.get(f"/api/v1/medicines/{second.id}/")

    assert listing.status_code == 200
    assert listing.data["count"] == 1
    assert {row["id"] for row in listing.data["results"][0]["family_variants"]} == {
        str(medicine.id),
        str(second.id),
    }
    assert exact_family.data["count"] == 2
    assert exact_detail.data["sku"] == second.sku


def test_medicine_catalogue_filters_are_server_validated(api_client, medicine):
    manufacturer_id = str(medicine.manufacturer_id)
    assert api_client.get("/api/v1/manufacturers/").data[0]["id"] == manufacturer_id

    cases = (
        (f"manufacturer={manufacturer_id}", 1),
        ("prescription_required=false", 1),
        ("prescription_required=true", 0),
        ("in_stock=true", 1),
        ("in_stock=false", 0),
        ("min_price=9&max_price=10", 1),
        ("min_price=11", 0),
        ("ordering=price", 1),
        ("ordering=-price", 1),
    )
    for query, expected in cases:
        response = api_client.get(f"/api/v1/medicines/?{query}")
        assert response.status_code == 200
        assert response.data["count"] == expected

    assert api_client.get("/api/v1/medicines/?in_stock=maybe").status_code == 400
    assert api_client.get("/api/v1/medicines/?min_price=20&max_price=10").status_code == 400
    assert api_client.get("/api/v1/medicines/?ordering=unknown").status_code == 400


def test_address_crud_location_default_and_validation(authenticated_client, user):
    payload = {
        "label": "خانه",
        "recipient_name": "Test Buyer",
        "recipient_phone": "+93-700-000-000",
        "country_code": "AF",
        "province": "Kabul",
        "city": "Kabul",
        "district": "4",
        "street_address": "Test Street 1",
        "landmark": "Near the clinic",
        "delivery_instructions": "Call at the gate",
        "latitude": "34.555300",
        "longitude": "69.207500",
        "is_default": False,
    }
    first = authenticated_client.post("/api/v1/addresses/", payload, format="json")
    assert first.status_code == 201
    assert first.data["is_default"] is True
    assert first.data["delivery_instructions"] == "Call at the gate"
    assert first.data["latitude"] == "34.555300"
    assert first.data["recipient_phone"] == "+93700000000"

    second = authenticated_client.post(
        "/api/v1/addresses/",
        {**payload, "label": "دفتر", "street_address": "Office Street", "is_default": True},
        format="json",
    )
    assert second.status_code == 201
    assert not user.addresses.get(pk=first.data["id"]).is_default

    invalid = authenticated_client.patch(
        f"/api/v1/addresses/{second.data['id']}/",
        {"latitude": "91.000000"},
        format="json",
    )
    assert invalid.status_code == 400

    deleted = authenticated_client.delete(f"/api/v1/addresses/{second.data['id']}/")
    assert deleted.status_code == 204
    assert user.addresses.get(pk=first.data["id"]).is_default


def test_account_language_preference_is_validated_and_persisted(authenticated_client, user):
    updated = authenticated_client.patch(
        "/api/v1/auth/me/",
        {"preferred_language": "en"},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.data["preferred_language"] == "en"
    user.refresh_from_db()
    assert user.preferred_language == "en"

    invalid = authenticated_client.patch(
        "/api/v1/auth/me/",
        {"preferred_language": "ps"},
        format="json",
    )
    assert invalid.status_code == 400


@pytest.mark.django_db(transaction=True)
def test_staff_can_manage_and_public_can_read_medicine_images(
    api_client, medicine, settings, tmp_path
):
    settings.MEDIA_ROOT = tmp_path
    staff = User.objects.create_user(
        email="staff@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
    )
    api_client.force_authenticate(staff)

    first = api_client.post(
        "/api/v1/medicine-images/",
        {
            "medicine_id": str(medicine.id),
            "image": uploaded_png(),
            "alt_text": "Front of TestMed package",
        },
        format="multipart",
    )
    assert first.status_code == 201
    assert first.data["is_primary"] is True
    assert first.data["image_url"].endswith(f"/api/v1/medicine-images/{first.data['id']}/content/")

    second = api_client.post(
        "/api/v1/medicine-images/",
        {
            "medicine_id": str(medicine.id),
            "image": uploaded_png("side.png", color=(10, 80, 120)),
            "is_primary": "true",
        },
        format="multipart",
    )
    assert second.status_code == 201
    assert MedicineImage.objects.get(pk=second.data["id"]).is_primary
    assert not MedicineImage.objects.get(pk=first.data["id"]).is_primary

    listing = api_client.get(f"/api/v1/medicines/{medicine.id}/")
    assert listing.status_code == 200
    assert len(listing.data["images"]) == 2
    assert listing.data["image_url"] == second.data["image_url"]

    api_client.force_authenticate(user=None)
    content_path = urlparse(second.data["image_url"]).path
    content = api_client.get(content_path)
    assert content.status_code == 200
    assert content["Content-Type"] == "image/png"
    assert content["Cache-Control"].startswith("public")
    assert content["ETag"]
    content.close()

    api_client.force_authenticate(staff)
    deleted = api_client.delete(f"/api/v1/medicine-images/{second.data['id']}/")
    assert deleted.status_code == 204
    assert MedicineImage.objects.get(pk=first.data["id"]).is_primary


def test_medicine_image_upload_validation_and_permissions(
    api_client, user, medicine, settings, tmp_path
):
    settings.MEDIA_ROOT = tmp_path
    api_client.force_authenticate(user)
    forbidden = api_client.post(
        "/api/v1/medicine-images/",
        {"medicine_id": str(medicine.id), "image": uploaded_png()},
        format="multipart",
    )
    assert forbidden.status_code == 403

    admin = User.objects.create_superuser(
        email="admin@example.test", password="Strong-Test-Password-123!"
    )
    api_client.force_authenticate(admin)
    invalid = SimpleUploadedFile("medicine.png", b"not an image", content_type="image/png")
    rejected = api_client.post(
        "/api/v1/medicine-images/",
        {"medicine_id": str(medicine.id), "image": invalid},
        format="multipart",
    )
    assert rejected.status_code == 400
    assert rejected.data["error"]["fields"]["image"]

    too_small = api_client.post(
        "/api/v1/medicine-images/",
        {
            "medicine_id": str(medicine.id),
            "image": uploaded_png("tiny.png", size=(64, 64)),
        },
        format="multipart",
    )
    assert too_small.status_code == 400
    assert too_small.data["error"]["fields"]["image"]


def test_missing_medicine_image_file_returns_safe_fallback(
    api_client, medicine, settings, tmp_path
):
    settings.MEDIA_ROOT = tmp_path
    image = MedicineImage.objects.create(medicine=medicine, image="products/missing.webp")

    response = api_client.get(f"/api/v1/medicine-images/{image.id}/content/")

    assert response.status_code == 200
    assert response["Content-Type"] == "image/svg+xml"
    assert response["X-Content-Type-Options"] == "nosniff"
    response.close()


def test_missing_medicine_image_report_excludes_uploaded_images(medicine, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    before = StringIO()
    call_command("report_missing_medicine_images", stdout=before)
    assert str(medicine.id) in before.getvalue()

    MedicineImage.objects.create(medicine=medicine, image=uploaded_png())
    after = StringIO()
    call_command("report_missing_medicine_images", stdout=after)
    assert str(medicine.id) not in after.getvalue()
    assert "Missing usable images: 0" in after.getvalue()


def test_cart_rejects_negative_quantity(authenticated_client, medicine):
    response = authenticated_client.post(
        "/api/v1/cart/items/",
        {"medicine_id": str(medicine.id), "quantity": -1},
        format="json",
    )
    assert response.status_code == 400
    assert response.data["error"]["fields"]


def test_cart_addition_cannot_exceed_stock(authenticated_client, medicine):
    first = authenticated_client.post(
        "/api/v1/cart/items/",
        {"medicine_id": str(medicine.id), "quantity": 4},
        format="json",
    )
    assert first.status_code == 201
    second = authenticated_client.post(
        "/api/v1/cart/items/",
        {"medicine_id": str(medicine.id), "quantity": 2},
        format="json",
    )
    assert second.status_code == 400


def test_prescription_medicine_requires_review(authenticated_client, user, branch, medicine):
    medicine.prescription_required = True
    medicine.save(update_fields=["prescription_required"])

    response = authenticated_client.post(
        "/api/v1/cart/items/",
        {"medicine_id": str(medicine.id), "quantity": 1},
        format="json",
    )
    assert response.status_code == 400
    assert "نسخه تأییدشده" in str(response.data["error"]["fields"])

    cart = Cart.objects.get(customer=user, status=Cart.Status.ACTIVE)
    CartItem.objects.create(cart=cart, medicine=medicine, quantity=1)
    address = make_address(user)
    with pytest.raises(ValidationError, match="approved prescription"):
        create_order(customer=user, address=address)
    assert cart.status == Cart.Status.ACTIVE


def test_address_and_order_ownership(authenticated_client, other_user):
    other_address = make_address(other_user)
    assert authenticated_client.get(f"/api/v1/addresses/{other_address.id}/").status_code == 404
    assert authenticated_client.get("/api/v1/orders/").data["count"] == 0


def test_inactive_medicine_rejected(user, branch, medicine):
    add_cart(user, branch, medicine)
    address = make_address(user)
    medicine.status = Medicine.Status.INACTIVE
    medicine.save()
    with pytest.raises(Exception, match="no longer available"):
        create_order(customer=user, address=address)
    assert Order.objects.count() == 0


def test_expired_and_insufficient_stock_roll_back(user, branch, medicine):
    InventoryBatch.objects.filter(medicine=medicine).update(
        expiry_date=timezone.localdate() - timedelta(days=1)
    )
    cart = add_cart(user, branch, medicine, quantity=2)
    address = make_address(user)
    with pytest.raises(Exception, match="Insufficient stock"):
        create_order(customer=user, address=address)
    assert Order.objects.count() == 0
    assert cart.items.count() == 1


def test_server_price_fefo_stock_and_snapshots(user, branch, medicine):
    early = InventoryBatch.objects.create(
        medicine=medicine,
        branch=branch,
        batch_number="B-EARLY",
        expiry_date=timezone.localdate() + timedelta(days=30),
        available_quantity=1,
        purchase_price=Decimal("7.00"),
        selling_price=Decimal("12.50"),
    )
    late = InventoryBatch.objects.get(batch_number="B-LATE")
    add_cart(user, branch, medicine, quantity=3)
    order = create_order(customer=user, address=make_address(user))

    assert order.subtotal == Decimal("37.50")
    assert order.grand_total == Decimal("37.50")
    item = order.items.get()
    assert item.medicine_name == "TestMed"
    assert item.unit_price == Decimal("12.50")
    assert list(
        item.allocations.order_by("batch__expiry_date").values_list("quantity", flat=True)
    ) == [1, 2]
    early.refresh_from_db()
    late.refresh_from_db()
    assert early.available_quantity == 0
    assert late.available_quantity == 3
    assert order.status_history.get().to_status == Order.Status.PENDING
    assert not Cart.objects.filter(customer=user, status=Cart.Status.ACTIVE).exists()


def test_status_transition_validation_and_history(user, branch, medicine):
    add_cart(user, branch, medicine)
    order = create_order(customer=user, address=make_address(user))
    confirmed = transition_order_status(
        order=order, new_status=Order.Status.CONFIRMED, actor=user, note="Test"
    )
    assert confirmed.status == Order.Status.CONFIRMED
    assert confirmed.status_history.count() == 2
    with pytest.raises(Exception, match="Cannot transition"):
        transition_order_status(order=confirmed, new_status=Order.Status.DELIVERED, actor=user)


def test_order_api_recalculates_and_is_owner_scoped(authenticated_client, user, branch, medicine):
    add_cart(user, branch, medicine, quantity=2)
    address = make_address(user)
    response = authenticated_client.post(
        "/api/v1/orders/",
        {"address_id": str(address.id), "grand_total": "0.01", "status": "DELIVERED"},
        format="json",
    )
    assert response.status_code == 201
    assert response.data["grand_total"] == "20.00"
    assert response.data["status"] == Order.Status.PENDING
