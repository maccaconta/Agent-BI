"""
apps.governance.serializers
───────────────────────────
Serializers para gestão de diretrizes e políticas de IA.
"""
from rest_framework import serializers
from apps.shared_models import PromptTemplate
from apps.governance.models import GlobalAIConfig


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



