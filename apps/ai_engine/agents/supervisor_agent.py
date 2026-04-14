import json
import logging
from typing import Dict, Any, List

from django.conf import settings
from apps.ai_engine.services.bedrock_service import BedrockService
from apps.ai_engine.services.prompt_service import PromptService

logger = logging.getLogger(__name__)

SUPERVISOR_SYSTEM_PROMPT = """Você é o Supervisor Analítico de Alta Performance da NTT DATA. 
Sua missão é garantir que a pergunta do usuário seja respondida pelo especialista com maior capacidade analítica.

## REGRAS DE ROTEAMENTO (MANDATÓRIAS):
1. **ROUTE_NL2SQL**: Rota padrão para TODA análise de dados:
   - Cálculos de Inadimplência, Probabilidade de Default (PD), Riscos e Ratings.
   - Listagens, agrupamentos, filtros e queries complexas de negócio.
   - Sempre consulte os metadados para gerar o SQL mais preciso.

2. **ROUTE_KB_RAG**: Use apenas para definições conceituais ou normas de compliance.

## Saída Exigida
Retorne estritamente um JSON:
{
  "reasoning": "Justificativa da escolha da rota analítica",
  "route": "ROUTE_NL2SQL" | "ROUTE_KB_RAG"
}
"""

class SupervisorAgent:
    """
    Agente responsável por rotear a intenção do usuário para o Sub-Agente especialista 
    correto (NL2SQL para dados tabelares, Pandas para estatística, KB para RAG).
    """
    def __init__(self):
        self.bedrock_service = BedrockService()

    def determine_route(self, user_prompt: str, datasets_metadata: List[Dict[str, Any]] = None, trace=None) -> Dict[str, Any]:
        """
        Determina a melhor rota para a solicitação do usuário.
        """
        system_prompt = PromptService.get_system_prompt("SupervisorAgent", SUPERVISOR_SYSTEM_PROMPT)
        
        prompt = f"""
Pergunta do Usuário: "{user_prompt}"

=== METADADOS DOS DATASETS DISPONÍVEIS ===
{json.dumps(datasets_metadata, indent=2, ensure_ascii=False) if datasets_metadata else "Nenhum dataset carregado."}

Analise a pergunta e o contexto para decidir a melhor rota.
"""
        try:
            decision_json = self.bedrock_service.invoke_with_json_output(
                system_prompt=system_prompt,
                user_message=prompt,
                temperature=0.1,
                trace=trace
            )
            
            if not decision_json:
                raise ValueError("Supervisor não conseguiu gerar uma decisão JSON válida.")
            
            route = decision_json.get("route", "ROUTE_NL2SQL")
            valid_routes = ["ROUTE_NL2SQL", "ROUTE_KB_RAG"]
            if route not in valid_routes:
                route = "ROUTE_NL2SQL"
                decision_json["route"] = route
            
            logger.info(f"[Supervisor] Rota Selecionada: {route}")
            if trace:
                trace.log_thought("Supervisor", f"Decidido rotear para {route}. Raciocínio: {decision_json.get('reasoning')}")
            return decision_json
            
        except Exception as e:
            logger.error(f"[Supervisor] Falha na análise: {e}.")
            return {
                "reasoning": f"Fallback devido a erro: {str(e)}",
                "route": "ROUTE_NL2SQL"
            }

    def assemble_dashboard_html(self, dashboard: Any, widget_results: List[Dict[str, Any]], dataset_ids: List[str] = None, specialist_context: str = "", trace=None) -> str:
        """
        Pede à LLM para construir o dashboard HTML final integrando todos os resultados via AgentBI Runtime.
        """
        import json
        dataset_ids_json = json.dumps(dataset_ids or [])
        
        # O Supervisor agora foca apenas no fragmento HTML. 
        # A infraestutura técnica (Echarts/Tailwind) é fornecida pela Shell do Frontend.
        if trace:
            trace.log_thought("Supervisor", f"Gerando fragmento de layout estruturado para '{dashboard.name}'.")

        system_prompt = f"""Você é o Senior UI/UX Engineer e Arquiteto de Dashboards Corporativos da NTT DATA. 
Sua missão é criar o LAYOUT de um Dashboard Executivo, Limpo e Elegante com foco em clareza institucional.

## CONTRATO TÉCNICO DE RENDERIZAÇÃO (CRÍTICO):
- O ambiente já possui a função global `AgentBI.renderWidget(containerId, sql, type, title)` e Tailwind CSS.
- **MANDATÓRIO**: Para cada widget fornecido, você DEVE gerar:
    1. Um elemento container (geralmente uma `div`) com estilo CSS apropriado.
    2. Dentro ou logo após esse container, um elemento `<div id="[WIDGET_ID]" class="min-h-[150px]"></div>` para servir de âncora.
    3. Uma tag `<script>` contendo a chamada: `AgentBI.renderWidget('[WIDGET_ID]', `[SQL]`, '[TYPE]', '[TITLE]');`.
- NÃO use blocos de código Markdown (```html). Retorne APENAS o código puro.

## REGRAS DE LAYOUT CORPORATIVO (OBRIGATÓRIAS):
1. **Corporate Branding**: Cabeçalho simétrico com Logos e Título. Inclua no topo:
   `<div class="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
      <div class="flex items-center gap-10">
        <img src="/logos/ntt-data.svg" class="h-10 object-contain" />
        <div class="h-10 w-[1px] bg-gray-200"></div>
        <img src="/logos/aws.svg" class="h-10 object-contain" />
      </div>
      <div class="text-right">
        <h1 class="text-3xl font-black text-gray-900 tracking-tighter italic font-serif">${dashboard.name}</h1>
        <p class="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Intelligence Report Room</p>
      </div>
    </div>`.
2. **KPI Line (GRID ROBUSTO)**: Para widgets 'BIGNUMBER', use obrigatoriamente:
   `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">`
   - Cada card KPI DEVE ser auto-ajustável com `w-full min-w-0 overflow-hidden`.
3. **Seções de Gráficos**: Grid responsivo `grid grid-cols-1 md:grid-cols-2 gap-10 mb-12`.
4. **Diagnóstico Estratégico (RODAPÉ)**: Procure pelo container `<div id="dashboard_insights" class="mt-16 p-10 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden"></div>`. 
   - **MANTENHA A FIDELIDADE**: Use o texto fornecido em 'DIAGNÓSTICO CONSOLIDADO DA INGESTÃO' para preencher esta seção. Não invente novos insights se já houver dados no contexto.

## ESTILO PREMIUM LIGHT (MANDATÓRIO):
- TODOS os widgets DEVEM usar `.kpi-card`.
- **ALTURAS**: KPI deve ser compacto. Gráficos devem ter `min-h-[450px]`.
- Fundo do Dashboard: `#F8F9FA`.

### CONTEXTO DO ESPECIALISTA E DADOS:
{specialist_context}

Retorne apenas o fragmento HTML estruturado."""

        user_message = f"""
NOME DO DASHBOARD: {dashboard.name}
        
WIDGETS E SEUS SQLs:
{json.dumps(widget_results, indent=2, ensure_ascii=False)}

Gere o fragmento de layout chamando renderWidget para cada widget listado acima.
"""
        try:
            html = self.bedrock_service.invoke(
                system_prompt=system_prompt,
                user_message=user_message,
                temperature=None,
                trace=trace
            )
            
            # Limpeza de possíveis marks de markdown que a IA possa ter incluído
            if "```" in html:
                import re
                match = re.search(r"```(?:html)?\s*(.*?)\s*```", html, re.DOTALL)
                if match:
                    html = match.group(1).strip()
                else:
                    html = html.replace("```html", "").replace("```", "").strip()

            if trace:
                trace.end_step("UI/UX Architect", message="HTML do Dashboard gerado com sucesso.")
            return html
        except Exception as e:
            logger.error(f"[Supervisor] Erro ao montar HTML: {e}")
            return f"<div class='p-10 border border-red-500 bg-red-50 text-red-900 rounded-xl'><h1>Falha na Montagem</h1><p>{str(e)}</p></div>"
