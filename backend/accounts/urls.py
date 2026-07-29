from django.urls import path

from .views import (
    CustomerMedicalProfileView,
    GoogleLoginView,
    LoginView,
    MeView,
    RefreshView,
    RegisterView,
    StaffCustomerListView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google/", GoogleLoginView.as_view(), name="google-login"),
    path("refresh/", RefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("staff/customers/", StaffCustomerListView.as_view(), name="staff-customers"),
    path(
        "me/medical-profile/",
        CustomerMedicalProfileView.as_view(),
        name="medical-profile",
    ),
]
