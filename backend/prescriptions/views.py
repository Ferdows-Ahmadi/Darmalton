from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import filters, mixins, response, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import Notification, Prescription
from .permissions import IsPharmacistOrAdministrator, is_pharmacy_reviewer
from .serializers import (
    ApprovalSerializer,
    ClarificationRequestSerializer,
    ClarificationResponseSerializer,
    NotificationSerializer,
    PrescriptionCustomerSerializer,
    PrescriptionStaffSerializer,
    ReviewNoteSerializer,
)
from .services import (
    add_authorized_medicines_to_cart,
    cancel_prescription,
    respond_to_clarification,
    transition_prescription,
)


class PrescriptionFileMixin:
    def file_response(self, request, prescription):
        if not (prescription.customer_id == request.user.id or is_pharmacy_reviewer(request.user)):
            raise Http404
        try:
            handle = prescription.document.open("rb")
        except FileNotFoundError as exc:
            raise Http404 from exc
        as_attachment = request.query_params.get("download") == "1"
        return FileResponse(
            handle,
            as_attachment=as_attachment,
            filename=prescription.original_filename,
            content_type=prescription.content_type,
        )


class PrescriptionViewSet(
    PrescriptionFileMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PrescriptionCustomerSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    queryset = Prescription.objects.none()

    def get_queryset(self):
        return (
            Prescription.objects.filter(customer=self.request.user)
            .select_related("reviewer", "authorization_order")
            .prefetch_related(
                "history",
                "authorized_medicines__medicine",
            )
        )

    @action(detail=True, methods=["get"])
    def file(self, request, pk=None):
        return self.file_response(request, self.get_object())

    @action(detail=True, methods=["post"])
    def respond(self, request, pk=None):
        serializer = ClarificationResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prescription = respond_to_clarification(
            prescription=self.get_object(),
            customer=request.user,
            response=serializer.validated_data["response"],
        )
        return response.Response(
            self.get_serializer(prescription).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        prescription = cancel_prescription(
            prescription=self.get_object(),
            customer=request.user,
        )
        return response.Response(self.get_serializer(prescription).data)

    @action(detail=True, methods=["post"], url_path="add-authorized-to-cart")
    def add_authorized_to_cart(self, request, pk=None):
        from commerce.serializers import CartSerializer

        cart, added, already_present = add_authorized_medicines_to_cart(
            prescription=self.get_object(),
            customer=request.user,
        )
        return response.Response(
            {
                "cart": CartSerializer(cart, context={"request": request}).data,
                "added_count": added,
                "already_present_count": already_present,
            }
        )


class StaffPrescriptionViewSet(
    PrescriptionFileMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PrescriptionStaffSerializer
    permission_classes = (IsPharmacistOrAdministrator,)
    queryset = Prescription.objects.all()
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = (
        "customer__email",
        "customer__phone",
        "patient_name",
        "contact_phone",
        "reviewer__email",
    )
    ordering_fields = ("created_at", "updated_at", "review_started_at", "reviewed_at")
    ordering = ("created_at",)

    def get_queryset(self):
        queryset = (
            Prescription.objects.select_related("customer", "reviewer")
            .prefetch_related("history__actor", "authorized_medicines__medicine")
            .all()
        )
        for field in ("status", "reviewer", "customer"):
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        return queryset

    @action(detail=True, methods=["get"])
    def file(self, request, pk=None):
        return self.file_response(request, self.get_object())

    def _note_data(self, request):
        serializer = ReviewNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    @action(detail=True, methods=["post"], url_path="start-review")
    def start_review(self, request, pk=None):
        notes = self._note_data(request)
        prescription = transition_prescription(
            prescription=self.get_object(),
            actor=request.user,
            new_status=Prescription.Status.UNDER_REVIEW,
            action="review_started",
            **notes,
        )
        return response.Response(self.get_serializer(prescription).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        serializer = ApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prescription = transition_prescription(
            prescription=self.get_object(),
            actor=request.user,
            new_status=Prescription.Status.APPROVED,
            action="approved",
            **serializer.validated_data,
        )
        return response.Response(self.get_serializer(prescription).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        notes = self._note_data(request)
        prescription = transition_prescription(
            prescription=self.get_object(),
            actor=request.user,
            new_status=Prescription.Status.REJECTED,
            action="rejected",
            **notes,
        )
        return response.Response(self.get_serializer(prescription).data)

    @action(detail=True, methods=["post"], url_path="request-clarification")
    def request_clarification(self, request, pk=None):
        serializer = ClarificationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prescription = transition_prescription(
            prescription=self.get_object(),
            actor=request.user,
            new_status=Prescription.Status.CLARIFICATION_REQUESTED,
            action="clarification_requested",
            **serializer.validated_data,
        )
        return response.Response(self.get_serializer(prescription).data)

    @action(detail=True, methods=["post"])
    def expire(self, request, pk=None):
        notes = self._note_data(request)
        prescription = transition_prescription(
            prescription=self.get_object(),
            actor=request.user,
            new_status=Prescription.Status.EXPIRED,
            action="expired_by_staff",
            customer_visible_note=notes.get(
                "customer_visible_note", "اعتبار نسخه پایان یافته است."
            ),
            internal_staff_note=notes.get("internal_staff_note", ""),
        )
        return response.Response(self.get_serializer(prescription).data)


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    queryset = Notification.objects.none()

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user).select_related(
            "prescription", "order"
        )
        if self.request.query_params.get("unread") == "true":
            queryset = queryset.filter(read_at__isnull=True)
        return queryset

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        updated = (
            self.get_queryset()
            .filter(read_at__isnull=True)
            .update(read_at=timezone.now(), updated_at=timezone.now())
        )
        return response.Response({"updated": updated})

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=("read_at", "updated_at"))
        return response.Response(self.get_serializer(notification).data)
