from datetime import timedelta
from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from PIL import Image

from accounts.models import User
from catalog.models import Medicine
from cms.models import (
    Announcement,
    ContentPage,
    FeaturedMedicine,
    PromotionalBanner,
    PublicationStatus,
)
from cms.services import publish_content

pytestmark = pytest.mark.django_db


def image_upload(name="banner.png", size=(256, 256), content_type="image/png"):
    content = BytesIO()
    Image.new("RGB", size, color=(16, 160, 157)).save(content, format="PNG")
    return SimpleUploadedFile(name, content.getvalue(), content_type=content_type)


def create_user(role=User.Role.CUSTOMER, email=None):
    email = email or f"{role.lower()}@example.test"
    return User.objects.create_user(
        email=email,
        password="Strong-Test-Password-123!",
        role=role,
    )


def create_announcement(**overrides):
    defaults = {
        "title": "Service update",
        "title_dari": "اطلاعیه خدمات",
        "body": "English service information",
        "body_dari": "معلومات خدمات به زبان دری",
    }
    defaults.update(overrides)
    return Announcement.objects.create(**defaults)


def create_health_article(**overrides):
    defaults = {
        "content_type": ContentPage.ContentType.HEALTH_ARTICLE,
        "slug": "safe-medicine-use",
        "title": "Safe medicine use",
        "title_dari": "مصرف امن دوا",
        "summary": "Read labels and follow professional advice.",
        "summary_dari": "برچسب دوا را بخوانید و مشوره متخصص را تعقیب کنید.",
        "body": "This educational article does not replace professional advice.",
        "body_dari": "این مطلب آموزشی جای مشوره داکتر یا فارمسست را نمی‌گیرد.",
        "author_source": "Darmalton pharmacy team",
    }
    defaults.update(overrides)
    return ContentPage.objects.create(**defaults)


def response_results(response):
    return response.data["results"]


def test_public_lists_only_current_published_active_content(api_client):
    now = timezone.now()
    visible = create_announcement(display_order=2)
    publish_content(instance=visible, actor=create_user(User.Role.ADMIN))
    create_announcement(title_dari="پیش‌نویس")
    inactive = create_announcement(title_dari="غیرفعال", is_active=False)
    publish_content(instance=inactive, actor=visible.published_by)
    future = create_announcement(title_dari="زمان‌بندی‌شده")
    publish_content(
        instance=future,
        actor=visible.published_by,
        publish_from=now + timedelta(days=1),
    )
    expired = create_announcement(title_dari="منقضی")
    publish_content(
        instance=expired,
        actor=visible.published_by,
        publish_from=now - timedelta(days=2),
        publish_until=now - timedelta(days=1),
    )

    response = api_client.get(reverse("cms-announcement-list"))

    assert response.status_code == 200
    assert [item["id"] for item in response_results(response)] == [str(visible.id)]
    assert "status" not in response_results(response)[0]
    assert "published_by_email" not in response_results(response)[0]


def test_public_detail_does_not_leak_draft_or_inactive_content(api_client):
    draft = create_announcement()
    inactive = create_announcement(title_dari="غیرفعال", is_active=False)
    publish_content(instance=inactive, actor=create_user(User.Role.STAFF))

    assert api_client.get(reverse("cms-announcement-detail", args=(draft.pk,))).status_code == 404
    assert (
        api_client.get(reverse("cms-announcement-detail", args=(inactive.pk,))).status_code == 404
    )


def test_health_articles_have_dedicated_public_collection(api_client):
    actor = create_user(User.Role.PHARMACIST)
    article = create_health_article()
    publish_content(instance=article, actor=actor)
    page = ContentPage.objects.create(
        slug="about",
        title_dari="درباره",
        body_dari="صفحه معلوماتی",
    )
    publish_content(instance=page, actor=actor)

    articles = api_client.get(reverse("cms-health-article-list"))
    pages = api_client.get(reverse("cms-page-list"))

    assert articles.status_code == 200
    assert [item["slug"] for item in response_results(articles)] == [article.slug]
    assert response_results(articles)[0]["author_source"] == "Darmalton pharmacy team"
    assert response_results(articles)[0]["content_type"] == ContentPage.ContentType.HEALTH_ARTICLE
    assert [item["slug"] for item in response_results(pages)] == [page.slug]


