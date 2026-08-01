from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ManufacturerViewSet, MedicineImageViewSet, MedicineViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("manufacturers", ManufacturerViewSet, basename="manufacturer")
router.register("medicines", MedicineViewSet, basename="medicine")
router.register("medicine-images", MedicineImageViewSet, basename="medicine-image")

urlpatterns = router.urls
