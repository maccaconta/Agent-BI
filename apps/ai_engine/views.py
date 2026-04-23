import logging
import time
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import FileResponse
from apps.dashboards.models import Dashboard
from apps.ai_engine.services.streamlit_exporter import StreamlitExporter

from apps.ai_engine.serializers import (
    CopilotGenerateSerializer, 
    CopilotSQLPreviewSerializer,
    ReportPromptPlanSerializer,
    ReportPromptMaterializeSerializer
)
from apps.ai_engine.services.incremental_dashboard_agent import IncrementalDashboardAgentService
from apps.ai_engine.services.report_prompt_service import ReportPromptService
from apps.datasets.services.sqlite_query_service import LocalSQLiteQueryService, SQLiteQueryValidationError
from django.conf import settings
from apps.projects.models import Project

logger = logging.getLogger(__name__)


class CopilotGenerateAPIView(APIView):

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

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["ai"],
        summary="Materializar widgets do dashboard (SQL/Python)",
        request=ReportPromptMaterializeSerializer,
    )
    def post(self, request):
        trace_id = None
        logger.critical(f"[ReportPromptView] >>> INICIANDO MATERIALIZAÇÃO <<< Dashboard: {request.data.get('dashboard_id')}")
        logger.debug(f"[ReportPromptView] Payload: {request.data}")
        try:
            serializer = ReportPromptMaterializeSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"[ReportPromptView] Erro de validação no payload: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            dashboard_id = serializer.validated_data.get("dashboard_id")
            project_id = serializer.validated_data.get("project_id")
            widget_prompts = serializer.validated_data["widget_prompts"]
            trace_id = serializer.validated_data.get("trace_id")
            # Validação de Quota de Tokens (Bloqueio de Governança)
            from apps.users.services.quota_service import QuotaService
            if not QuotaService().check_token_quota(request.user):
                return Response({
                    "error": "LIMITE_EXCEDIDO", 
                    "message": "Você atingiu seu limite mensal de tokens de IA. Entre em contato com o administrador."
                }, status=status.HTTP_403_FORBIDDEN)

            service = ReportPromptService()
            result = service.materialize_dashboard(
                dashboard_id=dashboard_id, 
                widget_prompts=widget_prompts, 
                trace=trace_id,
                project_id=project_id,
                user=request.user
            )
            
            # Diagnóstico de Payload e Performance (Fase Final)
            try:
                import json
                serialization_start = time.time()
                payload_str = json.dumps(result)
                serialization_time = time.time() - serialization_start
                payload_size_kb = len(payload_str) / 1024
                
                widget_count = len(result.get("results", []))
                logger.info(
                    f"[ReportPromptView] Materialização concluída: {widget_count} widgets. "
                    f"Payload: {payload_size_kb:.2f} KB. "
                    f"Tempo de Serialização: {serialization_time:.4f}s"
                )
            except Exception as e:
                logger.warning(f"[ReportPromptView] Falha ao calcular diagnóstico de payload: {e}")

            # --- FINAL RESPONSE RENDERING & SANITIZATION ---
            def sanitize_for_json(obj):
                """Garante que o objeto seja 100% serializável (sem NaN, Infinity, etc)"""
                import math
                if isinstance(obj, dict):
                    return {k: sanitize_for_json(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [sanitize_for_json(i) for i in obj]
                elif isinstance(obj, float):
                    if math.isnan(obj) or math.isinf(obj):
                        return None
                    return obj
                elif hasattr(obj, "__str__") and not isinstance(obj, (int, float, bool, str, type(None))):
                    return str(obj)
                return obj

            try:
                response_data = sanitize_for_json(result)
                import json
                from django.http import StreamingHttpResponse
                
                logger.info(f"[ReportPromptView] 🚀 Iniciando STREAMING da resposta final.")
                
                def stream_payload():
                    yield json.dumps(response_data)
                
                response = StreamingHttpResponse(stream_payload(), content_type="application/json")
                # Impede que middlewares ou proxies tentem fazer buffer da resposta
                response["X-Accel-Buffering"] = "no"
                response["Cache-Control"] = "no-cache"
                return response
                
            except Exception as rend_err:
                logger.error(f"[ReportPromptView] Erro na serialização JSON: {rend_err}")
                from django.http import JsonResponse
                return JsonResponse(
                    {"status": "error", "detail": "Falha na serialização dos dados."}, 
                    status=500
                )

        except Exception as exc:
            import traceback
            error_details = traceback.format_exc()
            logger.critical(f"[ReportPromptView] !!! FALHA CRÍTICA NA MATERIALIZAÇÃO !!!: {exc}\n{error_details}")
            
            return Response(
                {
                    "status": "error",
                    "error": "MATERIALIZATION_SERVER_ERROR",
                    "message": str(exc),
                    "detail": "Erro interno durante a geração do dashboard. Verifique o console do backend para detalhes.",
                    "trace_id": trace_id,
                    "error_type": exc.__class__.__name__
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json"
            )

class StreamlitExportAPIView(APIView):
    """
    Endpoint para exportar dashboard como script Streamlit.
    """
    @extend_schema(
        tags=["ai"],
        summary="Exportar dashboard como pacote Streamlit (.zip)",
    )
    def get(self, request, dashboard_id):
        try:
            dashboard = Dashboard.objects.get(id=dashboard_id)
            exporter = StreamlitExporter()
            zip_buffer = exporter.generate_zip(dashboard)
            
            response = FileResponse(zip_buffer, content_type="application/zip")
            response["Content-Disposition"] = f'attachment; filename="agentbi_export_{dashboard_id}.zip"'
            return response
        except Dashboard.DoesNotExist:
            return Response({"detail": "Dashboard não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            logger.exception("Erro ao exportar Streamlit")
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
