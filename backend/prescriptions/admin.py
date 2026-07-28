from django.contrib import admin, messages
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import FileResponse, Http404, HttpResponseRedirect
from django.urls import path, reverse
from django.utils.html import format_html
from rest_framework.exceptions import ValidationError as DRFValidationError

from .models import (
    Notification,
    Prescription,
    PrescriptionAuthorizedMedicine,
    PrescriptionHistory,
)
from .permissions import is_pharmacy_reviewer
from .services import transition_prescription


class AuthorizedMedicineInline(admin.TabularInline):
    model = PrescriptionAuthorizedMedicine
    extra = 0
    fields = ("medicine", "max_quantity", "instructions")

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.status != Prescription.Status.UNDER_REVIEW:
            return self.fields
        return ()

    def has_add_permission(self, request, obj=None):
        return bool(
            obj
            and obj.status == Prescription.Status.UNDER_REVIEW
            and super().has_add_permission(request, obj)
        )

    def has_delete_permission(self, request, obj=None):
        return bool(
            obj
            and obj.status == Prescription.Status.UNDER_REVIEW
            and super().has_delete_permission(request, obj)
        )


class HistoryInline(admin.TabularInline):
    model = PrescriptionHistory
    extra = 0
    can_delete = False
    fields = (
        "from_status",
        "to_status",
        "action",
        "actor",
        "customer_visible_note",
        "internal_staff_note",
        "created_at",
    )
    readonly_fields = fields


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    change_form_template = "admin/prescriptions/prescription/change_form.html"
    list_display = (
        "short_id",
        "customer",
        "status",
        "reviewer",
        "created_at",
        "review_started_at",
        "reviewed_at",
        "secure_document",
    )
    list_filter = ("status", "created_at", "review_started_at", "reviewed_at")
    search_fields = (
        "id",
        "customer__email",
        "customer__phone",
        "reviewer__email",
        "patient_name",
        "contact_phone",
    )
    ordering = ("-created_at",)
    date_hierarchy = "created_at"
    readonly_fields = (
        "id",
        "customer",
        "document",
        "original_filename",
        "content_type",
        "size_bytes",
        "status",
        "reviewer",
        "review_started_at",
        "reviewed_at",
        "cancelled_at",
        "created_at",
        "updated_at",
        "secure_document",
    )
    fieldsets = (
        (
            "Submission",
            {
                "fields": (
                    "id",
                    "customer",
                    "status",
                    "secure_document",
                    "document",
                    "original_filename",
                    "content_type",
                    "size_bytes",
                    "patient_name",
                    "contact_phone",
                    "delivery_preference",
                    "customer_note",
                )
            },
        ),
        (
            "Review",
            {
                "fields": (
                    "reviewer",
                    "review_started_at",
                    "reviewed_at",
                    "customer_visible_note",
                    "internal_staff_note",
                    "clarification_request",
                    "customer_response",
                    "expires_at",
                    "cancelled_at",
                )
            },
        ),
        ("Audit timestamps", {"fields": ("created_at", "updated_at")}),
    )
    inlines = (AuthorizedMedicineInline, HistoryInline)
    actions = None

    def _reviewer_allowed(self, request):
        return is_pharmacy_reviewer(request.user)

    def has_module_permission(self, request):
        return self._reviewer_allowed(request) and super().has_module_permission(request)

    def has_view_permission(self, request, obj=None):
        return self._reviewer_allowed(request) and super().has_view_permission(request, obj)

    def has_change_permission(self, request, obj=None):
        return self._reviewer_allowed(request) and super().has_change_permission(request, obj)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description="ID")
    def short_id(self, obj):
        return str(obj.pk)[:8]

    @admin.display(description="Private document")
    def secure_document(self, obj):
        if not obj.pk:
            return "Save first"
        url = reverse(
            "admin:prescriptions_prescription_document",
            kwargs={"object_id": obj.pk},
        )
        return format_html('<a href="{}" target="_blank" rel="noopener">Secure preview</a>', url)

    def get_urls(self):
        custom = [
            path(
                "<path:object_id>/document/",
                self.admin_site.admin_view(self.document_view),
                name="prescriptions_prescription_document",
            )
        ]
        return custom + super().get_urls()

    def document_view(self, request, object_id):
        obj = self.get_object(request, object_id)
        if not obj or not self.has_view_permission(request, obj):
            raise Http404
        try:
            handle = obj.document.open("rb")
        except FileNotFoundError as exc:
            raise Http404 from exc
        return FileResponse(
            handle,
            filename=obj.original_filename,
            content_type=obj.content_type,
        )

    def save_model(self, request, obj, form, change):
        if change:
            obj.save()
            messages.info(request, "Notes saved; status remained unchanged.")
            return
        super().save_model(request, obj, form, change)

    def response_change(self, request, obj):
        action = next(
            (
                name
                for name in (
                    "_start_review",
                    "_request_clarification",
                    "_approve",
                    "_reject",
                    "_expire",
                )
                if name in request.POST
            ),
            None,
        )
        if not action:
            return super().response_change(request, obj)

        try:
            kwargs = {
                "prescription": obj,
                "actor": request.user,
                "customer_visible_note": obj.customer_visible_note,
                "internal_staff_note": obj.internal_staff_note,
            }
            if action == "_start_review":
                transition_prescription(
                    **kwargs,
                    new_status=Prescription.Status.UNDER_REVIEW,
                    action="review_started_admin",
                )
            elif action == "_request_clarification":
                transition_prescription(
                    **kwargs,
                    new_status=Prescription.Status.CLARIFICATION_REQUESTED,
                    action="clarification_requested_admin",
                    clarification_request=obj.clarification_request,
                )
            elif action == "_approve":
                authorized_items = [
                    {
                        "medicine": item.medicine,
                        "max_quantity": item.max_quantity,
                        "instructions": item.instructions,
                    }
                    for item in obj.authorized_medicines.select_related("medicine")
                ]
                transition_prescription(
                    **kwargs,
                    new_status=Prescription.Status.APPROVED,
                    action="approved_admin",
                    expires_at=obj.expires_at,
                    authorized_items=authorized_items,
                )
            elif action == "_reject":
                transition_prescription(
                    **kwargs,
                    new_status=Prescription.Status.REJECTED,
                    action="rejected_admin",
                )
            else:
                transition_prescription(
                    **kwargs,
                    new_status=Prescription.Status.EXPIRED,
                    action="expired_admin",
                )
        except (DjangoValidationError, DRFValidationError) as exc:
            messages.error(request, f"Review action was not applied: {exc}")
        else:
            messages.success(request, "Prescription status updated through the validated workflow.")
        return HttpResponseRedirect(
            reverse(
                "admin:prescriptions_prescription_change",
                kwargs={"object_id": obj.pk},
            )
        )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "kind", "prescription", "read_at", "created_at")
    list_filter = ("kind", "read_at", "created_at")
    search_fields = ("user__email", "title", "message")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(PrescriptionHistory)
class PrescriptionHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "prescription",
        "from_status",
        "to_status",
        "action",
        "actor",
        "created_at",
    )
    list_filter = ("to_status", "action", "created_at")
    search_fields = ("prescription__id", "actor__email")
    readonly_fields = (
        "prescription",
        "from_status",
        "to_status",
        "action",
        "actor",
        "customer_visible_note",
        "internal_staff_note",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
