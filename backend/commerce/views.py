from django.shortcuts import get_object_or_404
from rest_framework import generics, mixins, response, status, viewsets
from rest_framework.decorators import action

from .models import CartItem, CustomerAddress, Order
from .serializers import (
    AddressSerializer,
    CartItemSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderSerializer,
    OrderStatusHistorySerializer,
)
from .services import get_or_create_cart


class CartView(generics.GenericAPIView):
    serializer_class = CartSerializer

    def get(self, request):
        cart = get_or_create_cart(request.user)
        return response.Response(CartSerializer(cart, context={"request": request}).data)


class CartItemCreateView(generics.GenericAPIView):
    serializer_class = CartItemSerializer

    def post(self, request):
        cart = get_or_create_cart(request.user)
        existing = cart.items.filter(medicine_id=request.data.get("medicine_id")).first()
        payload = request.data.copy()
        if existing:
            try:
                payload["quantity"] = existing.quantity + int(request.data.get("quantity", 0))
            except (TypeError, ValueError):
                payload["quantity"] = request.data.get("quantity")
        serializer = CartItemSerializer(
            existing,
            data=payload,
            context={"request": request, "cart": cart},
        )
        serializer.is_valid(raise_exception=True)
        if existing:
            item = serializer.save()
        else:
            item = serializer.save(cart=cart)
        return response.Response(
            CartItemSerializer(item, context={"request": request}).data,
            status=status.HTTP_200_OK if existing else status.HTTP_201_CREATED,
        )


class CartItemDetailView(generics.GenericAPIView):
    serializer_class = CartItemSerializer

    def get_object(self, request, pk):
        return get_object_or_404(
            CartItem.objects.select_related("cart", "medicine"),
            pk=pk,
            cart__customer=request.user,
            cart__status="ACTIVE",
        )

    def patch(self, request, pk):
        item = self.get_object(request, pk)
        serializer = CartItemSerializer(
            item,
            data=request.data,
            partial=True,
            context={"request": request, "cart": item.cart},
        )
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        return response.Response(CartItemSerializer(item, context={"request": request}).data)

    def delete(self, request, pk):
        self.get_object(request, pk).delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    queryset = CustomerAddress.objects.none()

    def get_queryset(self):
        return CustomerAddress.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        instance.delete()


class OrderViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = OrderSerializer
    queryset = Order.objects.none()

    def get_queryset(self):
        return (
            Order.objects.filter(customer=self.request.user)
            .select_related("branch")
            .prefetch_related("items", "status_history")
        )

    def create(self, request, *args, **kwargs):
        input_serializer = CheckoutSerializer(data=request.data, context={"request": request})
        input_serializer.is_valid(raise_exception=True)
        order = input_serializer.save()
        return response.Response(
            OrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="status-history")
    def status_history(self, request, pk=None):
        order = self.get_object()
        return response.Response(
            OrderStatusHistorySerializer(order.status_history.all(), many=True).data
        )
