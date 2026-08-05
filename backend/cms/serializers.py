from django.urls import reverse
from rest_framework import serializers

from catalog.models import Medicine

from .models import Announcement, ContentPage, FeaturedMedicine, PromotionalBanner
from .permissions import is_cms_staff
from .validators import CMS_IMAGE_CONTENT_TYPES

PUBLICATION_FIELDS = (
    "id",
    "status",
    "is_active",
    "display_order",
    "publish_from",
    "publish_until",
    "created_by_email",
    "updated_by_email",
    "published_by_email",
    "published_at",
    "created_at",
    "updated_at",
)


class PublishableContentSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(required=False, default=True)
    created_by_email = serializers.EmailField(
        source="created_by.email", allow_null=True, read_only=True
    )
    updated_by_email = serializers.EmailField(
        source="updated_by.email", allow_null=True, read_only=True
    )
    published_by_email = serializers.EmailField(
        source="published_by.email", allow_null=True, read_only=True
    )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if not request or not is_cms_staff(request.user):
            for field in (
                "status",
                "is_active",
                "created_by_email",
                "updated_by_email",
                "published_by_email",
                "published_at",
            ):
                data.pop(field, None)
        return data

    def validate(self, attrs):
        action_url = attrs.get("action_url", getattr(self.instance, "action_url", ""))
        action_label = attrs.get("action_label", getattr(self.instance, "action_label", ""))
        action_label_dari = attrs.get(
            "action_label_dari", getattr(self.instance, "action_label_dari", "")
        )
        if hasattr(self.Meta.model, "action_url"):
            if action_url and not (action_label or action_label_dari):
                raise serializers.ValidationError(
                    {"action_label_dari": "Provide an action label when an action URL is set."}
                )
            if (action_label or action_label_dari) and not action_url:
                raise serializers.ValidationError(
                    {"action_url": "Provide an action URL when an action label is set."}
                )
        return attrs


class ImageContentSerializer(PublishableContentSerializer):
    image_url = serializers.SerializerMethodField()
    image_route_name = ""

    def get_image_url(self, obj) -> str | None:
        if not obj.image:
            return None
        path = reverse(self.image_route_name, kwargs={"pk": obj.pk})
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path

    def validate_image(self, value):
        if getattr(value, "content_type", "") not in CMS_IMAGE_CONTENT_TYPES:
            raise serializers.ValidationError("Upload a JPEG, PNG, or WebP image.")
        return value


class PromotionalBannerSerializer(ImageContentSerializer):
    image_route_name = "cms-banner-image"

    class Meta:
        model = PromotionalBanner
        fields = PUBLICATION_FIELDS + (
            "code",
            "placement",
            "title",
            "title_dari",
            "body",
            "body_dari",
            "image",
            "image_url",
            "alt_text",
            "alt_text_dari",
            "action_label",
            "action_label_dari",
            "action_url",
        )
        read_only_fields = (
            "id",
            "status",
            "publish_from",
            "publish_until",
            "published_at",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {"image": {"write_only": True}}


class AnnouncementSerializer(PublishableContentSerializer):
    class Meta:
        model = Announcement
        fields = PUBLICATION_FIELDS + (
            "level",
            "placement",
            "title",
            "title_dari",
            "body",
            "body_dari",
            "action_label",
            "action_label_dari",
            "action_url",
        )
        read_only_fields = (
            "id",
            "status",
            "publish_from",
            "publish_until",
            "published_at",
            "created_at",
            "updated_at",
        )


class ContentPageSerializer(ImageContentSerializer):
    image_route_name = "cms-page-image"

    class Meta:
        model = ContentPage
        fields = PUBLICATION_FIELDS + (
            "slug",
            "title",
            "title_dari",
            "summary",
            "summary_dari",
            "body",
            "body_dari",
            "image",
            "image_url",
            "alt_text",
            "alt_text_dari",
        )
        read_only_fields = (
            "id",
            "status",
            "publish_from",
            "publish_until",
            "published_at",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {"image": {"write_only": True}}


class FeaturedMedicineSerializer(PublishableContentSerializer):
    medicine_id = serializers.PrimaryKeyRelatedField(
        source="medicine",
        queryset=Medicine.objects.all(),
    )
    medicine_name = serializers.CharField(source="medicine.brand_name", read_only=True)
    medicine_name_dari = serializers.CharField(source="medicine.brand_name_dari", read_only=True)

    class Meta:
        model = FeaturedMedicine
        fields = PUBLICATION_FIELDS + (
            "medicine_id",
            "medicine_name",
            "medicine_name_dari",
            "placement",
            "label",
            "label_dari",
        )
        read_only_fields = (
            "id",
            "status",
            "publish_from",
            "publish_until",
            "published_at",
            "created_at",
            "updated_at",
        )


class PublicationScheduleSerializer(serializers.Serializer):
    publish_from = serializers.DateTimeField(required=False, allow_null=True)
    publish_until = serializers.DateTimeField(required=False, allow_null=True)

    def validate(self, attrs):
        publish_from = attrs.get("publish_from")
        publish_until = attrs.get("publish_until")
        if publish_from and publish_until and publish_until <= publish_from:
            raise serializers.ValidationError(
                {"publish_until": "Publication end must be later than publication start."}
            )
        return attrs
