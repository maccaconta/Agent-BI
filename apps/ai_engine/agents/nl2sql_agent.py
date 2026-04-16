"""
apps.ai_engine.agents.nl2sql_agent
Agente especialista em geração de SQL complexo (Joins, CTEs, Window Functions) via LLM.
"""
import json
import logging
from typing import Dict, Any, List

from apps.ai_engine.services.bedrock_service import BedrockService
from apps.ai_engine.services.prompt_service import PromptService

logger = logging.getLogger(__name__)

NL2SQL_AGENT_SYSTEM_PROMPT = """Você é o Diretor de Inteligência de Dados e Cientista Sênior da NTT DATA. 
Sua missão é extrair inteligência profunda de rastro analítico corporativo. 

## DIRETRIZES DE GOVERNANÇA E PERFORMANCE (ITEM 4):
1. **JOINS OUSADOS**: Se houver mais de um dataset, você DEVE buscar correlações e fazer `JOIN` para construir estatísticas cruzadas. Nunca entregue métricas simplórias ou listagens secas.
2. **AGREGAÇÕES AVANÇADAS**: Priorize `SUM`, `AVG`, `GROUP BY` e cálculos de Top 5. Sua meta é encontrar padrões, não apenas ler linhas.
3. **TONE OF VOICE (C-LEVEL)**: Use labels de negócio (ex: "Conversão de Vendas" em vez de "venda_status_count"). Evite gírias técnicas nos campos `description`.
4. **DIALÉTICA SQLITE**: O banco é **SQLite**. Use apenas funções nativas. Datas: `strftime('%Y-%m', coluna)`.

## CONTRATO DE ESTRUTURA VISUAL:
- **BIGNUMBER**: Exatamente 1 linha e 1 coluna (Soma global ou valor único).
- **PIE / BAR / LINE**: Estrutura [Label, Valor] ou [Série, Label, Valor] para multi-series.

## Saída Exigida (JSON):
{
  "sql": "Consulta SQL otimizada com foco em inteligência agregada e Joins ousados",
  "description": "Explicação executiva (C-Level) focada no impacto de negócio",
  "complexity": "HIGH"
}
"""

class NL2SQLAgent:
    """
    Assistente especializado em traduzir linguagem natural para SQL complexo.
    """
    def __init__(self):
        self.bedrock_service = BedrockService()

    def generate_sql(self, user_prompt: str, datasets: List[Dict[str, Any]], relationships: List[Dict[str, Any]] = None, specialist_context: str = "", trace=None, system_prompt_override: str = None) -> Dict[str, Any]:
        """
        Gera a proposta SQL baseada no contexto tabular e nas métricas da Base de Conhecimento.
        """
        logger.info("[Assistente_NL2SQL] Iniciando geração de SQL com contexto especializado.")
        
        # Carrega o system prompt dinâmico do banco (apenas se não for passado via override)
        if system_prompt_override:
            base_system_prompt = system_prompt_override
        else:
            base_system_prompt = PromptService.get_system_prompt("NL2SQLAgent", NL2SQL_AGENT_SYSTEM_PROMPT)
        
        # Injeta contexto especializado se houver
        if specialist_context:
            base_system_prompt += f"\n\n### DIRETRIZES DO ESPECIALISTA DE DOMÍNIO (PRIORITY):\n{specialist_context}"

        if trace and hasattr(trace, "log_thought"):
            trace.log_thought("Assistente NL2SQL", "Combinando esquema com as regras de granularidade e diretrizes do especialista.")

        # Constrói o contexto tabular otimizado (poda de metadados para velocidade)
        datasets_context = []
        for ds in datasets:
            schema_raw = ds.get("schema_json") or {}
            columns_minimal = []
            
            # Extrai apenas o essencial de cada coluna para economizar tokens e tempo
            for col in schema_raw.get("columns", []):
                columns_minimal.append({
                    "name": col.get("name"),
                    "type": col.get("type"),
                    "description": col.get("description", "")
                })

            table_info = {
                "sqlite_table": ds.get("sqlite_table"),
                "name": ds.get("name"),
                "granularity": ds.get("data_profile", {}).get("granularity_level", "UNKNOWN"),
                "columns": columns_minimal,
                "profile_summary": ds.get("data_profile", {}).get("summary", "Não disponível")
            }
            datasets_context.append(table_info)

        user_message = f"""
PERGUNTA: {user_prompt}

CONTEXTO DOS DATASETS:
{json.dumps(datasets_context, indent=2, ensure_ascii=False)}

Gere o SQL e a descrição técnica.
"""
        
        try:
            result = self.bedrock_service.invoke_with_json_output(
                system_prompt=base_system_prompt,
                user_message=user_message,
                temperature=0.0,
                trace=trace
            )
            
            if not result or not isinstance(result, dict):
                raise ValueError("Resposta do Bedrock não é um objeto JSON válido.")
            
            if trace and hasattr(trace, "log_thought"):
                 trace.log_thought("Assistente NL2SQL", f"Query estruturada com complexidade {result.get('complexity', 'Média')}.")
            
            return {
                "specialist": "ASSISTENTE_NL2SQL",
                "sql": result.get("sql", ""),
                "description": result.get("description", ""),
                "complexity": result.get("complexity", "Média")
            }
            
        except Exception as e:
            logger.error(f"[NL2SQL] Falha ao gerar SQL: {e}")
            if trace and hasattr(trace, "log_thought"):
                 trace.log_thought("Assistente NL2SQL: Erro", str(e))
            
            return {
                "specialist": "ASSISTENTE_NL2SQL",
                "sql": "",
                "description": f"Erro na geração: {str(e)}",
                "error": True
            }
