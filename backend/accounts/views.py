from django.db.models import Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import filters, generics, permissions, response, status, viewsets
from rest_framework_simplejwt.views import TokenRefreshView

from operations.permissions import IsOperationsStaff

from .models import CustomerProfile, User
from .serializers import (
    ChangePasswordSerializer,
    CustomerMedicalProfileSerializer,
    DeactivateAccountSerializer,
    GoogleLoginSerializer,
    LoginSerializer,
    RegisterSerializer,
    StaffCustomerSerializer,
    StaffUserSerializer,
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


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


class DeactivateAccountView(generics.GenericAPIView):
    serializer_class = DeactivateAccountSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.is_active = False
        request.user.save(update_fields=("is_active", "updated_at"))
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class StaffCustomerListView(generics.ListAPIView):
    serializer_class = StaffCustomerSerializer
    permission_classes = (IsOperationsStaff,)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("email", "phone", "first_name", "last_name")
    ordering_fields = ("created_at", "email", "order_count", "total_spent")
    ordering = ("-created_at",)

    def get_queryset(self):
        return User.objects.filter(role=User.Role.CUSTOMER).annotate(
            order_count=Count("orders", distinct=True),
            total_spent=Coalesce(
                Sum("orders__grand_total"),
                Value(0),
                output_field=DecimalField(max_digits=16, decimal_places=2),
            ),
        )


class IsAdministrator(permissions.BasePermission):
    message = "Only administrators may manage user accounts."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.is_superuser or user.role == User.Role.ADMIN)
        )


class StaffUserViewSet(viewsets.ModelViewSet):
    serializer_class = StaffUserSerializer
    permission_classes = (IsAdministrator,)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("email", "phone", "first_name", "last_name")
    ordering_fields = ("created_at", "email", "last_login", "role")
    ordering = ("-created_at",)
    http_method_names = ("get", "post", "patch", "put", "head", "options")
    queryset = User.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get("role", "").strip()
        active = self.request.query_params.get("is_active", "").strip().lower()
        if role:
            queryset = queryset.filter(role=role)
        if active in {"true", "false"}:
            queryset = queryset.filter(is_active=active == "true")
        return queryset


class CustomerMedicalProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomerMedicalProfileSerializer

    def get_object(self):
        profile, _ = CustomerProfile.objects.get_or_create(user=self.request.user)
        return profile


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
