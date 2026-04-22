"""
apps.governance.serializers
───────────────────────────
Serializers para gestão de diretrizes e políticas de IA.
"""
from rest_framework import serializers
from apps.shared_models import PromptTemplate
from apps.governance.models import GlobalAIConfig, AgentSystemPrompt


class PromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptTemplate
        fields = [
            "id", "name", "description", "content", 
            "category", "variables", "is_public", "version"
        ]
        read_only_fields = ["id"]


class GlobalAIConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalAIConfig
        fields = "__all__"
        read_only_fields = ["id", "tenant"]


class AgentSystemPromptSerializer(serializers.ModelSerializer):
    """
    Serializer para manutenção manual dos prompts de sistema dos agentes.
    """
    class Meta:
        model = AgentSystemPrompt
        fields = [
            "id", "agent_key", "name", "description", 
            "content", "is_active", "version", "updated_at"
        ]
        read_only_fields = ["id", "agent_key", "updated_at"]