def test_staff_health_article_create_forces_article_type(api_client):
    staff = create_user(User.Role.ADMIN)
    api_client.force_authenticate(staff)
    created = api_client.post(
        reverse("cms-health-article-list"),
        {
            "slug": "storage-safety",
            "title": "Storage safety",
            "title_dari": "نگهداری امن دوا",
            "summary_dari": "دوا را دور از گرما نگه دارید.",
            "body_dari": "شرایط روی بسته را تعقیب کنید.",
            "content_type": ContentPage.ContentType.INFORMATIONAL,
        },
        format="json",
    )

    assert created.status_code == 201
    article = ContentPage.objects.get(pk=created.data["id"])
    assert article.content_type == ContentPage.ContentType.HEALTH_ARTICLE
    assert article.created_by == staff


def test_public_filtering_ordering_and_bilingual_fields(api_client):
    actor = create_user(User.Role.PHARMACIST)
    later = create_announcement(
        title="Checkout update",
        title_dari="اطلاعیه پرداخت",
        placement=Announcement.Placement.CHECKOUT,
        display_order=8,
    )
    first = create_announcement(
        title="Home update",
        title_dari="اطلاعیه خانه",
        placement=Announcement.Placement.HOME,
        display_order=1,
    )
    publish_content(instance=later, actor=actor)
    publish_content(instance=first, actor=actor)

    ordered = api_client.get(reverse("cms-announcement-list"), {"ordering": "display_order"})
    filtered = api_client.get(
        reverse("cms-announcement-list"),
        {"placement": Announcement.Placement.CHECKOUT},
    )

    assert [item["id"] for item in response_results(ordered)] == [str(first.id), str(later.id)]
    assert response_results(filtered)[0]["title"] == "Checkout update"
    assert response_results(filtered)[0]["title_dari"] == "اطلاعیه پرداخت"


