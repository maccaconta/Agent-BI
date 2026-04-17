import json
import logging
from typing import Dict, Any, List
from apps.ai_engine.services.bedrock_service import BedrockService
from apps.ai_engine.services.prompt_service import PromptService

logger = logging.getLogger(__name__)

REPORT_DESIGNER_SYSTEM_PROMPT = """Você é o Especialista de UX Analítico e Designer Estratégico da NTT DATA.
Sua missão é transformar um "Prompt Global de Layout" do usuário em um plano estruturado de relatórios e painéis (widgets).

## REGRAS DE DESIGN (OBRIGATÓRIAS):
1. O dashboard deve possuir as exatas quantidades e proporções solicitadas pelo usuário no PROMPT DO RELATÓRIO principal.
2. Seja cirúrgico: Só solicite gráficos e bignumbers que façam sentido de acordo com as colunas reais do Dataset e do Domínio de Negócio.
3. **CONSTRAINTS DE RENDERIZAÇÃO E "CASAMENTO PERFEITO" (MANDATÓRIO)**:
   - **Tabela de Integridade**:
     | Tipo Widget | Exigência de Dado | Estratégia de Prompt |
     | :--- | :--- | :--- |
     | **BIGNUMBER** | 1 Linha x 1 Coluna | "Retorne o valor consolidado único para..." |
     | **TABLE** | Multi-linha x Multi-coluna | "Liste as colunas [A, B, C] para as top X ocorrências..." |
     | **CHART** | Multi-linha x 2+ Colunas | "Agrupe [Métrica] por [Categoria] e rankeie..." |
   - **ANTI-PATTERNS (PROIBIDO)**:
     - JAMAIS peça um gráfico para uma métrica que retorna valor único (ex: "Total de Vendas"). Se o widget for gráfico, seu prompt DEVE obrigar um agrupamento (ex: "Total de Vendas por Regional").
     - **Diferenciação Métrica vs Dimensão**: Inteiros e Floats (como idade, salário) são quase sempre MÉTRICAS (SUM, AVG). Não agrupe por eles (GROUP BY) a menos que queira uma distribuição de frequências. Categorias preferenciais: Strings com baixa cardinalidade ou Datas.
     - JAMAIS peça uma listagem (TABLE) sem um critério de ordenação ou limite.
4. **ESTILO DE COMANDO**: O 'prompt' dentro de cada widget é uma instrução para um gerador de SQL. Use verbos de ação: "Calcule...", "Agrupe...", "Extraia...", "Compare...".
5. CALIBRAGEM VIA DATA PROFILE: Utilize as chaves `data_profile` e `data_sample` recebidas em cada dataset para:
   - Identificar faixas de valores (min/max) e sugerir filtros inteligentes (ex: "apenas contas ativas").
   - Verificar se as colunas numéricas de fato possuem valores (average > 0) antes de sugerir um cálculo de média anual.
   - Usar os nomes exatos das colunas (case-sensitive) conforme detectado no schema.
6. ROBUSTEZ ANALÍTICA: Evite sugerir "Desvio Padrão", "Variância" ou cálculos estatísticos complexos nos BIGNUMBER, pois são instáveis e dificilmente fornecem insight rápido. Priorize: Soma (Total), Média (Ticket Médio/Performance), Contagem (Volume/Volumetria) e Percentual de Crescimento.
7. **ESPECIFICAÇÃO DE GRÁFICOS (MANDATÓRIO)**: Todo widget do tipo `CHART` **DEVE** possuir obrigatoriamente a chave `subType` com um dos seguintes valores: `BAR`, `LINE` ou `PIE`. Nunca deixe esta chave vazia ou ausente se o tipo for CHART.

## TIPO DE WIDGETS SUPORTADOS:
- BIGNUMBER: Para métricas únicas.
- CHART: Para visualizações gráficas (Requer subType: BAR, LINE ou PIE).
- TABLE: Para listagens detalhadas (máximo 10 colunas).

## SAÍDA EXIGIDA (JSON):
{
  "report_title": "Título do Relatório",
  "report_summary": "Resumo executivo",
  "widgets": [
    {
      "id": "bn_1",
      "title": "Breve nome da Metrica",
      "type": "CHART", // BIGNUMBER, CHART ou TABLE
      "subType": "BAR", // OBRIGATÓRIO se for CHART: BAR, LINE ou PIE.
      "prompt": "prompt detalhado, coerente e com a especificação exata de colunas conforme regras."
    }
  ]
}
"""

