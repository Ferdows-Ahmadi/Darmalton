from rest_framework.routers import DefaultRouter

from .views import SupplierViewSet

router = DefaultRouter()
router.register("operations/suppliers", SupplierViewSet, basename="supplier")

urlpatterns = router.urls
