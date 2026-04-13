import logging
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_engine.serializers import (
    CopilotGenerateSerializer, 
    CopilotSQLPreviewSerializer,
    ReportPromptPlanSerializer,
    ReportPromptMaterializeSerializer
)
from apps.ai_engine.services.incremental_dashboard_agent import IncrementalDashboardAgentService
from apps.ai_engine.services.report_prompt_service import ReportPromptService
from apps.datasets.services.sqlite_query_service import LocalSQLiteQueryService, SQLiteQueryValidationError
from apps.projects.models import Project

logger = logging.getLogger(__name__)


class CopilotGenerateAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["ai"],
        summary="Gerar evolucao incremental de dashboard",
        request=CopilotGenerateSerializer,
    )
    def post(self, request):
        serializer = CopilotGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = IncrementalDashboardAgentService()
        trace_id = serializer.validated_data.get("trace_id")
        try:
            result = service.generate(serializer.validated_data, request_user=request.user)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as exc:
            return Response({"detail": str(exc), "trace_id": trace_id}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"detail": f"Erro interno: {str(exc)}", "trace_id": trace_id}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CopilotSQLPreviewAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["ai"],
        summary="Executar preview de SQL em conjuntos de dados locais",
        request=CopilotSQLPreviewSerializer,
    )
    def post(self, request):
        serializer = CopilotSQLPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sql = serializer.validated_data["sql"]
        datasets = serializer.validated_data.get("datasets", [])
        limit = serializer.validated_data.get("limit", 200)

        service = LocalSQLiteQueryService()
        try:
            # Resolução Híbrida de Datasets (IDs ou Dicionários Completos)
            from apps.datasets.models import Dataset
            resolved_datasets = []
            valid_uuids = []
            
            for item in datasets:
                if isinstance(item, dict):
                    # Formato legado/testes: Dicionário completo
                    resolved_datasets.append(item)
                elif isinstance(item, str):
                    # Novo formato: ID para resolução
                    try:
                        import uuid
                        uuid.UUID(item)
                        valid_uuids.append(item)
                    except ValueError:
                        continue
            
            # Busca metadados para os IDs válidos no banco
            if valid_uuids:
                queryset = Dataset.objects.filter(id__in=valid_uuids)
                for ds in queryset:
                    resolved_datasets.append({
                        "id": str(ds.id),
                        "name": ds.name,
                        "sqlite_table": ds.glue_table or ds.name.lower().replace(".", "_").replace(" ", "_"),
                        "schema_json": ds.schema_json
                    })

            result = service.execute_sql_for_datasets(resolved_datasets, sql, limit=limit)
            return Response(result, status=status.HTTP_200_OK)
        except SQLiteQueryValidationError as exc:
            logger.warning(f"[PreviewAPI] Erro de validacao SQL: {exc}")
            return Response({"detail": str(exc), "rows": [], "columns": []}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception(f"[PreviewAPI] Erro inesperado na execucao SQL: {exc}")
            return Response({"detail": f"Erro inesperado: {str(exc)}", "rows": [], "columns": []}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportPromptPlanAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["ai"],
        summary="Planejar estrutura de dashboard a partir de prompt global",
        request=ReportPromptPlanSerializer,
    )
    def post(self, request):
        serializer = ReportPromptPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id = serializer.validated_data["project_id"]
        global_prompt = serializer.validated_data["global_prompt"]
        
        try:
            project = Project.objects.get(id=project_id)
            service = ReportPromptService()
            result = service.plan_dashboard(global_prompt, project, user=request.user)
            return Response(result, status=status.HTTP_200_OK)
        except Project.DoesNotExist:
            return Response({"detail": "Projeto não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

class ReportPromptMaterializeAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["ai"],
        summary="Materializar widgets do dashboard (SQL/Python)",
        request=ReportPromptMaterializeSerializer,
    )
    def post(self, request):
        print(f"[DEBUG] Materialize Request Data: {request.data}")
        serializer = ReportPromptMaterializeSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"[ERROR] Serialization errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        dashboard_id = serializer.validated_data.get("dashboard_id")
        project_id = serializer.validated_data.get("project_id")
        widget_prompts = serializer.validated_data["widget_prompts"]
        trace_id = serializer.validated_data.get("trace_id")

        service = ReportPromptService()
        try:
            result = service.materialize_dashboard(
                dashboard_id=dashboard_id, 
                widget_prompts=widget_prompts, 
                trace=trace_id,
                project_id=project_id
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            import traceback
            traceback.print_exc()
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
