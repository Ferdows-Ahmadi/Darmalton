from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, MedicineViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("medicines", MedicineViewSet, basename="medicine")

urlpatterns = router.urls
