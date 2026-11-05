from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    message = "Se requiere rol de administración."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "is_admin_role", False))
