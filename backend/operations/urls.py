from rest_framework.routers import DefaultRouter

from .views import PurchaseOrderViewSet, SupplierViewSet

router = DefaultRouter()
router.register("operations/suppliers", SupplierViewSet, basename="supplier")
router.register(
    "operations/purchase-orders",
    PurchaseOrderViewSet,
    basename="purchase-order",
)

urlpatterns = router.urls
