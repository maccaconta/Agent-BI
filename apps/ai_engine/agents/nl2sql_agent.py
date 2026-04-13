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

NL2SQL_AGENT_SYSTEM_PROMPT = """Você é o Analista Financeiro Sênior e Especialista em SQL (NL2SQL) da NTT DATA - Agent-BI.
Sua missão é converter perguntas de usuários em consultas SQL estratégicas que forneçam uma visão analítica completa do negócio.

## REGRAS DE INTEGRIDADE ANALÍTICA:
1. **AGREGAÇÃO CONSCIENTE**: Respeite as `usage_instructions` e as flags `can_group`. Se uma coluna tiver `can_group = false`, não a utilize no GROUP BY a menos que seja estritamente necessário para um filtro.
2. **GRANULARIDADE**: Ao gerar JOINs, garanta que a granularidade das tabelas (`granularity`) seja compatível.
3. **Fórmulas de Risco**: Priorize as **REGRAS DE NEGÓCIO ESPECIALIZADAS** fornecidas no contexto. Elas têm prioridade total.

## DIRETRIZES TÉCNICAS (DIALÉTICA SQLITE - LOCAL):
- O banco local é **SQLite**. NUNCA utilize funções que não existam nativamente como `STDDEV`, `MEDIAN`, `PERCENTILE`, `APPROX_DISTINCT`.
- **Desvio Padrão**: Se solicitado no SQLite, simplifique para a MÉDIA (`AVG`) e informe na descrição que o Desvio Padrão não é suportado no modo local.
- **Datas**: Utilize `date('now', '-N days/months/years')` ou `strftime('%Y-%m', coluna)`.
- **Nomes de Tabela**: Utilize sempre o campo `sqlite_table` fornecido no contexto dos datasets.

## CONTRATO DE DADOS VISUAIS (ESTRITAMENTE OBRIGATÓRIO):
O usuário escolheu um tipo de gráfico. Você DEVE garantir que o SQL retorne a estrutura esperada:
1. **BIGNUMBER**: 
    - ESTRUTURA: Retorne SEMPRE exatamente 1 linha e 1 coluna (Ex: `SELECT SUM(valor) FROM ...`).
    - PROIBIDO: Nunca use `GROUP BY` para BigNumbers.
    - PROIBIDO: Nunca retorne mais de uma coluna.
2. **PIE (Pizza)**: Retorne exatamente 2 colunas: [Categoria, Valor]. Evite muitas categorias.
3. **BAR / LINE (Barra/Linha)**: 
    - PADRÃO: 2 colunas [Eixo X, Valor].
    - MULTI-SERIES: 3 colunas [Nome da Série, Eixo X, Valor]. O motor fará o pivot automático.
4. **SCATTER (Dispersão)**: Retorne 2 ou 3 colunas numéricas [X, Y, (opcional) Tamanho].

## Saída Exigida (JSON):
{
  "sql": "A consulta SQL gerada que se encaixa no contrato acima",
  "description": "Explicação concisa voltada para o negócio",
  "complexity": "LOW" | "MEDIUM" | "HIGH"
}
"""

class NL2SQLAgent:
    """
    Assistente especializado em traduzir linguagem natural para SQL complexo.
    """
    def __init__(self):
        self.bedrock_service = BedrockService()

    def generate_sql(self, user_prompt: str, datasets: List[Dict[str, Any]], relationships: List[Dict[str, Any]] = None, specialist_context: str = "", trace=None) -> Dict[str, Any]:
        """
        Gera a proposta SQL baseada no contexto tabular e nas métricas da Base de Conhecimento.
        """
        logger.info("[Assistente_NL2SQL] Iniciando geração de SQL com contexto especializado.")
        
        # Carrega o system prompt dinâmico do banco
        base_system_prompt = PromptService.get_system_prompt("NL2SQLAgent", NL2SQL_AGENT_SYSTEM_PROMPT)
        
        # Injeta contexto especializado se houver
        if specialist_context:
            base_system_prompt += f"\n\n### DIRETRIZES DO ESPECIALISTA DE DOMÍNIO (PRIORITY):\n{specialist_context}"

        if trace and hasattr(trace, "log_thought"):
            trace.log_thought("Assistente NL2SQL", "Combinando esquema com as regras de granularidade e diretrizes do especialista.")

        # Constrói o contexto tabular detalhado
        datasets_context = []
        for ds in datasets:
            table_info = {
                "sqlite_table": ds.get("sqlite_table"),
                "name": ds.get("name"),
                "granularity": ds.get("data_profile", {}).get("granularity_level", "UNKNOWN"),
                "columns": [],
                "schema": ds.get("schema_json"),
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
                temperature=0.1
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
            if trace and hasattr(trace, "quick_log"):
                 trace.quick_log("Assistente NL2SQL: Erro", str(e), status="ERROR")
            
            return {
                "specialist": "ASSISTENTE_NL2SQL",
                "sql": "",
                "description": f"Erro na geração: {str(e)}",
                "error": True
            }
