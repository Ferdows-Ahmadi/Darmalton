from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils import timezone

from common.models import TimeStampedUUIDModel

from .storage import private_cms_storage
from .validators import (
    validate_action_url,
    validate_cms_image,
    validate_cms_image_extension,
    validate_cms_image_size,
)


class PublicationStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PUBLISHED = "PUBLISHED", "Published"
    ARCHIVED = "ARCHIVED", "Archived"


class PublishableQuerySet(models.QuerySet):
    def visible(self, at=None):
        at = at or timezone.now()
        return self.filter(
            status=PublicationStatus.PUBLISHED,
            is_active=True,
        ).filter(
            Q(publish_from__isnull=True) | Q(publish_from__lte=at),
            Q(publish_until__isnull=True) | Q(publish_until__gt=at),
        )


def cms_image_upload_to(instance, filename):
    suffix = Path(filename).suffix.lower()
    now = timezone.now()
    return f"cms/{instance._meta.model_name}/{now:%Y/%m}/{instance.pk}{suffix}"


def cms_mobile_image_upload_to(instance, filename):
    suffix = Path(filename).suffix.lower()
    now = timezone.now()
    return f"cms/{instance._meta.model_name}/{now:%Y/%m}/{instance.pk}-mobile{suffix}"


class PublishableContent(TimeStampedUUIDModel):
    status = models.CharField(
        max_length=16,
        choices=PublicationStatus.choices,
        default=PublicationStatus.DRAFT,
    )
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    publish_from = models.DateTimeField(null=True, blank=True)
    publish_until = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_updated",
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_published",
    )
    published_at = models.DateTimeField(null=True, blank=True)

    objects = PublishableQuerySet.as_manager()

    class Meta:
        abstract = True
        ordering = ("display_order", "created_at")
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(publish_from__isnull=True)
                    | Q(publish_until__isnull=True)
                    | Q(publish_until__gt=F("publish_from"))
                ),
                name="%(app_label)s_%(class)s_valid_window",
            )
        ]
        indexes = [
            models.Index(
                fields=("status", "is_active", "publish_from", "publish_until"),
                name="%(class)s_visibility",
            ),
            models.Index(
                fields=("display_order", "created_at"),
                name="%(class)s_order_idx",
            ),
        ]

    def clean(self):
        super().clean()
        if self.publish_from and self.publish_until and self.publish_until <= self.publish_from:
            raise ValidationError(
                {"publish_until": "Publication end must be later than publication start."}
            )

    @property
    def is_currently_visible(self):
        now = timezone.now()
        return bool(
            self.status == PublicationStatus.PUBLISHED
            and self.is_active
            and (self.publish_from is None or self.publish_from <= now)
            and (self.publish_until is None or self.publish_until > now)
        )

    def save(self, *args, **kwargs):
        image_fields = {
            field.name for field in self._meta.fields if field.name in {"image", "mobile_image"}
        }
        old_images = {}
        if self.pk and image_fields:
            previous = self.__class__.objects.filter(pk=self.pk).values(*image_fields).first()
            old_images = previous or {}
        super().save(*args, **kwargs)
        for field_name, old_image in old_images.items():
            new_image = getattr(getattr(self, field_name, None), "name", "")
            if old_image and old_image != new_image:
                self._meta.get_field(field_name).storage.delete(old_image)

    def delete(self, *args, **kwargs):
        images = []
        for field_name in ("image", "mobile_image"):
            image = getattr(self, field_name, None)
            image_name = getattr(image, "name", "")
            storage = getattr(image, "storage", None)
            if image_name and storage:
                images.append((storage, image_name))
        result = super().delete(*args, **kwargs)
        for storage, image_name in images:
            storage.delete(image_name)
        return result


