import json
import logging
import uuid
from typing import Dict, Any, List
from django.utils import timezone
from django.db import transaction
from apps.governance.models import ReportPrompt, WidgetScriptBinding
from apps.dashboards.models import Dashboard
from apps.projects.models import Project
from apps.ai_engine.agents.report_designer_agent import ReportDesignerAgent
from apps.ai_engine.agents.data_scientist_agent import DataScientistAgent
from apps.ai_engine.agents.supervisor_agent import SupervisorAgent
from apps.ai_engine.services.html_renderer_service import DashboardHtmlRendererService
from apps.audit.services.trace_service import TraceService

logger = logging.getLogger(__name__)

class ReportPromptService:
    def __init__(self):
        self.designer = ReportDesignerAgent()
        self.data_scientist = DataScientistAgent()
        self.supervisor = SupervisorAgent()
        self.renderer = DashboardHtmlRendererService()

    def plan_dashboard(self, global_prompt: str, project, user=None) -> Dict[str, Any]:
        """
        Gera um plano de dashboard (widgets) a partir de um prompt global.
        """
        # Coleta metadados básicos para o designer
        datasets_metadata = []
        for ds in project.datasets.filter(is_deleted=False):
             datasets_metadata.append({
                 "id": str(ds.id),
                 "name": ds.name,
                 "columns": ds.schema_json.get("columns", []) if ds.schema_json else [],
                 "row_count": ds.row_count,
                 "data_profile": ds.data_profile_json,
                 "data_sample": ds.sample_json[:5]  # Apenas 5 linhas para calibração visual do modelo
             })

        
        design = self.designer.design_report(global_prompt, datasets_metadata)
        
        # Cria o ReportPrompt no banco
        report_prompt = ReportPrompt.objects.create(
            project=project,
            content=global_prompt,
            created_by=user
        )
        
        return {
            "report_prompt_id": report_prompt.id,
            "design": design
        }

    def materialize_dashboard(self, dashboard_id: int = None, widget_prompts: List[Dict[str, Any]] = None, trace=None, project_id=None) -> Dict[str, Any]:
        """
        Para cada widget, gera o SQL/Python e salva no WidgetScriptBinding.
        Pode receber dashboard_id ou criar um novo a partir do project_id.
        """
        # Inicialização da Telemetria (HUD)
        raw_trace_id = trace
        if raw_trace_id:
            try:
                t_id = uuid.UUID(str(raw_trace_id))
            except (ValueError, AttributeError):
                t_id = uuid.uuid4()
        else:
            t_id = uuid.uuid4()
            
        tracer = TraceService(trace_id=t_id, job_type="DASHBOARD_MATERIALIZE")
        if dashboard_id:
            dashboard = Dashboard.objects.get(id=dashboard_id)
            project = dashboard.project
        elif project_id:
            try:
                # Se for um marcador de projeto temporário (legado do frontend), evitamos o erro
                if project_id == "PRJ-TEMP":
                     raise ValueError("ID de projeto temporário detectado. Aguarde a finalização da ingestão.")
                
                project = Project.objects.get(id=project_id)
            except (Project.DoesNotExist, ValueError):
                # Fallback: tenta ver se existe ALGUm projeto se for ambiente local
                project = Project.objects.filter(is_deleted=False).first()
                if not project:
                     raise ValueError(f"Projeto {project_id} não encontrado.")
            
            # Sempre cria um NOVO dashboard rascunho para cada geração, permitindo abas no frontend
            draft_count = project.dashboards.count()
            version_label = f"V1.{draft_count}"
            dashboard = Dashboard.objects.create(
                project=project,
                name=f"DRAFT {version_label}",
                status="DRAFT"
            )

        else:
            raise ValueError("dashboard_id ou project_id deve ser fornecido.")
        
        tracer.start_step("Análise de Dados")
        # Coleta metadados reais dos datasets do projeto
        from apps.datasets.services.sqlite_analytics_store import LocalSQLiteAnalyticsStoreService
        store = LocalSQLiteAnalyticsStoreService()
        
        datasets = []
        dataset_ids = []
        for ds in project.datasets.filter(is_deleted=False):
             dataset_ids.append(str(ds.id))
             sanitized_name = store._sanitize_identifier(ds.name)
             datasets.append({
                 "id": str(ds.id),
                 "name": ds.name,
                 "sqlite_table": sanitized_name, 
                 "schema_json": ds.schema_json,
                 "data_profile": ds.data_profile_json or {}
             })
        tracer.end_step("Análise de Dados", message=f"Metadados de {len(datasets)} datasets carregados.")

        results = []
        for i, widget in enumerate(widget_prompts):
            # Fallback de ID para evitar erro de integridade se a IA ou Front não enviarem
            w_id = widget.get("id") or f"widget_{widget.get('type', 'generic').lower()}_{i}"
            prompt = widget.get("prompt")
            
            step_name = f"Data Expert: {w_id} ({i+1}/{len(widget_prompts)})"
            tracer.start_step(step_name)
            
            logger.info(f"[ReportPrompt] Processando widget {w_id} com prompt: {prompt}")
            
            # Busca contexto especializado do projeto
            specialist_context = ""
            if project.specialist_prompt:
                specialist_context = f"\n\n### DIRETRIZES DO ESPECIALISTA DE DOMÍNIO:\n{project.specialist_prompt.content}"
            
            # Check bypassing do LLM ativado pelo FrontEnd
            view_mode = widget.get("view_mode", "PROMPT")
            override_sql = widget.get("override_sql") if view_mode == "SQL" else None

            # Gera o código técnico incorporando o contexto especializado e injetáveis de UI
            source = self.data_scientist.provide_data_source(
                prompt, 
                datasets, 
                trace=tracer,
                specialist_context=specialist_context,
                override_sql=override_sql
            )
            
            tracer.end_step(step_name, message=f"Código {source.get('script_type')} gerado com sucesso.")

            # Salva ou atualiza o binding para evitar erro de duplicidade
            WidgetScriptBinding.objects.update_or_create(
                dashboard=dashboard,
                widget_id=w_id,
                version=dashboard.version_count + 1,
                defaults={
                    "prompt": prompt,
                    "script_type": source.get("script_type"),
                    "script_content": source.get("script_content"),
                }
            )
            
            visual_type = widget.get("subType") if widget.get("type", "") == "CHART" else widget.get("type", "BIGNUMBER")
            
            results.append({
                "widget_id": w_id,
                "title": widget.get("title", w_id),
                "script_type": source.get("script_type"),
                "visual_type": visual_type,
                "script_content": source.get("script_content"),
                "thought": source.get("thought"),
                "business_rationale": widget.get("business_rationale", "")
            })
        
        # Geração de HTML DETERMINÍSTICO (Sem Supervisor)
        tracer.start_step("UI Designer: Layout Determinístico")
        logger.info(f"[ReportPrompt] Renderizando dashboard via template local...")
        
        # Extraindo o Resumo da Ingestão e Insights Estratégicos
        diagnostico_consolidado = ""
        for ds in project.datasets.filter(is_deleted=False):
            diagnostico_consolidado += f"\n- DATASET: {ds.name}\n"
            if getattr(ds, 'description', None):
                diagnostico_consolidado += f"  RESUMO ORIGINAL: {ds.description}\n"
            if getattr(ds, 'data_profile_json', None):
                insights = ds.data_profile_json.get("ai_strategic_insights", [])
                if insights:
                    diagnostico_consolidado += f"  INSIGHTS: {', '.join(insights)}\n"
        
        html = self.renderer.render_premium_deterministic_dashboard(
            dashboard=dashboard, 
            widget_results=results, 
            diagnostico_consolidado=diagnostico_consolidado
        )
        
        logger.info(f"[ReportPromptService] Dashboard HTML gerado via motor local. Tamanho: {len(html) if html else 0} caracteres.")
        tracer.end_step("UI Designer: Layout Determinístico", message="Dashboard montado instantaneamente via motor de renderização.")
        
        # Salva o estado técnico no config
        dashboard.config["last_materialized_at"] = str(timezone.now())
        dashboard.save()

        return {
            "status": "success", 
            "dashboard_id": dashboard.id,
            "dashboard_name": dashboard.name,
            "dashboard_html": html,
            "widgets": results,
            "trace_id": str(tracer.trace_id)
        }
