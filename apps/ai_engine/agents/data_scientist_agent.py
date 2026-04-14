import json
import logging
from typing import Dict, Any, List
from apps.ai_engine.agents.supervisor_agent import SupervisorAgent
from apps.ai_engine.agents.nl2sql_agent import NL2SQLAgent
from apps.ai_engine.agents.pandas_analytics_agent import PandasAnalyticsAgent
from apps.ai_engine.services.bedrock_service import BedrockService

logger = logging.getLogger(__name__)

class DataScientistAgent:
    """
    Agente especialista em dados.
    Recebe um prompt de widget e gera o código (SQL ou Python) necessário.
    """
    def __init__(self):
        self.supervisor = SupervisorAgent()
        self.nl2sql = NL2SQLAgent()
        self.pandas = PandasAnalyticsAgent()

    def provide_data_source(self, widget_prompt: str, datasets: List[Dict[str, Any]], trace=None, specialist_context: str = "", override_sql: str = None) -> Dict[str, Any]:
        """
        Determina a rota (SQL vs Pandas) e gera o código para o widget.
        """
        # CURTO-CIRCUITO: Bypass Human-In-The-Loop
        if override_sql and override_sql.strip():
            return {
                "script_type": "SQL",
                "script_content": override_sql,
                "thought": "A aba SQL estava ativa. Execução direta com base na string parametrizada pelo usuário.",
                "route_reasoning": "Substituição pontual requisitada pelo usuário no dashboard."
            }

        # Orquestração via Supervisor
        routing = self.supervisor.determine_route(widget_prompt, datasets, trace=trace)
        route = routing.get("route", "ROUTE_NL2SQL")
        
        # Override temporário: sempre forçar NL2SQL para estabilidade se não houver Redis
        route = "ROUTE_NL2SQL"
        
        if route == "ROUTE_NL2SQL":
            n_result = self.nl2sql.generate_sql(
                widget_prompt, 
                datasets, 
                trace=trace, 
                specialist_context=specialist_context
            )
            if not n_result:
                n_result = {}
                
            return {
                "script_type": "SQL",
                "script_content": n_result.get("sql", ""),
                "thought": n_result.get("description", ""),
                "route_reasoning": routing.get("reasoning", "Fallback forçado")
            }
        else:
            p_result = self.pandas.analyze(
                widget_prompt, 
                datasets, 
                trace=trace,
                specialist_context=specialist_context
            )
            if not p_result:
                p_result = {}
                
            return {
                "script_type": "PYTHON",
                "script_content": p_result.get("code", ""),
                "thought": p_result.get("analysis", ""),
                "route_reasoning": routing.get("reasoning", "Análise estatística")
            }
