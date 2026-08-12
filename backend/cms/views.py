import hashlib
import mimetypes

from django.http import FileResponse, HttpResponseNotModified
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import filters, permissions, response, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from catalog.models import Medicine

from .models import Announcement, ContentPage, FeaturedMedicine, PromotionalBanner
from .permissions import IsCmsStaff, is_cms_staff
from .serializers import (
    AnnouncementSerializer,
    ContentPageSerializer,
    FeaturedMedicineSerializer,
    HealthArticleSerializer,
    PromotionalBannerSerializer,
    PublicationScheduleSerializer,
)
from .services import archive_content, publish_content


class PublishableContentViewSet(viewsets.ModelViewSet):
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    ordering_fields = ("display_order", "created_at", "updated_at", "publish_from")
    ordering = ("display_order", "created_at")
    filter_fields = ()

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsCmsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        staff_request = is_cms_staff(self.request.user)
        if not staff_request:
            queryset = queryset.visible()

        for field in self.filter_fields:
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})

        if staff_request:
            status_value = self.request.query_params.get("status")
            is_active = self.request.query_params.get("is_active")
            if status_value:
                queryset = queryset.filter(status=status_value)
            if is_active:
                normalized = is_active.strip().lower()
                if normalized in {"true", "false"}:
                    queryset = queryset.filter(is_active=normalized == "true")
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @extend_schema(request=PublicationScheduleSerializer)
    @action(detail=True, methods=("post",), permission_classes=(IsCmsStaff,))
    def publish(self, request, pk=None):
        schedule = PublicationScheduleSerializer(data=request.data)
        schedule.is_valid(raise_exception=True)
        updated = publish_content(
            instance=self.get_object(),
            actor=request.user,
            publish_from=schedule.validated_data.get("publish_from") or timezone.now(),
            publish_until=schedule.validated_data.get("publish_until"),
        )
        return response.Response(self.serializer_class(updated, context={"request": request}).data)

    @extend_schema(request=None)
    @action(detail=True, methods=("post",), permission_classes=(IsCmsStaff,))
    def archive(self, request, pk=None):
        updated = archive_content(instance=self.get_object(), actor=request.user)
        return response.Response(self.serializer_class(updated, context={"request": request}).data)


class ImageContentViewSet(PublishableContentViewSet):
    @extend_schema(responses={(200, "image/*"): OpenApiTypes.BINARY})
    @action(detail=True, methods=("get",), url_path="image")
    def image(self, request, pk=None):
        instance = self.get_object()
        if not instance.image:
            return response.Response(status=404)
        storage = instance.image.storage
        size = storage.size(instance.image.name)
        etag = hashlib.sha256(
            f"{instance.pk}:{instance.updated_at.timestamp()}:{size}".encode()
        ).hexdigest()
        if request.headers.get("If-None-Match", "").strip('"') == etag:
            return HttpResponseNotModified()
        content_type = mimetypes.guess_type(instance.image.name)[0] or "application/octet-stream"
        result = FileResponse(storage.open(instance.image.name, "rb"), content_type=content_type)
        result["Cache-Control"] = "public, no-cache"
        result["ETag"] = f'"{etag}"'
        result["X-Content-Type-Options"] = "nosniff"
        return result


class PromotionalBannerViewSet(ImageContentViewSet):
    serializer_class = PromotionalBannerSerializer
    queryset = PromotionalBanner.objects.all()
    search_fields = ("code", "title", "title_dari", "body", "body_dari")
    filter_fields = ("placement",)


class AnnouncementViewSet(PublishableContentViewSet):
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.all()
    search_fields = ("title", "title_dari", "body", "body_dari")
    filter_fields = ("placement", "level")


class ContentPageViewSet(ImageContentViewSet):
    serializer_class = ContentPageSerializer
    queryset = ContentPage.objects.filter(content_type=ContentPage.ContentType.INFORMATIONAL)
    search_fields = ("slug", "title", "title_dari", "summary", "summary_dari")
    filter_fields = ("slug",)

    def perform_create(self, serializer):
        serializer.save(
            content_type=ContentPage.ContentType.INFORMATIONAL,
            created_by=self.request.user,
            updated_by=self.request.user,
        )


class HealthArticleViewSet(ImageContentViewSet):
    serializer_class = HealthArticleSerializer
    queryset = ContentPage.objects.filter(content_type=ContentPage.ContentType.HEALTH_ARTICLE)
    search_fields = (
        "slug",
        "title",
        "title_dari",
        "summary",
        "summary_dari",
        "body",
        "body_dari",
        "author_source",
    )
    filter_fields = ("slug",)

    def perform_create(self, serializer):
        serializer.save(
            content_type=ContentPage.ContentType.HEALTH_ARTICLE,
            created_by=self.request.user,
            updated_by=self.request.user,
        )


class FeaturedMedicineViewSet(PublishableContentViewSet):
    serializer_class = FeaturedMedicineSerializer
    queryset = FeaturedMedicine.objects.select_related("medicine")
    search_fields = (
        "medicine__sku",
        "medicine__brand_name",
        "medicine__brand_name_dari",
        "label",
        "label_dari",
    )
    filter_fields = ("placement", "medicine")

    def get_queryset(self):
        queryset = super().get_queryset()
        if not is_cms_staff(self.request.user):
            queryset = queryset.filter(medicine__status=Medicine.Status.ACTIVE)
        return queryset
