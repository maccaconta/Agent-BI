from rest_framework import serializers

from .models import DataDomain, DataSubDomain, Project

class DataDomainSerializer(serializers.ModelSerializer):
    tenant_name = serializers.ReadOnlyField(source='tenant.name')
    owner_name = serializers.ReadOnlyField(source='owner.full_name')
    project_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = DataDomain
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 
            'description', 'icon', 'owner', 'owner_name',
            'project_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DataSubDomainSerializer(serializers.ModelSerializer):
    domain_name = serializers.ReadOnlyField(source='domain.name')

    class Meta:
        model = DataSubDomain
        fields = ['id', 'domain', 'domain_name', 'name', 'description']

class ProjectDomainSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem dentro de domínios"""
    class Meta:
        model = Project
        fields = ['id', 'name', 'status']


class ProjectSerializer(serializers.ModelSerializer):
    tenant_name = serializers.ReadOnlyField(source="tenant.name")
    domain_name = serializers.ReadOnlyField(source="domain.name")
    subdomain_name = serializers.ReadOnlyField(source="subdomain.name")

    class Meta:
        model = Project
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "domain",
            "domain_name",
            "subdomain",
            "subdomain_name",
            "name",
            "description",
            "domain_data_owner",
            "data_confidentiality",
            "crawler_frequency",
            "analysis_max_rows",
            "intake_metadata",
            "status",
            "s3_path",
            "glue_database",
            "athena_workgroup",
            "tags",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "data_ready",
            "pending_datasets_count",
            "blueprint_widgets",
        ]
        read_only_fields = [
            "id",
            "tenant",
            "tenant_name",
            "domain_name",
            "subdomain_name",
            "s3_path",
            "glue_database",
            "athena_workgroup",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "data_ready",
            "pending_datasets_count",
            "blueprint_widgets",
        ]

    data_ready = serializers.SerializerMethodField()
    pending_datasets_count = serializers.SerializerMethodField()
    blueprint_widgets = serializers.SerializerMethodField()

    def get_blueprint_widgets(self, obj) -> list:
        """Retorna a configuração de widgets e SQLs caso o projeto seja um BLUEPRINT."""
        if obj.status != "BLUEPRINT":
            return []
        
        # Busca o último dashboard publicado (Blueprint) do projeto
        from apps.dashboards.models import Dashboard
        from apps.governance.models import WidgetScriptBinding
        
        blueprint_dash = obj.dashboards.filter(status="PUBLISHED").order_by("-created_at").first()
        if not blueprint_dash:
            return []
            
        bindings = WidgetScriptBinding.objects.filter(dashboard=blueprint_dash).order_by("widget_id")
        
        widgets = []
        for b in bindings:
            widgets.append({
                "id": b.widget_id,
                "prompt": b.prompt,
                "sql": b.script_content,
                "type": b.script_type, # Pode precisar mapear de volta para CHART/BIGNUMBER se necessário
                "title": b.widget_id # Fallback se não houver título salvo
            })
        return widgets

    def get_data_ready(self, obj) -> bool:
        from apps.datasets.models import DatasetStatus
        return not obj.datasets.filter(is_deleted=False).exclude(status=DatasetStatus.READY).exists()

    def get_pending_datasets_count(self, obj) -> int:
        from apps.datasets.models import DatasetStatus
        return obj.datasets.filter(is_deleted=False).exclude(status=DatasetStatus.READY).count()


class ProjectIntakeCreateSerializer(serializers.Serializer):
    dashboard = serializers.CharField(max_length=255)
    dataDomain = serializers.CharField(max_length=100)
    domainDataOwner = serializers.CharField(required=False, allow_blank=True, default="")
    confidentiality = serializers.CharField(required=False, allow_blank=True, default="")
    crawlFrequency = serializers.CharField(required=False, allow_blank=True, default="")
    objective = serializers.CharField(required=False, allow_blank=True, default="")
    specialist_prompt_id = serializers.UUIDField(required=False, allow_null=True)
    domain_id = serializers.UUIDField(required=False, allow_null=True)
    subdomain_id = serializers.UUIDField(required=False, allow_null=True)
    analysis_max_rows = serializers.IntegerField(required=False, default=5000)

    def validate_dashboard(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Informe um nome de dashboard para criar o projeto.")
        return cleaned

    def validate_dataDomain(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Informe o domínio de dados para criar o projeto.")
        return cleaned
