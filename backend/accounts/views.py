from rest_framework import generics, permissions, response, status
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, token_payload


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


class MeView(generics.GenericAPIView):
    serializer_class = UserSerializer

    def get(self, request):
        return response.Response(UserSerializer(request.user).data)


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
