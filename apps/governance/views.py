"""
apps.governance.views
─────────────────────
Views para gestão de políticas e diretrizes de IA por Administradores.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
# Remover import temporário do spectacular para evitar conflitos de introspecção
from apps.shared_models import PromptTemplate
from apps.governance.models import GlobalAIConfig
from apps.governance.serializers import PromptTemplateSerializer, GlobalAIConfigSerializer


class GlobalAIConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet para as diretrizes mestres de IA (Global System Prompt).
    Centraliza Temperatura, Persona e Limites Técnicos.
    """
    queryset = GlobalAIConfig.objects.all()
    serializer_class = GlobalAIConfigSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        # Garante que sempre exista pelo menos uma configuração padrão se solicitado
        if not GlobalAIConfig.objects.exists():
            GlobalAIConfig.objects.create(
                persona_title="Analista Financeiro Sênior",
                is_active=True
            )
        return GlobalAIConfig.objects.all()


class PromptTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar a Biblioteca de Prompts Especialistas.
    Permite customizar as personas de Risco, Tesouraria, Compliance, etc.
    """
    serializer_class = PromptTemplateSerializer
    queryset = PromptTemplate.objects.all()
    pagination_class = None  # Desativa paginação para facilitar consumo no frontend corporativo
    permission_classes = [permissions.AllowAny] 
    authentication_classes = [] # Desativa autenticação para evitar erros de MockAuth em ambiente dev
    
    def get_queryset(self):
        # Retorna todos os templates públicos
        queryset = self.queryset.filter(is_public=True)
        category = self.request.query_params.get("category")
        
        # Log de debug para rastreamento (aparece no log do servidor Django)
        print(f"[DEBUG] PromptTemplate Query: category={category} | count={queryset.count()}")
        
        if category:
            # Filtro insensível a maiúsculas/minúsculas para maior resiliência
            queryset = queryset.filter(category__iexact=category)
            
        return queryset



