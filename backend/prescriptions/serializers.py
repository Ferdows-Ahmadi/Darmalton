from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from catalog.models import Medicine
from common.phones import normalize_afghan_phone

from .models import (
    Notification,
    Prescription,
    PrescriptionAuthorizedMedicine,
    PrescriptionHistory,
)
from .services import submit_prescription
from .validators import validate_prescription_document


class PrescriptionHistoryCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionHistory
        fields = (
            "id",
            "from_status",
            "to_status",
            "action",
            "customer_visible_note",
            "created_at",
        )


class AuthorizedMedicineSerializer(serializers.ModelSerializer):
    medicine_id = serializers.UUIDField(source="medicine.id", read_only=True)
    medicine_name = serializers.CharField(source="medicine.brand_name", read_only=True)

    class Meta:
        model = PrescriptionAuthorizedMedicine
        fields = (
            "id",
            "medicine_id",
            "medicine_name",
            "max_quantity",
            "instructions",
        )


class PrescriptionCustomerSerializer(serializers.ModelSerializer):
    document = serializers.FileField(write_only=True, required=True)
    history = PrescriptionHistoryCustomerSerializer(many=True, read_only=True)
    authorized_medicines = AuthorizedMedicineSerializer(many=True, read_only=True)
    document_url = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()
    can_respond = serializers.SerializerMethodField()
    can_add_to_cart = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = (
            "id",
            "document",
            "document_url",
            "original_filename",
            "patient_name",
            "contact_phone",
            "delivery_preference",
            "customer_note",
            "status",
            "customer_visible_note",
            "clarification_request",
            "customer_response",
            "expires_at",
            "review_started_at",
            "reviewed_at",
            "created_at",
            "updated_at",
            "can_cancel",
            "can_respond",
            "can_add_to_cart",
            "authorized_medicines",
            "history",
        )
        read_only_fields = (
            "id",
            "document_url",
            "original_filename",
            "status",
            "customer_visible_note",
            "clarification_request",
            "customer_response",
            "expires_at",
            "review_started_at",
            "reviewed_at",
            "created_at",
            "updated_at",
            "can_cancel",
            "can_respond",
            "can_add_to_cart",
            "authorized_medicines",
            "history",
        )

    @extend_schema_field(serializers.URLField())
    def get_document_url(self, obj):
        request = self.context.get("request")
        path = f"/api/v1/prescriptions/{obj.pk}/file/"
        return request.build_absolute_uri(path) if request else path

    @extend_schema_field(serializers.BooleanField())
    def get_can_cancel(self, obj):
        return obj.status in {
            Prescription.Status.SUBMITTED,
            Prescription.Status.CLARIFICATION_REQUESTED,
        }

    @extend_schema_field(serializers.BooleanField())
    def get_can_respond(self, obj):
        return obj.status == Prescription.Status.CLARIFICATION_REQUESTED

    @extend_schema_field(serializers.BooleanField())
    def get_can_add_to_cart(self, obj):
        return (
            obj.status == Prescription.Status.APPROVED
            and obj.expires_at is not None
            and obj.expires_at > timezone.now()
            and bool(obj.authorized_medicines.all())
            and not hasattr(obj, "authorization_order")
        )

    def validate_document(self, value):
        validate_prescription_document(value)
        return value

    def validate_contact_phone(self, value):
        return normalize_afghan_phone(value, allow_blank=True)

    def create(self, validated_data):
        document = validated_data.pop("document")
        return submit_prescription(
            customer=self.context["request"].user,
            document=document,
            **validated_data,
        )


class PrescriptionHistoryStaffSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", allow_null=True, read_only=True)

    class Meta:
        model = PrescriptionHistory
        fields = "__all__"


class PrescriptionStaffSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    reviewer_email = serializers.EmailField(
        source="reviewer.email", allow_null=True, read_only=True
    )
    history = PrescriptionHistoryStaffSerializer(many=True, read_only=True)
    authorized_medicines = AuthorizedMedicineSerializer(many=True, read_only=True)
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = "__all__"

    @extend_schema_field(serializers.URLField())
    def get_document_url(self, obj):
        request = self.context.get("request")
        path = f"/api/v1/staff/prescriptions/{obj.pk}/file/"
        return request.build_absolute_uri(path) if request else path


class AuthorizedMedicineInputSerializer(serializers.Serializer):
    medicine_id = serializers.PrimaryKeyRelatedField(
        source="medicine",
        queryset=Medicine.objects.all(),
    )
    max_quantity = serializers.IntegerField(min_value=1, max_value=100)
    instructions = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_medicine_id(self, medicine):
        if not medicine.prescription_required:
            raise serializers.ValidationError("فقط دوای نسخه‌ای را انتخاب کنید.")
        return medicine


class ApprovalSerializer(serializers.Serializer):
    expires_at = serializers.DateTimeField()
    customer_visible_note = serializers.CharField(required=False, allow_blank=True)
    internal_staff_note = serializers.CharField(required=False, allow_blank=True)
    authorized_items = AuthorizedMedicineInputSerializer(many=True)

    def validate_expires_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("زمان اعتبار باید در آینده باشد.")
        return value

    def validate_authorized_items(self, value):
        ids = [item["medicine"].id for item in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("هر دوا را فقط یک‌بار انتخاب کنید.")
        return value


class ReviewNoteSerializer(serializers.Serializer):
    customer_visible_note = serializers.CharField(required=False, allow_blank=True)
    internal_staff_note = serializers.CharField(required=False, allow_blank=True)


class ClarificationRequestSerializer(ReviewNoteSerializer):
    clarification_request = serializers.CharField()


class ClarificationResponseSerializer(serializers.Serializer):
    response = serializers.CharField()


class NotificationSerializer(serializers.ModelSerializer):
    prescription_id = serializers.UUIDField(
        source="prescription.id", allow_null=True, read_only=True
    )
    order_id = serializers.UUIDField(source="order.id", allow_null=True, read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "kind",
            "title",
            "message",
            "title_en",
            "message_en",
            "prescription_id",
            "order_id",
            "read_at",
            "created_at",
        )
