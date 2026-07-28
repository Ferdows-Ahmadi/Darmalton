from django.apps import apps
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import (
    Notification,
    Prescription,
    PrescriptionAuthorizedMedicine,
    PrescriptionHistory,
)

ALLOWED_TRANSITIONS = {
    Prescription.Status.SUBMITTED: {
        Prescription.Status.UNDER_REVIEW,
        Prescription.Status.CANCELLED,
    },
    Prescription.Status.UNDER_REVIEW: {
        Prescription.Status.CLARIFICATION_REQUESTED,
        Prescription.Status.APPROVED,
        Prescription.Status.REJECTED,
    },
    Prescription.Status.CLARIFICATION_REQUESTED: {
        Prescription.Status.UNDER_REVIEW,
        Prescription.Status.CANCELLED,
    },
    Prescription.Status.APPROVED: {Prescription.Status.EXPIRED},
    Prescription.Status.REJECTED: set(),
    Prescription.Status.EXPIRED: set(),
    Prescription.Status.CANCELLED: set(),
}

NOTIFICATION_COPY = {
    Prescription.Status.SUBMITTED: (
        Notification.Kind.PRESCRIPTION_SUBMITTED,
        "نسخه دریافت شد",
        "نسخه شما با موفقیت دریافت شد و در صف بررسی قرار دارد.",
    ),
    Prescription.Status.UNDER_REVIEW: (
        Notification.Kind.REVIEW_STARTED,
        "بررسی نسخه آغاز شد",
        "فارمسست بررسی نسخه شما را آغاز کرده است.",
    ),
    Prescription.Status.CLARIFICATION_REQUESTED: (
        Notification.Kind.CLARIFICATION_REQUESTED,
        "معلومات بیشتر لازم است",
        "فارمسست درباره نسخه شما توضیح بیشتر خواسته است.",
    ),
    Prescription.Status.APPROVED: (
        Notification.Kind.PRESCRIPTION_APPROVED,
        "نسخه تأیید شد",
        "نسخه شما تأیید شد و دواهای مجاز را می‌توانید به سبد بیفزایید.",
    ),
    Prescription.Status.REJECTED: (
        Notification.Kind.PRESCRIPTION_REJECTED,
        "نسخه رد شد",
        "نسخه شما تأیید نشد. یادداشت فارمسست را بررسی کنید.",
    ),
    Prescription.Status.EXPIRED: (
        Notification.Kind.PRESCRIPTION_EXPIRED,
        "اعتبار نسخه پایان یافت",
        "مهلت استفاده از نسخه تأییدشده پایان یافته است.",
    ),
    Prescription.Status.CANCELLED: (
        Notification.Kind.PRESCRIPTION_CANCELLED,
        "نسخه لغو شد",
        "درخواست نسخه لغو شد.",
    ),
}


def _notify(prescription, status):
    kind, title, message = NOTIFICATION_COPY[status]
    Notification.objects.create(
        user=prescription.customer,
        prescription=prescription,
        kind=kind,
        title=title,
        message=message,
    )


@transaction.atomic
def submit_prescription(*, customer, document, **details):
    prescription = Prescription.objects.create(
        customer=customer,
        document=document,
        original_filename=document.name[:255],
        content_type=(getattr(document, "content_type", "") or "")[:100],
        size_bytes=document.size,
        **details,
    )
    PrescriptionHistory.objects.create(
        prescription=prescription,
        from_status="",
        to_status=Prescription.Status.SUBMITTED,
        action="submitted",
        actor=customer,
        customer_visible_note="نسخه برای بررسی ارسال شد.",
    )
    _notify(prescription, Prescription.Status.SUBMITTED)
    return prescription


