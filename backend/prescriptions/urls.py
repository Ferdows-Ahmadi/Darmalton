from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet, PrescriptionViewSet, StaffPrescriptionViewSet

router = DefaultRouter()
router.register("prescriptions", PrescriptionViewSet, basename="prescription")
router.register(
    "staff/prescriptions",
    StaffPrescriptionViewSet,
    basename="staff-prescription",
)
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [path("", include(router.urls))]
