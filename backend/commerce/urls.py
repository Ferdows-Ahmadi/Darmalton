from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AddressViewSet, CartItemCreateView, CartItemDetailView, CartView, OrderViewSet

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/items/", CartItemCreateView.as_view(), name="cart-item-create"),
    path("cart/items/<uuid:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("", include(router.urls)),
]
