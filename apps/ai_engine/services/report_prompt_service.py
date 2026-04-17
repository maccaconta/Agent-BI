import time
import json
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List
from django.utils import timezone
from django.db import transaction
from apps.governance.models import ReportPrompt, WidgetScriptBinding
from apps.dashboards.models import Dashboard
from apps.versions.models import Version, VersionState
from apps.projects.models import Project
from apps.ai_engine.agents.report_designer_agent import ReportDesignerAgent
from apps.ai_engine.agents.nl2sql_agent import NL2SQLAgent
from apps.ai_engine.agents.supervisor_agent import SupervisorAgent
from apps.ai_engine.services.html_renderer_service import DashboardHtmlRendererService
from apps.audit.services.trace_service import TraceService

from apps.users.services.quota_service import QuotaService

logger = logging.getLogger(__name__)

class ReportPromptService:
    def __init__(self):
        self.designer = ReportDesignerAgent()
        self.nl2sql = NL2SQLAgent()
        self.supervisor = SupervisorAgent()
        self.renderer = DashboardHtmlRendererService()
        self.quota_service = QuotaService()

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
                 "data_profile": ds.data_profile_json or {},
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

    def materialize_dashboard(self, dashboard_id: int = None, widget_prompts: List[Dict[str, Any]] = None, trace=None, project_id=None, user=None) -> Dict[str, Any]:
        """
        Para cada widget, gera o SQL/Python e salva no WidgetScriptBinding.
        Pode receber dashboard_id ou criar um novo a partir do project_id.
        """
        # --- VALIDAÇÃO DE QUOTA ---
        if user and not self.quota_service.check_and_increment(user):
            raise ValueError("Você atingiu seu limite mensal de geração de dashboards. Entre em contato com o administrador para aumentar sua quota.")

        # Inicialização da Telemetria (HUD)
        raw_trace_id = trace
        if raw_trace_id:
            try:
                t_id = uuid.UUID(str(raw_trace_id))
            except (ValueError, AttributeError):
                t_id = uuid.uuid4()
        else:
            t_id = uuid.uuid4()
            
        start_time = time.time()
        
        # Determina o projeto para contexto de rastreamento
        p_id = None
        if dashboard_id:
            try:
                dash = Dashboard.objects.get(id=dashboard_id)
                p_id = dash.project_id
            except: pass
        elif project_id and project_id != "PRJ-TEMP":
            p_id = project_id

        tracer = TraceService(
            trace_id=t_id, 
            job_type="DASHBOARD_MATERIALIZE",
            user_id=user.id if user else None,
            project_id=p_id
        )
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
                status="DRAFT",
                created_by=user
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

        # Contexto especializado do projeto (compartilhado entre widgets)
        specialist_context = ""
        if project.specialist_prompt:
            specialist_context = f"\n\n### DIRETRIZES DO ESPECIALISTA DE DOMÍNIO:\n{project.specialist_prompt.content}"

        # ── MODO TURBO SEGURO: Threads Paralelas (Apenas IA) + Persistência Sequencial ────────
        from concurrent.futures import ThreadPoolExecutor
        from apps.ai_engine.services.prompt_service import PromptService
        from apps.ai_engine.agents.nl2sql_agent import NL2SQL_AGENT_SYSTEM_PROMPT
        
        # Pre-loading de Prompts (Executa no processo principal para evitar locks de banco nas threads)
        nl2sql_sys_prompt = PromptService.get_system_prompt("NL2SQLAgent", NL2SQL_AGENT_SYSTEM_PROMPT)
        
        logger.info("[ReportPrompt] 🚀 Modo TURBO SEGURO — disparando %s widgets em paralelo (IA-only).", len(widget_prompts))
        
        def process_widget(idx_tuple):
            i, widget = idx_tuple
            w_id = widget.get("id") or f"widget_{widget.get('type', 'generic').lower()}_{i}"
            prompt = widget.get("prompt")
            
            # --- MÁQUINA DE OVERRIDE (GOVERNANÇA) ---
            override_sql = widget.get("override_sql")
            view_mode = widget.get("view_mode", "PROMPT")
            
            try:
                # Caso o usuário tenha ajustado o SQL manualmente, honramos o ajuste e pulamos a IA
                if view_mode == "SQL" and override_sql and override_sql.strip():
                    logger.info(f"[ReportPrompt] 🛠️ [Override] Usando SQL manual para: {w_id}")
                    visual_type = widget.get("subType") if widget.get("type", "") == "CHART" else widget.get("type", "BIGNUMBER")
                    return {
                        "widget_id": w_id,
                        "title": widget.get("title", w_id),
                        "script_type": "SQL",
                        "visual_type": visual_type,
                        "script_content": override_sql,
                        "thought": "Executado via SQL manual (Override de Governança)",
                        "business_rationale": "Ajuste manual realizado pelo usuário no dashboard.",
                        "prompt": prompt,
                        "success": True,
                        "input_tokens": 0,
                        "output_tokens": 0
                    }

                logger.info(f"[ReportPrompt] 🤖 [Thread] Iniciando geração para: {w_id}")
                
                # Chamada de IA Paralela (SEM TRACER e com Prompt pré-carregado)
                source = self.nl2sql.generate_sql(
                    user_prompt=prompt,
                    datasets=datasets,
                    trace=None, 
                    specialist_context=specialist_context,
                    system_prompt_override=nl2sql_sys_prompt
                )
                
                visual_type = widget.get("subType") if widget.get("type", "") == "CHART" else widget.get("type", "BIGNUMBER")
                
                # Extraindo tokens da resposta do especialista
                in_tokens = source.get("input_tokens", 0)
                out_tokens = source.get("output_tokens", 0)

                return {
                    "widget_id": w_id,
                    "title": widget.get("title", w_id),
                    "script_type": "SQL",
                    "visual_type": visual_type,
                    "script_content": source.get("sql", ""),
                    "thought": source.get("description"),
                    "business_rationale": widget.get("business_rationale", ""),
                    "prompt": prompt,
                    "success": not source.get("error", False),
                    "input_tokens": in_tokens,
                    "output_tokens": out_tokens
                }
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                logger.error(f"[ReportPrompt] ❌ Falha crítica na thread do widget {w_id}: {e}\n{error_trace}")
                return {
                    "widget_id": w_id, 
                    "success": False, 
                    "error": str(e), 
                    "error_type": type(e).__name__,
                    "prompt": prompt
                }

        # Execução Paralela da Rede (IA)
        with ThreadPoolExecutor(max_workers=min(len(widget_prompts), 10)) as executor:
            batch_results = list(executor.map(process_widget, enumerate(widget_prompts)))
            
        results = []
        for r in batch_results:
            # Sanitização de campos para garantir serialização JSON sem erros de buffer
            sanitized = {
                "widget_id": str(r.get("widget_id", "")),
                "title": str(r.get("title", "")),
                "script_type": str(r.get("script_type", "SQL")),
                "visual_type": str(r.get("visual_type", "BIGNUMBER")),
                "script_content": str(r.get("script_content", "")).strip(),
                "thought": str(r.get("thought", "")),
                "business_rationale": str(r.get("business_rationale", "")),
                "prompt": str(r.get("prompt", "")),
                "success": bool(r.get("success")),
                "input_tokens": int(r.get("input_tokens", 0)),
                "output_tokens": int(r.get("output_tokens", 0)),
                "error": str(r.get("error", "")) if not r.get("success") else None
            }
            results.append(sanitized)

        success_count = len([r for r in results if r.get("success")])
        logger.info("[ReportPrompt] ✅ %s de %s widgets concluídos (incluindo falhas tratadas). Tempo IA: %.2fs", success_count, len(widget_prompts), time.time() - start_time)

        # Sincronização Final: Salvamento no Banco (Atômico para performance e segurança)
        from django.db import transaction
        
        # Calculamos o número da próxima versão uma única vez para consistência atômica
        next_version_v = dashboard.version_count + 1
        logger.info(f"[ReportPromptService] 📦 Preparando materialização da Versão V{next_version_v}")

        try:
            with transaction.atomic():
                for result in results:
                    w_id = result["widget_id"]
                    # Só persistimos o ScriptBinding se houve sucesso na geração do SQL ou se for override manual
                    if result.get("success"):
                        WidgetScriptBinding.objects.update_or_create(
                            dashboard=dashboard,
                            widget_id=w_id,
                            version=next_version_v,
                            defaults={
                                "prompt": result["prompt"],
                                "script_type": "SQL",
                                "script_content": result["script_content"],
                            }
                        )
                    else:
                        logger.warning(f"[ReportPromptService] Widget {w_id} falhou na LLM e não gerou script.")
        except Exception as e:
            logger.error(f"[ReportPromptService] Falha crítica na transação de salvamento de bindings: {e}")
            raise  # Re-raise para ser capturado pela View

        # Geração de HTML DETERMINÍSTICO (Sem Supervisor para o Layout, mas com Supervisor para a Síntese)
        tracer.start_step("UI Designer: Layout Determinístico")
        logger.info(f"[ReportPrompt] Renderizando dashboard via template local...")
        
        # --- ELEVAÇÃO ANALÍTICA: Geração de Síntese Executiva via IA ---
        # Em vez de listar metadados técnicos, pedimos um Parecer Conclusivo ao Supervisor
        datasets_metadata = []
        for ds in project.datasets.filter(is_deleted=False):
             datasets_metadata.append({
                 "name": ds.name,
                 "description": ds.description,
                 "insights": ds.data_profile_json.get("ai_strategic_insights", []) if ds.data_profile_json else []
             })
        
        render_start = time.time()
        # Chama o Supervisor para gerar o Parecer Estratégico Real (Synthesis)
        try:
            diagnostico_consolidado = self.supervisor.generate_executive_synthesis(
                datasets_metadata=datasets_metadata,
                trace=tracer
            )
        except Exception as e:
            logger.warning(f"[ReportPromptService] Falha ao gerar diagnóstico estratégico: {e}")
            diagnostico_consolidado = "Diagnóstico indisponível para esta versão."

        diagnostico_consolidated_safe = str(diagnostico_consolidado)
        
        from apps.dashboards.models import DashboardStatus
        # Registro de consumo real de tokens (Governança)
        total_in = sum(r.get("input_tokens", 0) for r in (results or []))
        total_out = sum(r.get("output_tokens", 0) for r in (results or []))
        
        if (total_in + total_out) > 0:
            try:
                logger.info(f"[ReportPromptService] Debitando {total_in + total_out} tokens reais para {user.email if user else 'desconhecido'}")
                self.quota_service.log_token_usage(user, total_in, total_out)
            except Exception as q_err:
                logger.warning(f"[ReportPromptService] ⚠️ Falha ao debitar tokens (DB busy): {q_err}")
        
        render_start = time.time()
        html = self.renderer.render_premium_deterministic_dashboard(
            dashboard=dashboard, 
            widget_results=results, 
            diagnostico_consolidado=diagnostico_consolidado,
            is_blueprint=dashboard.status == DashboardStatus.PUBLISHED
        )
        
        # --- SISTEMA DE VERSIONAMENTO OFICIAL ---
        version = None
        logger.info(f"[ReportPromptService] 🎨 Renderização concluída em {time.time() - render_start:.2f}s.")

        try:
            pers_start = time.time()
            version = Version.objects.create(
                dashboard=dashboard,
                version_number=next_version_v,
                state=VersionState.DRAFT,
                html_content=html,
                sql_queries=[r.get("script_content") for r in results if r.get("script_content")],
                ai_insights=diagnostico_consolidated_safe,
                full_prompt=f"Materialização de {len(results)} widgets via ReportPromptService.",
                created_by=user
            )
            
            dashboard.current_version = version
            if dashboard.config is None:
                dashboard.config = {}
            dashboard.config["last_materialized_at"] = str(timezone.now())
            dashboard.save()
            
            logger.info(f"[ReportPromptService] 💾 Dashboard salvo (Versão V{next_version_v}) em {time.time() - pers_start:.2f}s.")
            total_time = time.time() - start_time
            logger.info(f"[ReportPromptService] ✔️ Materialização total finalizada em {total_time:.2f}s.")

            # --- LEAN PAYLOAD: Filtramos apenas o essencial para o frontend ---
            lean_results = []
            for r in results:
                lean_results.append({
                    "widget_id": r.get("widget_id"),
                    "title": r.get("title"),
                    "visual_type": r.get("visual_type"),
                    "script_content": r.get("script_content"),
                    "success": r.get("success"),
                    "error": r.get("error") if not r.get("success") else None
                })

            total_time = time.time() - start_time
            logger.info(f"[ReportPromptService] ✔️ Materialização total finalizada em {total_time:.2f}s. Enviando {len(lean_results)} resultados enxutos.")

            # O registro de tokens já foi feito no início do bloco de persistência
            # para evitar redundância e locks múltiplos.

            return {
                "status": "success", 
                "dashboard_id": str(dashboard.id),
                "dashboard_name": dashboard.name,
                "dashboard_html": html,
                "version_id": str(version.id),
                "results": lean_results, # Key renomeada para 'results' (sync com frontend)
                "total_time": total_time
            }
        except Exception as e:
            # Registro em erro removido para reduzir concorrência em falhas críticas

            logger.error(f"[ReportPromptService] ❌ Erro ao salvar versão no banco: {e}")
            
            # Mesmo em erro de persistência, enviamos o payload enxuto
            lean_results_err = []
            for r in results:
                lean_results_err.append({
                    "widget_id": r.get("widget_id"),
                    "title": r.get("title"),
                    "visual_type": r.get("visual_type"),
                    "script_content": r.get("script_content"),
                    "success": r.get("success")
                })

            return {
                "status": "partial_success",
                "dashboard_id": str(dashboard.id),
                "dashboard_name": dashboard.name,
                "dashboard_html": html,
                "results": lean_results_err, # Key renomeada para 'results'
                "error": f"Erro ao persistir versão: {str(e)}"
            }
