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
3. CONSTRAINTS DE RENDERIZAÇÃO (MUITO IMPORTANTE): O 'prompt' dentro de cada widget é um comando para um Analista de Dados Gerar SQL. Logo, seu 'prompt' deve ser altamente determinístico:
   - Para BIGNUMBER: Exija agregação que retorne apenas UM valor único escalar. (ex: 'Total somado de Receita').
   - Para CHART_PIE: Exija que o SQL retorne exatamente DUAS colunas: [Categoria, Valor numérico]. (ex: 'Agrupe a contagem de clientes por gênero (Masculino e Feminino)').
   - Para CHART_BAR / CHART_LINE: Exija que o SQL retorne exatamente DUAS colunas [Eixo X, Eixo Y] ou TRES colunas se houver série multi-linha [Série, Eixo X, Eixo Y].
4. CALIBRAGEM VIA DATA PROFILE: Utilize as chaves `data_profile` e `data_sample` recebidas em cada dataset para:
   - Identificar faixas de valores (min/max) e sugerir filtros inteligentes (ex: "apenas contas ativas").
   - Verificar se as colunas numéricas de fato possuem valores (average > 0) antes de sugerir um cálculo de média anual.
   - Usar os nomes exatos das colunas (case-sensitive) conforme detectado no schema.
5. ROBUSTEZ ANALÍTICA: Evite sugerir "Desvio Padrão", "Variância" ou cálculos estatísticos complexos nos BIGNUMBER, pois são instáveis e dificilmente fornecem insight rápido. Priorize: Soma (Total), Média (Ticket Médio/Performance), Contagem (Volume/Volumetria) e Percentual de Crescimento.

## TIPO DE WIDGETS SUPORTADOS:
- BIGNUMBER: Para métricas únicas.
- CHART_BAR: Comparação categorias.
- CHART_LINE: Séries temporais.
- CHART_PIE: Proporções percentuais ou partes de um todo.

## SAÍDA EXIGIDA (JSON):
{
  "report_title": "Título do Relatório",
  "report_summary": "Resumo executivo",
  "widgets": [
    {
      "id": "bn_1",
      "title": "Breve nome da Metrica",
      "type": "BIGNUMBER", // ou CHART
      "subType": "PIE", // (Obrigatório se for CHART: BAR, LINE ou PIE. Remova se for BIGNUMBER)
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
            result = self.bedrock_service.invoke_with_json_output(
                system_prompt=system_prompt,
                user_message=user_message,
                temperature=0.2
            )
            return result
        except Exception as e:
            logger.error(f"[ReportDesigner] Erro ao desenhar relatório: {e}")
            return {"error": str(e), "widgets": []}
