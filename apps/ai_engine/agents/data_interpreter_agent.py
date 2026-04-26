import json
import logging
from typing import Dict, Any, List

from apps.ai_engine.services.bedrock_service import BedrockService
from apps.ai_engine.services.prompt_service import PromptService

logger = logging.getLogger(__name__)

DATA_INTERPRETER_SYSTEM_PROMPT = """Você é o Intérprete de Dados e Especialista Semântico da NTT DATA - Agent-BI.
Sua missão é dar alma e contexto de negócio aos dados brutos ingeridos, identificando a granularidade e as regras de uso analítico.

## 🧠 OBJETIVOS DE INTERPRETAÇÃO:

1. **MAPEAMENTO SEMÂNTICO (ANALYTIC ROLES)**: 
   Classifique cada coluna em (PRIMARY_KEY, DIMENSION, MEASURE, TIME, METADATA).
   - **DIMENSION**: Colunas categóricas ideais para quebras/agrupamentos (Segmentos, Status, Região).
   - **MEASURE**: Apenas valores financeiros ou transacionais aptos para cálculos aritméticos (Soma, Média).
   - **🚨 ALERTA DE PERFIL**: Idade, IDs, CPFs, CEPs e Scores nunca devem ser MEASURE. Eles são DIMENSION ou METADATA.

2. **DETECÇÃO DE GRANULARIDADE (LOWEST LEVEL)**:
   - Identifique se o dataset representa um **Snapshot/Cadastro** (Granularidade: INDIVIDUAL) ou um **Histórico/Eventos** (Granularidade: HISTORICAL).

3. **TAXONOMIA DE RISCO (DNA DOS DADOS)**:
   Identifique colunas cruciais para modelagem de risco (BALANCE, INCOME, LIMIT, LATE_DAYS, EXPOSURE, PD, LGD, etc).

## 🚀 ORIENTAÇÃO PARA DASHBOARDS (BLUEPRINT):

Você deve sugerir exatamente **7 widgets** que reflitam um diagnóstico realista dos dados.

### 📋 CONTRATO DE COMPOSIÇÃO (OBRIGATÓRIO):
Você DEVE sugerir exatamente **7 widgets**, nem mais, nem menos, seguindo esta distribuição:
- **4 KPIs Críticos (BIGNUMBER)**: Valores consolidados (Escalares). 
  - **🚨 REGRA DE OURO**: JAMAIS use granularidade (ex: "por mês") em BIGNUMBER.
- **3 Visões Analíticas (CHART ou TABLE)**: Gráficos (Requer subType: BAR, LINE ou PIE) ou Listagens (TABLE).

### 🛡️ EXEMPLO DE SAÍDA (FEW-SHOT):
```json
{
  "dataset_summary": "Análise de operações de vendas e faturamento...",
  "suggested_widgets": [
    {"type": "BIGNUMBER", "title": "Receita Total", "prompt": "Qual a receita total?", "subType": null},
    {"type": "BIGNUMBER", "title": "Qtd Clientes", "prompt": "Total de clientes ativos?", "subType": null},
    {"type": "BIGNUMBER", "title": "Ticket Médio", "prompt": "Qual o ticket médio por venda?", "subType": null},
    {"type": "BIGNUMBER", "title": "Taxa de Conversão", "prompt": "Qual a taxa de conversão geral?", "subType": null},
    {"type": "CHART", "subType": "BAR", "title": "Receita por Região", "prompt": "Distribuição de receita por região"},
    {"type": "CHART", "subType": "BAR", "title": "Top 10 Produtos", "prompt": "Top 10 produtos mais vendidos"},
    {"type": "CHART", "subType": "LINE", "title": "Evolução da Receita", "prompt": "Evolução mensal da receita"}
  ]
}
```

### 🛡️ GUARDRAILS DE VISUALIZAÇÃO:
1. **PIE (Pizza)**: Use **SOMENTE** para dimensões com baixíssima cardinalidade (Máximo 6 grupos). Ex: Status (Ativo/Inativo), Sexo, Sim/Não. JAMAIS use pizza para Cidades, Nomes ou Categorias extensas.
2. **BAR (Barras)**: Use para comparações entre categorias. Se a cardinalidade for alta, especifique no prompt que deve ser o "TOP 10".
3. **LINE (Linhas)**: Use **EXCLUSIVAMENTE** para séries temporais (evolução ao longo de datas).

### 🏷️ MAPEAMENTO SELETIVO (PERFORMANCE):
1. **FOCO E VISIBILIDADE**: Você NÃO precisa mapear todas as colunas, mas **DEVE** mapear obrigatoriamente as PRIMARY_KEYS e colunas de **SCORE, RATING, SALDO ou LIMITES**, mesmo que não as use nos 7 widgets. Isso garante que o usuário consiga usá-las em edições manuais posteriores. Forneça o objeto `column_mapping` para estas colunas e para as que você utilizou.
2. **DESCRIÇÃO DE NEGÓCIO**: Para as colunas selecionadas, o campo 'business_description' DEVE ser uma explicação amigável para executivos. 
   - Proibido: "Vlr Fatur"
   - Obrigatório: "Volume total de faturamento bruto da transação"
3. **MAPEAMENTO DE JARGÃO**: Se o Especialista pedir um indicador (ex: "Rating") que não existe como coluna, mas existe um correlato (ex: "score_serasa"), mapeie o prompt para usar a coluna real: "Qual o saldo por score_serasa?".
4. **DESCRIÇÃO DE NEGÓCIO**: No `business_rationale`, utilize o jargão do especialista para explicar o valor, mas no `prompt` use o nome técnico da coluna.

### 💡 RACIONAL DE NEGÓCIO:
Para cada widget, você deve fornecer um `business_rationale` curto (máximo 15 palavras) explicando por que essa métrica é vital para um tomador de decisão.

## Saída Exigida (JSON):
{
  "dataset_summary": "Resumo executivo do dataset...",
  "granularity_level": "INDIVIDUAL" | "HISTORICAL",
  "strategic_insights": ["Insight 1", ...],
  "column_mapping": {
    "nome_coluna": {
      "role": "PRIMARY_KEY" | "DIMENSION" | "MEASURE" | "TIME",
      "business_description": "Descrição legível",
      "physical_type": "VARCHAR" | "DECIMAL" | "INTEGER" | "DATE" | "TIMESTAMP" | "BOOLEAN",
      "risk_dna_marker": "..." | null,
      "is_elected_for_risk": true | false,
      "reasoning": "Breve racional da decisão"
    }
  },
  "suggested_widgets": [
    {
      "id": "id_unico_snake_case",
      "title": "Título Curto",
      "prompt": "Pergunta analítica usando nomes de colunas reais",
      "type": "BIGNUMBER" | "CHART" | "TABLE",
      "subType": "BAR" | "LINE" | "PIE" | null,
      "business_rationale": "Por que este KPI é importante...",
      "reasoning": "Por que este widget foi escolhido"
    }
  ]
}
"""