@pytest.mark.parametrize("role", [User.Role.STAFF, User.Role.PHARMACIST, User.Role.ADMIN])
def test_authorized_roles_can_create_and_edit_drafts(api_client, role):
    staff = create_user(role, email=f"{role.lower()}-cms@example.test")
    api_client.force_authenticate(staff)
    payload = {
        "title": "Operations notice",
        "title_dari": "اطلاعیه عملیاتی",
        "body": "For testing",
        "body_dari": "برای آزمایش",
        "status": PublicationStatus.PUBLISHED,
    }

    created = api_client.post(reverse("cms-announcement-list"), payload, format="json")
    assert created.status_code == 201
    assert created.data["status"] == PublicationStatus.DRAFT
    assert created.data["created_by_email"] == staff.email

    updated = api_client.patch(
        reverse("cms-announcement-detail", args=(created.data["id"],)),
        {"display_order": 4},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.data["display_order"] == 4
    assert updated.data["updated_by_email"] == staff.email


def test_anonymous_and_customer_writes_are_rejected(api_client):
    url = reverse("cms-announcement-list")
    payload = {
        "title_dari": "اطلاعیه",
        "body_dari": "متن اطلاعیه",
    }

    assert api_client.post(url, payload, format="json").status_code == 401
    api_client.force_authenticate(create_user())
    assert api_client.post(url, payload, format="json").status_code == 403


def test_publish_schedule_archive_and_actor_fields(api_client):
    staff = create_user(User.Role.STAFF)
    api_client.force_authenticate(staff)
    item = create_announcement(created_by=staff, updated_by=staff)
    start = timezone.now() + timedelta(hours=2)
    end = start + timedelta(days=1)

    published = api_client.post(
        reverse("cms-announcement-publish", args=(item.pk,)),
        {"publish_from": start.isoformat(), "publish_until": end.isoformat()},
        format="json",
    )

    assert published.status_code == 200
    item.refresh_from_db()
    assert item.status == PublicationStatus.PUBLISHED
    assert item.published_by == staff
    assert item.published_at is not None
    api_client.force_authenticate(user=None)
    assert api_client.get(reverse("cms-announcement-detail", args=(item.pk,))).status_code == 404

    api_client.force_authenticate(staff)
    archived = api_client.post(reverse("cms-announcement-archive", args=(item.pk,)))
    assert archived.status_code == 200
    assert archived.data["status"] == PublicationStatus.ARCHIVED


def test_invalid_publication_window_and_action_url_are_rejected(api_client):
    staff = create_user(User.Role.ADMIN)
    api_client.force_authenticate(staff)
    item = create_announcement()
    now = timezone.now()

    invalid_window = api_client.post(
        reverse("cms-announcement-publish", args=(item.pk,)),
        {
            "publish_from": now.isoformat(),
            "publish_until": (now - timedelta(minutes=1)).isoformat(),
        },
        format="json",
    )
    invalid_link = api_client.post(
        reverse("cms-announcement-list"),
        {
            "title_dari": "پیوند ناسالم",
            "body_dari": "متن",
            "action_label_dari": "بازکردن",
            "action_url": "javascript:alert(1)",
        },
        format="json",
    )

    assert invalid_window.status_code == 400
    assert invalid_link.status_code == 400


def test_banner_image_validation_and_private_draft_bytes(api_client, tmp_path, settings):
    settings.PRIVATE_MEDIA_ROOT = tmp_path
    staff = create_user(User.Role.ADMIN)
    api_client.force_authenticate(staff)
    base = {
        "code": "summer-care",
        "title_dari": "مراقبت تابستانی",
        "alt_text_dari": "محصولات صحی",
    }
    invalid = api_client.post(
        reverse("cms-banner-list"),
        {**base, "image": SimpleUploadedFile("bad.png", b"not-an-image", "image/png")},
        format="multipart",
    )
    assert invalid.status_code == 400

    created = api_client.post(
        reverse("cms-banner-list"),
        {**base, "image": image_upload()},
        format="multipart",
    )
    assert created.status_code == 201
    image_url = reverse("cms-banner-image", args=(created.data["id"],))
    api_client.force_authenticate(user=None)
    assert api_client.get(image_url).status_code == 404

    api_client.force_authenticate(staff)
    assert (
        api_client.post(reverse("cms-banner-publish", args=(created.data["id"],))).status_code
        == 200
    )
    api_client.force_authenticate(user=None)
    image_response = api_client.get(image_url)
    assert image_response.status_code == 200
    assert image_response["X-Content-Type-Options"] == "nosniff"
    assert image_response["Cache-Control"] == "public, no-cache"


def test_content_page_object_retrieval_and_staff_deletion(api_client):
    staff = create_user(User.Role.STAFF)
    page = ContentPage.objects.create(
        slug="privacy-guide",
        title="Privacy guide",
        title_dari="راهنمای محرمیت",
        body="English content",
        body_dari="محتوای دری",
        created_by=staff,
        updated_by=staff,
    )
    publish_content(instance=page, actor=staff)

    public_detail = api_client.get(reverse("cms-page-detail", args=(page.pk,)))
    assert public_detail.status_code == 200
    assert public_detail.data["slug"] == "privacy-guide"

    api_client.force_authenticate(staff)
    deleted = api_client.delete(reverse("cms-page-detail", args=(page.pk,)))
    assert deleted.status_code == 204
    assert not ContentPage.objects.filter(pk=page.pk).exists()


def test_featured_medicine_visibility_and_uniqueness(api_client, medicine):
    staff = create_user(User.Role.PHARMACIST)
    feature = FeaturedMedicine.objects.create(
        medicine=medicine,
        label_dari="پیشنهاد ویژه",
        created_by=staff,
        updated_by=staff,
    )
    publish_content(instance=feature, actor=staff)

    response = api_client.get(reverse("cms-featured-medicine-list"))
    assert response.status_code == 200
    assert response_results(response)[0]["medicine_id"] == medicine.id

    medicine.status = Medicine.Status.INACTIVE
    medicine.save(update_fields=("status", "updated_at"))
    hidden = api_client.get(reverse("cms-featured-medicine-list"))
    assert response_results(hidden) == []


def test_all_cms_routes_are_available(api_client):
    for route in (
        "cms-banner-list",
        "cms-announcement-list",
        "cms-page-list",
        "cms-featured-medicine-list",
    ):
        assert api_client.get(reverse(route)).status_code == 200


def test_django_admin_preview_serves_private_draft_image(client, tmp_path, settings):
    settings.PRIVATE_MEDIA_ROOT = tmp_path
    admin_user = create_user(User.Role.ADMIN, email="cms-admin@example.test")
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save(update_fields=("is_staff", "is_superuser", "updated_at"))
    banner = PromotionalBanner.objects.create(
        code="private-preview",
        title_dari="پیش‌نمایش خصوصی",
        alt_text_dari="تصویر خصوصی",
        image=image_upload(),
        created_by=admin_user,
        updated_by=admin_user,
    )
    client.force_login(admin_user)

    preview = client.get(reverse("admin:cms_promotionalbanner_preview", args=(banner.pk,)))

    assert preview.status_code == 200
    assert "private" in preview["Cache-Control"]
    assert "no-store" in preview["Cache-Control"]
    assert preview["X-Content-Type-Options"] == "nosniff"