@transaction.atomic
def transition_prescription(
    *,
    prescription,
    actor,
    new_status,
    action,
    customer_visible_note="",
    internal_staff_note="",
    clarification_request="",
    customer_response="",
    expires_at=None,
    authorized_items=None,
):
    locked = (
        Prescription.objects.select_for_update()
        .select_related("customer", "reviewer")
        .get(pk=prescription.pk)
    )
    if new_status not in ALLOWED_TRANSITIONS.get(locked.status, set()):
        raise ValidationError(
            f"Cannot transition prescription from {locked.status} to {new_status}."
        )

    now = timezone.now()
    previous = locked.status
    locked.status = new_status
    update_fields = ["status", "updated_at"]

    if new_status == Prescription.Status.UNDER_REVIEW:
        if previous == Prescription.Status.SUBMITTED:
            locked.review_started_at = now
            update_fields.append("review_started_at")
        if previous == Prescription.Status.CLARIFICATION_REQUESTED:
            locked.customer_response = customer_response.strip()
            update_fields.append("customer_response")
        locked.reviewer = actor
        update_fields.append("reviewer")

    if new_status == Prescription.Status.CLARIFICATION_REQUESTED:
        if not clarification_request.strip():
            raise ValidationError(
                {"clarification_request": "درخواست توضیح نمی‌تواند خالی باشد."}
            )
        locked.clarification_request = clarification_request.strip()
        update_fields.append("clarification_request")

    if new_status == Prescription.Status.APPROVED:
        if not expires_at or expires_at <= now:
            raise ValidationError({"expires_at": "زمان اعتبار باید در آینده باشد."})
        if not authorized_items:
            raise ValidationError(
                {"authorized_items": "حداقل یک دوای نسخه‌ای را انتخاب کنید."}
            )
        locked.expires_at = expires_at
        locked.reviewed_at = now
        update_fields.extend(["expires_at", "reviewed_at"])

    if new_status == Prescription.Status.REJECTED:
        if not customer_visible_note.strip():
            raise ValidationError(
                {"customer_visible_note": "دلیل قابل مشاهده برای مشتری لازم است."}
            )
        locked.reviewed_at = now
        update_fields.append("reviewed_at")

    if new_status == Prescription.Status.CANCELLED:
        locked.cancelled_at = now
        update_fields.append("cancelled_at")

    if customer_visible_note:
        locked.customer_visible_note = customer_visible_note.strip()
        update_fields.append("customer_visible_note")
    if internal_staff_note:
        locked.internal_staff_note = internal_staff_note.strip()
        update_fields.append("internal_staff_note")

    locked.save(update_fields=tuple(dict.fromkeys(update_fields)))

    if new_status == Prescription.Status.APPROVED:
        PrescriptionAuthorizedMedicine.objects.filter(prescription=locked).delete()
        PrescriptionAuthorizedMedicine.objects.bulk_create(
            [
                PrescriptionAuthorizedMedicine(
                    prescription=locked,
                    medicine=item["medicine"],
                    max_quantity=item["max_quantity"],
                    instructions=item.get("instructions", "").strip(),
                )
                for item in authorized_items
            ]
        )

    PrescriptionHistory.objects.create(
        prescription=locked,
        from_status=previous,
        to_status=new_status,
        action=action,
        actor=actor,
        customer_visible_note=customer_visible_note.strip(),
        internal_staff_note=internal_staff_note.strip(),
    )
    _notify(locked, new_status)
    return locked


def respond_to_clarification(*, prescription, customer, response):
    if prescription.customer_id != customer.id:
        raise ValidationError("This prescription does not belong to you.")
    if not response.strip():
        raise ValidationError({"response": "پاسخ نمی‌تواند خالی باشد."})
    return transition_prescription(
        prescription=prescription,
        actor=customer,
        new_status=Prescription.Status.UNDER_REVIEW,
        action="clarification_responded",
        customer_visible_note="پاسخ مشتری برای بررسی دوباره ارسال شد.",
        customer_response=response,
    )


def cancel_prescription(*, prescription, customer):
    if prescription.customer_id != customer.id:
        raise ValidationError("This prescription does not belong to you.")
    return transition_prescription(
        prescription=prescription,
        actor=customer,
        new_status=Prescription.Status.CANCELLED,
        action="cancelled_by_customer",
        customer_visible_note="نسخه توسط مشتری لغو شد.",
    )


@transaction.atomic
def validate_prescription_authorization(
    *, prescription, customer, medicine, quantity, lock=False
):
    queryset = Prescription.objects
    if lock:
        queryset = queryset.select_for_update()
    locked = queryset.get(pk=prescription.pk)
    now = timezone.now()
    if locked.status == Prescription.Status.APPROVED and locked.expires_at <= now:
        locked.status = Prescription.Status.EXPIRED
        locked.save(update_fields=("status", "updated_at"))
        PrescriptionHistory.objects.create(
            prescription=locked,
            from_status=Prescription.Status.APPROVED,
            to_status=Prescription.Status.EXPIRED,
            action="expired_automatically",
            actor=None,
            customer_visible_note="اعتبار نسخه پایان یافته است.",
        )
        _notify(locked, Prescription.Status.EXPIRED)

    if locked.customer_id != customer.id:
        raise ValidationError("The selected prescription does not belong to this customer.")
    if locked.status != Prescription.Status.APPROVED:
        raise ValidationError("An approved prescription is required for this medicine.")
    if not locked.expires_at or locked.expires_at <= now:
        raise ValidationError("The selected prescription has expired.")

    Order = apps.get_model("commerce", "Order")
    if Order.objects.filter(prescription=locked).exists():
        raise ValidationError("This prescription has already been used for an order.")

    authorization = locked.authorized_medicines.filter(medicine=medicine).first()
    if not authorization:
        raise ValidationError("This medicine is not authorized by the selected prescription.")
    if quantity > authorization.max_quantity:
        raise ValidationError(
            f"Only {authorization.max_quantity} units are authorized by this prescription."
        )
    return locked
