from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    DosageFormViewSet,
    ManufacturerViewSet,
    MedicineImageViewSet,
    MedicineImportViewSet,
    MedicineViewSet,
    StaffCategoryViewSet,
    StaffManufacturerViewSet,
    StaffMedicineViewSet,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("manufacturers", ManufacturerViewSet, basename="manufacturer")
router.register("dosage-forms", DosageFormViewSet, basename="dosage-form")
router.register("medicines", MedicineViewSet, basename="medicine")
router.register("medicine-images", MedicineImageViewSet, basename="medicine-image")
router.register("staff/medicines", StaffMedicineViewSet, basename="staff-medicine")
router.register("staff/medicine-imports", MedicineImportViewSet, basename="staff-medicine-import")
router.register("staff/categories", StaffCategoryViewSet, basename="staff-category")
router.register("staff/manufacturers", StaffManufacturerViewSet, basename="staff-manufacturer")

urlpatterns = router.urls
