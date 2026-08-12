from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ChangePasswordView,
    CustomerMedicalProfileView,
    DeactivateAccountView,
    GoogleLoginView,
    LoginView,
    MeView,
    RefreshView,
    RegisterView,
    StaffCustomerListView,
    StaffUserViewSet,
)

router = DefaultRouter()
router.register("staff/users", StaffUserViewSet, basename="staff-user")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google/", GoogleLoginView.as_view(), name="google-login"),
    path("refresh/", RefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("me/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("me/deactivate/", DeactivateAccountView.as_view(), name="deactivate-account"),
    path("staff/customers/", StaffCustomerListView.as_view(), name="staff-customers"),
    path(
        "me/medical-profile/",
        CustomerMedicalProfileView.as_view(),
        name="medical-profile",
    ),
    path("", include(router.urls)),
]