class PromotionalBanner(PublishableContent):
    class Placement(models.TextChoices):
        HOME_HERO = "HOME_HERO", "Home hero"
        HOME_SECONDARY = "HOME_SECONDARY", "Home secondary"
        CATALOGUE = "CATALOGUE", "Catalogue"

    class TextAlignment(models.TextChoices):
        START = "START", "Start"
        CENTER = "CENTER", "Center"
        END = "END", "End"

    class OverlayStyle(models.TextChoices):
        LIGHT = "LIGHT", "Light text"
        DARK = "DARK", "Dark text"
        NONE = "NONE", "No overlay"

    code = models.SlugField(max_length=80, unique=True)
    placement = models.CharField(
        max_length=24,
        choices=Placement.choices,
        default=Placement.HOME_HERO,
    )
    title = models.CharField(max_length=180, blank=True)
    title_dari = models.CharField(max_length=180)
    title_pashto = models.CharField(max_length=180, blank=True)
    body = models.TextField(blank=True)
    body_dari = models.TextField(blank=True)
    body_pashto = models.TextField(blank=True)
    image = models.ImageField(
        storage=private_cms_storage,
        upload_to=cms_image_upload_to,
        validators=(
            validate_cms_image_extension,
            validate_cms_image_size,
            validate_cms_image,
        ),
    )
    mobile_image = models.ImageField(
        storage=private_cms_storage,
        upload_to=cms_mobile_image_upload_to,
        blank=True,
        validators=(
            validate_cms_image_extension,
            validate_cms_image_size,
            validate_cms_image,
        ),
    )
    alt_text = models.CharField(max_length=180, blank=True)
    alt_text_dari = models.CharField(max_length=180)
    alt_text_pashto = models.CharField(max_length=180, blank=True)
    action_label = models.CharField(max_length=80, blank=True)
    action_label_dari = models.CharField(max_length=80, blank=True)
    action_label_pashto = models.CharField(max_length=80, blank=True)
    action_url = models.CharField(max_length=500, blank=True, validators=(validate_action_url,))
    text_alignment = models.CharField(
        max_length=8,
        choices=TextAlignment.choices,
        default=TextAlignment.START,
    )
    overlay_style = models.CharField(
        max_length=8,
        choices=OverlayStyle.choices,
        default=OverlayStyle.DARK,
    )

    def __str__(self):
        return self.title_dari


class Announcement(PublishableContent):
    class Level(models.TextChoices):
        INFO = "INFO", "Information"
        SUCCESS = "SUCCESS", "Success"
        WARNING = "WARNING", "Warning"
        CRITICAL = "CRITICAL", "Critical"

    class Placement(models.TextChoices):
        GLOBAL = "GLOBAL", "Global"
        HOME = "HOME", "Home"
        CHECKOUT = "CHECKOUT", "Checkout"

    level = models.CharField(max_length=16, choices=Level.choices, default=Level.INFO)
    placement = models.CharField(
        max_length=16,
        choices=Placement.choices,
        default=Placement.GLOBAL,
    )
    title = models.CharField(max_length=180, blank=True)
    title_dari = models.CharField(max_length=180)
    body = models.TextField(blank=True)
    body_dari = models.TextField()
    action_label = models.CharField(max_length=80, blank=True)
    action_label_dari = models.CharField(max_length=80, blank=True)
    action_url = models.CharField(max_length=500, blank=True, validators=(validate_action_url,))

    def __str__(self):
        return self.title_dari


class ContentPage(PublishableContent):
    class ContentType(models.TextChoices):
        INFORMATIONAL = "INFORMATIONAL", "Informational page"
        HEALTH_ARTICLE = "HEALTH_ARTICLE", "Health article"

    content_type = models.CharField(
        max_length=24,
        choices=ContentType.choices,
        default=ContentType.INFORMATIONAL,
    )
    slug = models.SlugField(max_length=120, unique=True)
    title = models.CharField(max_length=180, blank=True)
    title_dari = models.CharField(max_length=180)
    summary = models.TextField(blank=True)
    summary_dari = models.TextField(blank=True)
    body = models.TextField(blank=True)
    body_dari = models.TextField()
    image = models.ImageField(
        storage=private_cms_storage,
        upload_to=cms_image_upload_to,
        blank=True,
        validators=(
            validate_cms_image_extension,
            validate_cms_image_size,
            validate_cms_image,
        ),
    )
    alt_text = models.CharField(max_length=180, blank=True)
    alt_text_dari = models.CharField(max_length=180, blank=True)
    author_source = models.CharField(max_length=180, blank=True)

    def __str__(self):
        return self.title_dari


class FeaturedMedicine(PublishableContent):
    class Placement(models.TextChoices):
        HOME_FEATURED = "HOME_FEATURED", "Home featured"
        HOME_RECOMMENDED = "HOME_RECOMMENDED", "Home recommended"
        CATALOGUE_FEATURED = "CATALOGUE_FEATURED", "Catalogue featured"

    medicine = models.ForeignKey(
        "catalog.Medicine",
        on_delete=models.CASCADE,
        related_name="cms_features",
    )
    placement = models.CharField(
        max_length=24,
        choices=Placement.choices,
        default=Placement.HOME_FEATURED,
    )
    label = models.CharField(max_length=100, blank=True)
    label_dari = models.CharField(max_length=100, blank=True)

    class Meta(PublishableContent.Meta):
        constraints = [
            *PublishableContent.Meta.constraints,
            models.UniqueConstraint(
                fields=("medicine", "placement"),
                name="cms_unique_featured_medicine_placement",
            ),
        ]

    def __str__(self):
        return f"{self.medicine} / {self.get_placement_display()}"
