from rest_framework import generics, permissions, response, status
from rest_framework_simplejwt.views import TokenRefreshView

from .models import CustomerProfile
from .serializers import (
    CustomerMedicalProfileSerializer,
    GoogleLoginSerializer,
    LoginSerializer,
    RegisterSerializer,
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


class CustomerMedicalProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomerMedicalProfileSerializer

    def get_object(self):
        profile, _ = CustomerProfile.objects.get_or_create(user=self.request.user)
        return profile


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
