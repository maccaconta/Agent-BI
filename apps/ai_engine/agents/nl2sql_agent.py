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
3. **INTELIGÊNCIA TEMPORAL DINÂMICA (MANDATORY)**: Ao lidar com conceitos de "data atual", "último saldo", "status final" ou "período mais recente", você **NUNCA** deve usar funções de data do sistema (como `DATE('now')`) nem valores fixos (ex: '2024-01') encontrados nos metadados. Identifique a coluna de tempo no schema (ex: `mes`, `data`, `periodo`) e use **SEMPRE** subqueries: `WHERE coluna_tempo = (SELECT MAX(coluna_tempo) FROM tabela)`. É terminantemente **PROIBIDO** hardcodar datas baseadas na sua amostra de contexto.
4. **TONE OF VOICE (C-LEVEL)**: Use labels de negócio (ex: "Conversão de Vendas" em vez de "venda_status_count"). Evite gírias técnicas nos campos `description`.
5. **DIALÉTICA SQLITE**: O banco é **SQLite**. Use apenas funções nativas. Datas: `strftime('%Y-%m', coluna)`.
6. **HEURÍSTICA DE IDENTIFICADORES (CRITICAL)**: Colunas que contenham no nome termos como `id`, `cod`, `pk`, `sk`, `nr`, `chave`, `nr_nota`, `cod_produto`, etc., são estritamente **DIMENSÕES**. É terminantemente **PROIBIDO** realizar operações de `SUM()` ou `AVG()` nestes campos. Se o objetivo for volumetria, use `COUNT(DISTINCT ...)`. Trate-os sempre como texto em agrupamentos e labels.
7. **PRECISÃO MÉTRICA (MANDATORY)**: Para evitar "explosão" de decimais, você **DEVE** aplicar `ROUND(metric, 2)` em todas as agregações numéricas (`SUM`, `AVG`, `STDEV`, etc.) no seu comando SQL. Ex: `SELECT ROUND(SUM(vlr_total), 2) ...`.

## CONTRATO DE ESTRUTURA E FIDELIDADE DE FORMA:
1. **BIGNUMBER**: Exatamente 1 linha e 1 coluna (Soma global ou valor único).
2. **PIE / BAR / LINE**: Estrutura [Label, Valor] ou [Série, Label, Valor]. 
   - **IMPORTANTE**: Se você detectar que a pergunta pede um gráfico, mas sua lógica SQL retornaria apenas 1 linha (ex: um Total), você DEVE adicionar um agrupamento (ex: `GROUP BY` uma dimensão lógica) para garantir que o gráfico tenha dados para exibir (eixos X e Y).
   - **Métricas vs Dimensões**: Inteiros/floats como IDADE devem ser tratados como Métricas (SUM, AVG) e NÃO como dimensões de agrupamento (GROUP BY), a menos que explicitado.
   - **Integridade de Listagens (GRID/TABLE)**: Ao gerar SQL para listagens, selecione explicitamente TODOS os campos solicitados pelo usuário. NÃO remova colunas por simplificação; se o usuário pediu X e Y no rastro analítico, ambos DEVEM estar no SELECT. Nunca omita colunas descritivas em favor de IDs a menos que solicitado.

6. **INTELIGÊNCIA DE DISTRIBUIÇÃO**: Se o usuário solicitar uma "Distribuição" de um campo numérico de alta cardinalidade (ex: Score de Crédito, Salário, Idade ou Valor), você NÃO deve agrupar pelo valor bruto. Use `ROUND(coluna/100, 0)*100` ou `CASE` para criar faixas/bins (ex: "0-100", "101-200") para que o gráfico seja legível e útil.

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
            
            metadata = self.bedrock_service.last_invoke_metadata or {}
            
            return {
                "specialist": "ASSISTENTE_NL2SQL",
                "sql": result.get("sql", ""),
                "description": result.get("description", ""),
                "complexity": result.get("complexity", "Média"),
                "input_tokens": metadata.get("input_tokens", 0) or metadata.get("inputTokens", 0),
                "output_tokens": metadata.get("output_tokens", 0) or metadata.get("outputTokens", 0)
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
