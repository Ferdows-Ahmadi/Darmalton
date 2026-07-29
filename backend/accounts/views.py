from django.db.models import Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import filters, generics, permissions, response, status
from rest_framework_simplejwt.views import TokenRefreshView

from operations.permissions import IsOperationsStaff

from .models import CustomerProfile, User
from .serializers import (
    CustomerMedicalProfileSerializer,
    GoogleLoginSerializer,
    LoginSerializer,
    RegisterSerializer,
    StaffCustomerSerializer,
    UserSerializer,
    token_payload,
)
from .services import authenticate_google_identity


class RegisterView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return response.Response(token_payload(user), status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return response.Response(token_payload(serializer.validated_data["user"]))


class GoogleLoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = GoogleLoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate_google_identity(serializer.validated_data["id_token"])
        return response.Response(token_payload(user))


class MeView(generics.GenericAPIView):
    serializer_class = UserSerializer

    def get(self, request):
        return response.Response(UserSerializer(request.user).data)


class StaffCustomerListView(generics.ListAPIView):
    serializer_class = StaffCustomerSerializer
    permission_classes = (IsOperationsStaff,)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("email", "phone", "first_name", "last_name")
    ordering_fields = ("created_at", "email", "order_count", "total_spent")
    ordering = ("-created_at",)

    def get_queryset(self):
        return (
            User.objects.filter(role=User.Role.CUSTOMER)
            .annotate(
                order_count=Count("orders", distinct=True),
                total_spent=Coalesce(
                    Sum("orders__grand_total"),
                    Value(0),
                    output_field=DecimalField(max_digits=16, decimal_places=2),
                ),
            )
        )


class CustomerMedicalProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomerMedicalProfileSerializer

    def get_object(self):
        profile, _ = CustomerProfile.objects.get_or_create(user=self.request.user)
        return profile


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
