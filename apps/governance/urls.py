"""
apps.governance.urls
────────────────────
Rotas para gestão de políticas e diretrizes de IA por Administradores.
"""
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from apps.governance.views import (
    PromptTemplateViewSet, GlobalAIConfigViewSet, CostGovernanceViewSet, AgentSystemPromptViewSet
)
 
class OptionalSlashRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = r'(?:/)?'

router = OptionalSlashRouter()
router.register(r"prompt-templates", PromptTemplateViewSet, basename="prompt-templates")
router.register(r"global-config", GlobalAIConfigViewSet, basename="global-config")
router.register(r"system-prompts", AgentSystemPromptViewSet, basename="system-prompts")
router.register(r"costs", CostGovernanceViewSet, basename="costs")
 
urlpatterns = [
    path('', include(router.urls)),
]