class ReportDesignerAgent:
    def __init__(self):
        self.bedrock_service = BedrockService()

    def design_report(self, report_prompt: str, datasets_metadata: List[Dict[str, Any]]) -> Dict[str, Any]:
        system_prompt = PromptService.get_system_prompt("ReportDesignerAgent", REPORT_DESIGNER_SYSTEM_PROMPT)
        
        user_message = f"""
PROMPT DO RELATÓRIO:
"{report_prompt}"

METADADOS DOS DATASETS:
{json.dumps(datasets_metadata, indent=2, ensure_ascii=False)}

Gere o plano estruturado do dashboard em formato JSON.
"""
        try:
            # ETAPA 1: DESIGN INICIAL
            logger.info("[ReportDesigner] 🎨 Gerando design inicial...")
            initial_plan = self.bedrock_service.invoke_with_json_output(
                system_prompt=system_prompt,
                user_message=user_message,
                temperature=0.2
            )
            
            # ETAPA 2: AUTO-AUDITORIA E REFINAMENTO (ELEVAÇÃO ANALÍTICA)
            logger.info("[ReportDesigner] 🔍 Iniciando Ciclo de Auto-Auditoria...")
            refined_plan = self._refine_prompts(initial_plan, datasets_metadata)
            
            return refined_plan
        except Exception as e:
            logger.error(f"[ReportDesigner] Erro ao desenhar relatório: {e}")
            return {"error": str(e), "widgets": []}

    def _refine_prompts(self, plan: Dict[str, Any], metadata: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Atua como um Auditor Analítico para refinar os prompts de cada widget, 
        garantindo que o SQL gerado posteriormente seja robusto.
        """
        auditor_system_prompt = """Você é o Auditor de Qualidade Analítica e Master de NL2SQL da NTT DATA.
Sua missão é REVISAR e REFINAR os prompts dos widgets gerados por outro agente.

## OBJETIVOS DA AUDITORIA (CRÍTICO):
1. **VERIFICAÇÃO DE EIXOS**: Se o widget for um CHART (BAR, LINE, PIE) e o prompt NÃO solicitar explicitamente um agrupamento (ex: "por...", "separado por...", "evolução de..."), o prompt está INVÁLIDO. Você DEVE corrigi-lo adicionando uma dimensão lógica do dataset (ex: por categoria, por data, por região).
2. **DETERMINISMO**: Garanta que o prompt mencione explicitamente as colunas necessárias conforme os metadados.
3. **ROBUSTEZ**: Instrua o prompt a lidar com valores nulos (COALESCE/IFNULL).
4. **CLAREZA DE MÉTRICA**: Se for BIGNUMBER, garanta que o prompt exija agregação única e proíba dimensões de agrupamento.
5. **OTIMIZAÇÃO DE 'TABLE'**: Se o widget for TABLE, garanta que o prompt peça as colunas mais relevantes para o negócio (máximo 5-8 colunas).

Retorne o exato mesmo JSON recebido, preservando obrigatoriamente todas as chaves de metadados (`id`, `type`, `subType`, `title`), mas com os textos da chave 'prompt' otimizados. Nunca remova a chave 'subType' se o widget for um CHART."""

        user_message = f"""
PLANO ATUAL:
{json.dumps(plan, indent=2, ensure_ascii=False)}

METADADOS REAL (DATASETS):
{json.dumps(metadata, indent=2, ensure_ascii=False)}

Refine os prompts para garantir 100% de precisão analítica.
"""
        try:
            refined = self.bedrock_service.invoke_with_json_output(
                system_prompt=auditor_system_prompt,
                user_message=user_message,
                temperature=0.1
            )
            return refined if refined else plan
        except Exception as e:
            logger.warning(f"[ReportDesigner] Falha na auditoria, usando plano original: {e}")
            return plan
