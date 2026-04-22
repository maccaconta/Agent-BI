"""
apps.datasets.serializers
─────────────────────────
Serializers para comunicação entre o motor de dados e o frontend.
"""
from rest_framework import serializers
from apps.datasets.models import Dataset, DatasetVersion


class DatasetSerializer(serializers.ModelSerializer):
    """Serializer completo para exibição e diagnóstico."""
    created_by_name = serializers.SerializerMethodField()
    created_by_email = serializers.SerializerMethodField()
    domain_id = serializers.SerializerMethodField()
    domain_name = serializers.SerializerMethodField()
    subdomain_id = serializers.SerializerMethodField()
    subdomain_name = serializers.SerializerMethodField()
    is_ready = serializers.ReadOnlyField()
    sqlite_table = serializers.SerializerMethodField()
    
    def get_created_by_name(self, obj):
        return obj.created_by.first_name if obj.created_by else None

    def get_created_by_email(self, obj):
        return obj.created_by.email if obj.created_by else None

    def get_domain_id(self, obj):
        return str(obj.domain.id) if obj.domain else None

    def get_domain_name(self, obj):
        return obj.domain.name if obj.domain else None

    def get_subdomain_id(self, obj):
        return str(obj.subdomain.id) if obj.subdomain else None

    def get_subdomain_name(self, obj):
        return obj.subdomain.name if obj.subdomain else None
    
    # Campos Virtuais para Escrita
    descriptions = serializers.DictField(required=False, write_only=True)
    semanticFlags = serializers.DictField(required=False, write_only=True)
    selectedCols = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Dataset
        fields = [
            "id", "project", "name", "description", "source_type",
            "status", "processing_step", "s3_raw_path", "s3_parquet_path", 
            "s3_original_filename", "s3_original_size_bytes",
            "glue_table", "glue_database", "schema_json", "sample_json",
            "sqlite_table", "row_count", "column_count", "parquet_size_bytes",
            "processing_error", "processing_started_at", "processing_finished_at",
            "created_by_name", "created_by_email", "domain_id", "domain_name", 
            "subdomain_id", "subdomain_name", "confidentiality", "lineage_info",
            "is_ready", "created_at", "updated_at",
            "descriptions", "semanticFlags", "selectedCols"
        ]
        read_only_fields = ["status", "s3_parquet_path", "glue_table", "sample_json", "sqlite_table"]

    def get_sqlite_table(self, obj) -> str:
        from apps.datasets.services.sqlite_analytics_store import LocalSQLiteAnalyticsStoreService
        return LocalSQLiteAnalyticsStoreService().resolve_table_name(
            dataset_id=str(obj.id),
            dataset_name=obj.name
        )

    def to_representation(self, instance):
        """Customizamos a saída para incluir os campos virtuais computados."""
        ret = super().to_representation(instance)
        
        # Injeta descriptions
        schema = instance.schema_json or {}
        cols = schema.get("columns", [])
        ret["descriptions"] = {c["name"]: c.get("description", "") for c in cols}
        
        # Injeta semanticFlags
        ret["semanticFlags"] = {
            c["name"]: {
                "is_key": c.get("is_key", False),
                "is_historical_date": c.get("is_historical_date", False),
                "is_category": c.get("is_category", False),
                "is_value": c.get("is_value", False),
                "is_elected_for_risk": c.get("is_elected_for_risk", False),
            } for c in cols
        }
        
        # Injeta selectedCols
        project = instance.project
        if project and project.intake_metadata and "selected_cols" in project.intake_metadata:
            ret["selectedCols"] = project.intake_metadata["selected_cols"]
        else:
            ret["selectedCols"] = [c["name"] for c in cols]
            
        return ret

    def update(self, instance, validated_data):
        """Merge inteligente dos metadados semânticos no schema_json."""
        descriptions = validated_data.pop("descriptions", None)
        semantic_flags = validated_data.pop("semanticFlags", None)
        selected_cols = validated_data.pop("selectedCols", None)
        
        # 1. Atualizar Schema JSON (Metadados das Colunas)
        if descriptions or semantic_flags:
            schema = instance.schema_json or {"columns": []}
            for col in schema.get("columns", []):
                col_name = col["name"]
                
                # Merge de Descrições (Prompts)
                if descriptions and col_name in descriptions:
                    col["description"] = descriptions[col_name]
                
                # Merge de Flags
                if semantic_flags and col_name in semantic_flags:
                    flags = semantic_flags[col_name]
                    col["is_key"] = flags.get("is_key", col.get("is_key", False))
                    col["is_historical_date"] = flags.get("is_historical_date", col.get("is_historical_date", False))
                    col["is_category"] = flags.get("is_category", col.get("is_category", False))
                    col["is_value"] = flags.get("is_value", col.get("is_value", False))
                    col["is_elected_for_risk"] = flags.get("is_elected_for_risk", col.get("is_elected_for_risk", False))
            
            instance.schema_json = schema
            
        # 2. Atualizar Seleção de Colunas no Projeto (Governança)
        if selected_cols is not None:
            project = instance.project
            if project:
                if not project.intake_metadata:
                    project.intake_metadata = {}
                project.intake_metadata["selected_cols"] = selected_cols
                project.save(update_fields=["intake_metadata"])

        return super().update(instance, validated_data)


class DatasetCreateSerializer(serializers.ModelSerializer):
    """Serializer minimalista para criação inicial."""
    class Meta:
        model = Dataset
        fields = ["project", "name", "source_type", "s3_raw_path", "s3_original_filename", "s3_original_size_bytes"]


class DatasetSchemaSerializer(serializers.ModelSerializer):
    """Focado apenas no schema para o Diagnóstico do Agente."""
    class Meta:
        model = Dataset
        fields = ["id", "name", "schema_json", "sample_json", "status"]


class PresignedUploadSerializer(serializers.Serializer):
    """Parâmetros para solicitar URL pré-assinada de upload."""
    filename = serializers.CharField(max_length=500)
    project_id = serializers.UUIDField()
    content_type = serializers.CharField(max_length=100, required=False)