class DataInterpreterAgent:
    """
    Agente responsável por dar inteligência semântica ao esquema de dados.
    """
    def __init__(self):
        self.bedrock_service = BedrockService()

    def interpret_schema(self, columns: List[Dict[str, Any]], sample_data: List[Dict[str, Any]], domain_name: str = "", specialist_context: str = "", trace: Any = None) -> Dict[str, Any]:
        """
        Analisa as colunas e dados para gerar o mapeamento semântico e instruções de uso.
        """
        logger.info(f"[Data_Interpreter] Iniciando interpretação estratégica. Domínio: {domain_name}")
        
        # Carrega o system prompt dinâmico se disponível no BD
        base_system_prompt = PromptService.get_system_prompt("DataInterpreterAgent", DATA_INTERPRETER_SYSTEM_PROMPT)
        
        # Priorização de Contexto: Se vier do projeto (explícito), usa o explícito.
        # Caso contrário, tenta descobrir pelo nome do domínio.
        final_specialist_context = specialist_context
        
        if not final_specialist_context and domain_name:
            try:
                from apps.shared_models import PromptTemplate
                # Busca na biblioteca de templates de prompt (SPECIALIST)
                specialist_template = PromptTemplate.objects.filter(
                    name__icontains=domain_name,
                    category="SPECIALIST"
                ).first()
                if specialist_template:
                    final_specialist_context = specialist_template.content
                    logger.info(f"[Data_Interpreter] Especialista descoberto por nome: {specialist_template.name}")
            except Exception as e:
                logger.warning(f"[Data_Interpreter] Erro ao buscar especialista por domínio: {e}")

        if final_specialist_context:
            base_system_prompt += f"\n\n### DIRETRIZES DO ESPECIALISTA DE DOMÍNIO (ALTA PRIORIDADE):\n{final_specialist_context}\n"
            base_system_prompt += "\n**🚨 IMPORTANTE**: Adote a persona acima com prioridade absoluta sobre as instruções gerais."
            logger.info(f"[Data_Interpreter] Aplicando diretrizes de especialista na interpretação.")

        system_prompt = base_system_prompt
        
        # 1. Base Determinística (Heurística Local) - INSTANTÂNEA
        # Garante que todas as colunas tenham uma classificação básica antes da IA
        base_mapping = self._heuristic_fallback(columns, sample_data)
        
        manual_overrides = {}
        columns_to_infer = []
        
        # 2. Identifica Overrides Manuais (Mapeia apenas o que já existe no DB como manual)
        for col in columns:
            col_name = col.get("name")
            current_desc = col.get("description", "").strip()
            is_manual_desc = current_desc and current_desc != col_name
            
            role = None
            if col.get("is_key"): role = "PRIMARY_KEY"
            elif col.get("is_historical_date"): role = "TIME"
            elif col.get("is_category"): role = "DIMENSION"
            elif col.get("is_value"): role = "MEASURE"
            
            if is_manual_desc and role:
                manual_overrides[col_name] = {
                    "role": role,
                    "business_description": current_desc,
                    "reasoning": "Preservando definição manual do usuário."
                }
            
            columns_to_infer.append(col)

        # 3. Poda de Metadados para a IA (Otimização de Tokens)
        # Removemos os samples por coluna se vamos enviar a amostra completa mais abaixo
        columns_minimal = []
        for col in columns_to_infer:
            columns_minimal.append({
                "name": col.get("name"),
                "type": col.get("type")
            })

        # 4. Amostragem Inteligente (Smart Sampling) + Anonimização de Segurança (Layer 1)
        from apps.ai_engine.services.security_service import SecurityAnonymizerService
        
        # Limitamos a 5 linhas e truncamos strings longas para economizar tokens
        optimized_sample = []
        for row in sample_data[:5]:
            clean_row = {}
            for k, v in row.items():
                if isinstance(v, str) and len(v) > 50:
                    clean_row[k] = v[:47] + "..."
                else:
                    clean_row[k] = v
            optimized_sample.append(clean_row)
            
        # Aplica Blindagem de PII antes de enviar para a nuvem
        optimized_sample = SecurityAnonymizerService.anonymize_sample(optimized_sample)

        # 2. Invocação Bedrock
        prompt = f"""
=== SCHEMA DAS COLUNAS PARA ANÁLISE (CONCEITUAL) ===
{json.dumps(columns_minimal, indent=2, ensure_ascii=False)}

=== AMOSTRA REDUZIDA (LINHAS REAIS - TOP 5) ===
{json.dumps(optimized_sample, indent=2, ensure_ascii=False)}

Gere o mapeamento semântico seguindo estas regras de OURO:
1. **DESCRIÇÃO DE NEGÓCIO**: O campo 'business_description' DEVE ser uma explicação amigável para executivos. 
   - Proibido: "Vlr Fatur"
   - Obrigatório: "Volume total de faturamento bruto da transação"
2. **CONTEXTO**: Use a amostra para entender se uma coluna 'STATUS' é de 'Vendas', 'Qualidade' ou 'Entrega'.
"""
        
        try:
            print(f"[Data_Interpreter] 📡 Solicitando inteligência ao Amazon Bedrock (Contexto: {domain_name or 'Geral'})...")
            result = self.bedrock_service.invoke_with_json_output(
                system_prompt=system_prompt,
                user_message=prompt,
                max_tokens=4000,
                trace=trace
            )
            
            if not result or "column_mapping" not in result:
                print("[Data_Interpreter] ⚠️ Resposta inválida da LLM. Ativando Base Heurística.")
                result = {
                    "column_mapping": base_mapping,
                    "dataset_summary": "Processamento local (Heurística).",
                    "strategic_insights": ["Análise semântica simplificada aplicada localmente."]
                }
                
            # Mescla Heurística -> IA -> Overrides (Crescente de autoridade)
            llm_mapping = result.get("column_mapping", {})
            
            # Novo Dicionário Final partindo da base heurística
            final_mapping = base_mapping.copy()
            
            # IA sobrescreve apenas o que ela analisou (Selective Mapping)
            for col_name, mapping in llm_mapping.items():
                if col_name in final_mapping:
                    final_mapping[col_name].update(mapping)
                else:
                    final_mapping[col_name] = mapping
            
            # Overrides Manuais sobrescrevem TUDO
            for col_name, override in manual_overrides.items():
                final_mapping[col_name] = override
                
            result["column_mapping"] = final_mapping
            # --- NOVO: Correção Pós-Inferência (Hard Rules) ---
            from apps.ai_engine.services.analytics_guardrails import AnalyticsGuardrails
            if isinstance(llm_mapping, dict):
                incorrect_cols = AnalyticsGuardrails.identify_incorrect_measures(llm_mapping)
                for col in incorrect_cols:
                    if col in llm_mapping:
                        logger.warning(f"[Data_Interpreter] Corrigindo classificação da coluna '{col}': MEASURE -> DIMENSION.")
                        llm_mapping[col]["role"] = "DIMENSION"
                        current_reason = llm_mapping[col].get("reasoning", "")
                        llm_mapping[col]["reasoning"] = f"{current_reason} [CORRIGIDO PELO GUARDRAIL]".strip()

            # --- NOVO: Rigor de Composição (4+3) ---
            suggested = result.get("suggested_widgets", [])
            if isinstance(suggested, list) and len(suggested) > 0:
                kpis = [w for w in suggested if w.get("type") == "BIGNUMBER"][:4]
                charts_or_tables = [w for w in suggested if w.get("type") in ["CHART", "TABLE", "BAR", "LINE", "PIE"]][:3]
                result["suggested_widgets"] = kpis + charts_or_tables
                logger.info(f"[Data_Interpreter] Composição 4+3 aplicada: {len(kpis)} KPIs e {len(charts_or_tables)} Gráficos/Tabelas.")

            logger.info(f"[Data_Interpreter] Análise estratégica concluída para {len(llm_mapping)} colunas.")
            return result
            
        except Exception as e:
            print(f"[Data_Interpreter] ❌ Falha na interpretação IA ({e}). Ativando Heurística Local.")
            heuristic_mapping = self._heuristic_fallback(columns_to_infer, sample_data)
            
            # Mescla overrides
            for col_name, override in manual_overrides.items():
                heuristic_mapping[col_name] = override

            return {
                "column_mapping": heuristic_mapping,
                "dataset_summary": "Dataset processado via Heurística de Emergência (Zero-Infra).",
                "strategic_insights": ["Identificação automática de campos baseada em padrões de nomenclatura."],
                "error": str(e)
            }

    def _heuristic_fallback(self, columns: List[Dict[str, Any]], sample: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Lógica determinística para não deixar o usuário na mão caso a IA falhe.
        """
        mapping = {}
        for col in columns:
            name = col.get("name", "").lower()
            dtype = col.get("type", "").lower()
            
            role = "DIMENSION"
            desc = name.replace("_", " ").title()
            reason = "Classificação por padrão de nome/tipo."
            
            # 1. Chaves
            if any(k in name for k in ["id", "uuid", "pk", "key", "codigo", "cod_", "metadata_"]):
                role = "PRIMARY_KEY"
                desc = f"Identificador: {desc}"
            # 2. Tempo
            elif any(k in name for k in ["data", "date", "dt_", "time", "created", "update", "inicio", "fim", "_at", "período"]):
                role = "TIME"
                desc = f"Data/Hora: {desc}"
            # 3. Métricas (Numéricos que não pareçam IDs nem Perfis)
            elif dtype in ["double", "float", "decimal", "int", "bigint", "long"] or any(k in name for k in ["nps", "nota", "score", "resposta", "valor", "vlr", "métrica"]):
                # Proteção contra campos demográficos (Idade, Tempo) serem tratados como métricas somáveis
                demographic_keywords = ["idade", "age", "anos", "meses", "tempo", "months", "years", "sexo", "gender"]
                if role != "PRIMARY_KEY" and not any(k in name for k in demographic_keywords):
                   role = "MEASURE"
                   desc = f"Métrica: {desc}"
                else:
                   role = "DIMENSION"
                   desc = f"Perfil/Atributo: {desc}"
            
            # Identifica Marcadores de DNA de Risco (Elected Variables)
            risk_marker = None
            is_elected = False
            
            # Normaliza o nome para busca em keywords
            n = name.lower()
            
            # 1. Saldo / Exposição (BALANCE/EXPOSURE)
            if any(k in n for k in ["saldo", "balance_mes", "exp_total", "valor_devedor", "exposure", "ead", "vlr_dev"]):
                risk_marker = "BALANCE"
                is_elected = True
            # 2. Renda (INCOME)
            elif any(k in n for k in ["renda", "income", "salario", "faturamento", "receita_mensal"]):
                risk_marker = "INCOME"
                is_elected = True
            # 3. Atraso (LATE_DAYS)
            elif any(k in n for k in ["atraso", "late_days", "dias_vencido", "dpd", "overdue", "aging"]):
                risk_marker = "LATE_DAYS"
                is_elected = True
            # 4. Limite (LIMIT)
            elif any(k in n for k in ["limite", "limit_credito", "max_cap", "lim_aprovado"]):
                risk_marker = "LIMIT"
                is_elected = True
            # 5. Probabilidade de Default (PD)
            elif any(k in n for k in ["pd_", "probabilidade", "prob_default", "p_default"]):
                risk_marker = "PD"
                is_elected = True
            # 6. Perda dado o Default (LGD)
            elif any(k in n for k in ["lgd_", "loss_given", "perda_default"]):
                risk_marker = "LGD"
                is_elected = True
            # 7. Garantias (COLLATERAL)
            elif any(k in n for k in ["garantia", "collateral", "imovel_vlr", "veiculo_vlr", "ltv_"]):
                risk_marker = "COLLATERAL"
                is_elected = True
            # 8. Score de Crédito (SCORE)
            elif any(k in n for k in ["score", "rating", "pontuacao", "bureau", "serasa", "boavista"]):
                risk_marker = "SCORE"
                is_elected = True
            # 9. Recuperação (RECOVERY)
            elif any(k in n for k in ["recuperacao", "recovery", "vlr_pago_atraso"]):
                risk_marker = "RECOVERY"
                is_elected = True
            # 10. Default Flag (DEFAULT)
            elif any(k in n for k in ["flag_default", "is_default", "inadimplente", "bad_"]):
                risk_marker = "DEFAULT_FLAG"
                is_elected = True

            mapping[col.get("name")] = {
                "role": role,
                "business_description": desc,
                "risk_dna_marker": risk_marker,
                "is_elected_for_risk": is_elected,
                "reasoning": reason
            }
            print(f"   - [Heurística] {col.get('name')} -> {role} ({desc})")
            
        return mapping
