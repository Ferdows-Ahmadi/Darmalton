from rest_framework.permissions import BasePermission

from accounts.models import User


def is_cms_staff(user):
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or user.is_staff
            or user.role in {User.Role.ADMIN, User.Role.STAFF, User.Role.PHARMACIST}
        )
    )


class IsCmsStaff(BasePermission):
    message = "Only authorized pharmacy staff may manage CMS content."

    def has_permission(self, request, view):
        return is_cms_staff(request.user)
