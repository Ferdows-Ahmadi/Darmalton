import mimetypes

from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.http import FileResponse, Http404
from django.urls import path, reverse
from django.utils.html import format_html

from .models import Announcement, ContentPage, FeaturedMedicine, PromotionalBanner
from .permissions import is_cms_staff
from .services import archive_content, publish_content


class CmsAdminPermissionMixin:
    def has_module_permission(self, request):
        return is_cms_staff(request.user) and super().has_module_permission(request)

    def has_view_permission(self, request, obj=None):
        return is_cms_staff(request.user) and super().has_view_permission(request, obj)

    def has_add_permission(self, request):
        return is_cms_staff(request.user) and super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        return is_cms_staff(request.user) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return is_cms_staff(request.user) and super().has_delete_permission(request, obj)


@admin.action(description="Publish selected content now")
def publish_selected(modeladmin, request, queryset):
    updated = 0
    for instance in queryset:
        publish_content(
            instance=instance,
            actor=request.user,
            publish_until=instance.publish_until,
        )
        updated += 1
    modeladmin.message_user(request, f"Published {updated} item(s).", messages.SUCCESS)


@admin.action(description="Archive selected content")
def archive_selected(modeladmin, request, queryset):
    updated = 0
    for instance in queryset:
        archive_content(instance=instance, actor=request.user)
        updated += 1
    modeladmin.message_user(request, f"Archived {updated} item(s).", messages.SUCCESS)


class PublishableAdmin(CmsAdminPermissionMixin, admin.ModelAdmin):
    list_filter = ("status", "is_active", "publish_from", "publish_until")
    readonly_fields = (
        "status",
        "created_by",
        "updated_by",
        "published_by",
        "published_at",
        "created_at",
        "updated_at",
    )
    actions = (publish_selected, archive_selected)

    def save_model(self, request, obj, form, change):
        if not change or not obj.created_by_id:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


class ImagePreviewMixin:
    readonly_fields = ("image_preview",)

    def get_urls(self):
        name = f"{self.opts.app_label}_{self.opts.model_name}_preview"
        preview_url = path(
            "<path:object_id>/preview/",
            self.admin_site.admin_view(self.preview_image),
            name=name,
        )
        return [preview_url, *super().get_urls()]

    def preview_image(self, request, object_id):
        obj = self.get_object(request, object_id)
        if not obj or not self.has_view_permission(request, obj):
            raise PermissionDenied
        if not obj.image:
            raise Http404
        content_type = mimetypes.guess_type(obj.image.name)[0] or "application/octet-stream"
        result = FileResponse(
            obj.image.storage.open(obj.image.name, "rb"), content_type=content_type
        )
        result["Cache-Control"] = "private, no-cache"
        result["X-Content-Type-Options"] = "nosniff"
        return result

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if not obj or not obj.image:
            return "No image"
        preview_name = f"admin:{self.opts.app_label}_{self.opts.model_name}_preview"
        return format_html(
            '<img src="{}" alt="" style="max-height:100px;max-width:180px;object-fit:contain">',
            reverse(preview_name, args=(obj.pk,)),
        )


@admin.register(PromotionalBanner)
class PromotionalBannerAdmin(ImagePreviewMixin, PublishableAdmin):
    list_display = (
        "code",
        "title_dari",
        "placement",
        "status",
        "is_active",
        "display_order",
        "publish_from",
        "publish_until",
        "image_preview",
    )
    list_filter = PublishableAdmin.list_filter + ("placement",)
    search_fields = (
        "code",
        "title",
        "title_dari",
        "title_pashto",
        "body",
        "body_dari",
        "body_pashto",
    )
    readonly_fields = PublishableAdmin.readonly_fields + ImagePreviewMixin.readonly_fields


@admin.register(Announcement)
class AnnouncementAdmin(PublishableAdmin):
    list_display = (
        "title_dari",
        "level",
        "placement",
        "status",
        "is_active",
        "display_order",
        "publish_from",
        "publish_until",
    )
    list_filter = PublishableAdmin.list_filter + ("level", "placement")
    search_fields = ("title", "title_dari", "body", "body_dari")


@admin.register(ContentPage)
class ContentPageAdmin(ImagePreviewMixin, PublishableAdmin):
    list_display = (
        "slug",
        "content_type",
        "title_dari",
        "status",
        "is_active",
        "display_order",
        "publish_from",
        "updated_at",
        "image_preview",
    )
    list_filter = PublishableAdmin.list_filter + ("content_type",)
    search_fields = ("slug", "title", "title_dari", "summary", "summary_dari")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = PublishableAdmin.readonly_fields + ImagePreviewMixin.readonly_fields


@admin.register(FeaturedMedicine)
class FeaturedMedicineAdmin(PublishableAdmin):
    list_display = (
        "medicine",
        "placement",
        "label_dari",
        "status",
        "is_active",
        "display_order",
        "publish_from",
        "publish_until",
    )
    list_filter = PublishableAdmin.list_filter + ("placement",)
    search_fields = (
        "medicine__sku",
        "medicine__brand_name",
        "medicine__brand_name_dari",
        "label",
        "label_dari",
    )
    autocomplete_fields = ("medicine",)
