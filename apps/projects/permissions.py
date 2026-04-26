from rest_framework import permissions
from apps.users.models import RoleChoices

class IsProjectOwnerOrAdmin(permissions.BasePermission):
    """
    Permissão que permite apenas ao criador do projeto ou administradores 
    do tenant editar ou excluir o objeto.
    """

    def has_object_permission(self, request, view, obj):
        # Super Admins da plataforma sempre podem tudo
        if request.user.is_super_admin:
            return True

        # Verifica se o usuário é o criador
        is_owner = obj.created_by == request.user
        
        # Verifica se o usuário é Admin no Tenant do projeto
        is_admin = request.user.has_tenant_permission(obj.tenant, RoleChoices.ADMIN)
        
        return is_owner or is_admin
