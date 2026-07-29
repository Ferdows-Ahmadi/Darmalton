from rest_framework.permissions import BasePermission

from accounts.models import User


def is_operations_staff(user):
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or user.is_staff
            or user.role
            in {
                User.Role.PHARMACIST,
                User.Role.STAFF,
                User.Role.ADMIN,
            }
        )
    )


class IsOperationsStaff(BasePermission):
    message = "Only pharmacy operations staff may perform this action."

    def has_permission(self, request, view):
        return is_operations_staff(request.user)
