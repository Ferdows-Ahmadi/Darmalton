from rest_framework.routers import DefaultRouter

from .views import (
    InventoryBatchOperationsViewSet,
    InventoryTransactionViewSet,
    PurchaseOrderViewSet,
    ReturnRequestViewSet,
    StaffReturnRequestViewSet,
    StorageLocationViewSet,
    SupplierViewSet,
    WarehouseViewSet,
)

router = DefaultRouter()
router.register("operations/suppliers", SupplierViewSet, basename="supplier")
router.register(
    "operations/purchase-orders",
    PurchaseOrderViewSet,
    basename="purchase-order",
)
router.register("operations/warehouses", WarehouseViewSet, basename="warehouse")
router.register(
    "operations/storage-locations",
    StorageLocationViewSet,
    basename="storage-location",
)
router.register(
    "operations/inventory-batches",
    InventoryBatchOperationsViewSet,
    basename="operations-inventory-batch",
)
router.register(
    "operations/inventory-transactions",
    InventoryTransactionViewSet,
    basename="inventory-transaction",
)
router.register("returns", ReturnRequestViewSet, basename="return-request")
router.register(
    "operations/returns",
    StaffReturnRequestViewSet,
    basename="operations-return-request",
)

urlpatterns = router.urls
