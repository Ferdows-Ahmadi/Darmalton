from rest_framework.permissions import BasePermission

from accounts.models import User


def is_pharmacy_reviewer(user):
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or user.role in {User.Role.PHARMACIST, User.Role.ADMIN}
        )
    )


class IsPharmacistOrAdministrator(BasePermission):
    message = "Only pharmacists and administrators may review prescriptions."

    def has_permission(self, request, view):
        return is_pharmacy_reviewer(request.user)
