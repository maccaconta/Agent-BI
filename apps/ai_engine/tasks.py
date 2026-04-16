"""
apps.ai_engine.tasks
Celery tasks para materialização paralela de widgets de dashboard.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=2,
    default_retry_delay=10,
    name="ai_engine.materialize_widget",
    time_limit=120,
)
def materialize_widget_task(
    self,
    widget_config: Dict[str, Any],
    datasets: List[Dict[str, Any]],
    project_id: str,
    specialist_context: str = "",
    widget_index: int = 0,
    total_widgets: int = 1,
) -> Dict[str, Any]:
    """
    Materializa um único widget em paralelo via Celery.

    Recebe a configuração do widget, os metadados dos datasets e o contexto
    do especialista. Retorna o resultado com o SQL/script gerado.
    """
    w_id = widget_config.get("id") or f"widget_{widget_config.get('type', 'generic').lower()}_{widget_index}"
    prompt = widget_config.get("prompt")

    logger.info(
        "[ai_engine.tasks] Materializando widget %s (%s/%s) — projeto %s",
        w_id, widget_index + 1, total_widgets, project_id,
    )

    try:
        from apps.ai_engine.agents.nl2sql_agent import NL2SQLAgent
        nl2sql = NL2SQLAgent()

        view_mode = widget_config.get("view_mode", "PROMPT")
        override_sql = widget_config.get("override_sql") if view_mode == "SQL" else None

        source = nl2sql.generate_sql(
            user_prompt=prompt,
            datasets=datasets,
            trace=None,
            specialist_context=specialist_context
        )

        script_type = "SQL"
        script_content = source.get("sql", "")
        thought = source.get("description", "")

        visual_type = (
            widget_config.get("subType")
            if widget_config.get("type", "") == "CHART"
            else widget_config.get("type", "BIGNUMBER")
        )

        result = {
            "widget_id": w_id,
            "title": widget_config.get("title", w_id),
            "script_type": script_type,
            "visual_type": visual_type,
            "script_content": script_content,
            "thought": thought,
            "business_rationale": widget_config.get("business_rationale", ""),
        }

        logger.info("[ai_engine.tasks] Widget %s concluído com sucesso.", w_id)
        return result

    except Exception as exc:
        logger.error("[ai_engine.tasks] Erro ao materializar widget %s: %s", w_id, exc)
        try:
            raise self.retry(exc=exc, countdown=10 * (self.request.retries + 1))
        except self.MaxRetriesExceededError:
            # Retorna resultado de fallback para não travar o dashboard inteiro
            return {
                "widget_id": w_id,
                "title": widget_config.get("title", w_id),
                "script_type": "SQL",
                "visual_type": widget_config.get("type", "BIGNUMBER"),
                "script_content": "SELECT 'Erro na geração' as status",
                "thought": f"Falha após {self.max_retries} tentativas: {str(exc)}",
                "business_rationale": widget_config.get("business_rationale", ""),
                "error": str(exc),
            }
