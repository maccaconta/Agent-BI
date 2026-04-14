"""
apps.governance.urls
────────────────────
Rotas para gestão de políticas e diretrizes de IA por Administradores.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.governance.views import PromptTemplateViewSet, GlobalAIConfigViewSet
 
router = DefaultRouter()
router.register(r"prompt-templates", PromptTemplateViewSet, basename="prompt-templates")
router.register(r"system-prompts", GlobalAIConfigViewSet, basename="system-prompts")
 
urlpatterns = [
    path("", include(router.urls)),
]
