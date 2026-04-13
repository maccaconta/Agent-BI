"""
apps.ai_engine.services.html_renderer_service
Camada de renderizacao HTML do dashboard.
"""
from __future__ import annotations

import json
from typing import Any

from django.utils import timezone


class DashboardHtmlRendererService:
    OPERATIONAL_MARKER = 'data-agent-bi-operational-dashboard="true"'

    def render_premium_deterministic_dashboard(self, dashboard, widget_results, diagnostico_consolidado: str = "") -> str:
        """
        Gera o HTML do dashboard de forma determinística (sem LLM de layout).
        Garante estabilidade total, zero sobreposição e alta performance.
        """
        # Utiliza o nome do Projeto que o usuário digitou na etapa inicial
        project_name = dashboard.project.name if dashboard.project else dashboard.name
        title = self._escape_html(project_name)
        generated_at = timezone.now().strftime("%d/%m/%Y %H:%M")
        
        # Separação de widgets por tipo para o grid
        kpis = [w for w in widget_results if w.get('visual_type') == 'BIGNUMBER']
        others = [w for w in widget_results if w not in kpis]

        # Montagem do Layout Principal (Usando f-string para o esqueleto)
        html_body = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Inter', sans-serif; background-color: #F8F9FA; color: #1A1A1A; margin: 0; }}
    .kpi-card {{ background: white; border-radius: 24px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #F1F1F1; transition: all 0.3s ease; }}
    .kpi-card:hover {{ transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); border-color: #D4AF37; }}
    .kpi-value {{ background: linear-gradient(135deg, #1A1A1A 0%, #444 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
    .kpi-label {{ color: #D4AF37; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; word-break: break-word; line-height: 1.4; display: block; }}
    @media print {{ .no-print {{ display: none; }} }}
  </style>
</head>
<body class="p-4 md:p-10" data-agent-bi-operational-dashboard="true">
  <div id="dashboard-container" class="max-w-7xl mx-auto">
    
    <header class="flex items-center justify-between mb-12 pb-8 border-b border-gray-100 gap-4">
      <div class="flex-none basis-[100px] md:basis-[150px] flex justify-start items-center">
        <img src="/logos/aws-partner.png" alt="AWS" class="h-5 md:h-6 w-auto object-contain opacity-90" />
      </div>
      <div class="flex-1 text-center">
        <h1 class="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter italic text-gray-900 leading-tight">{title}</h1>
        <p class="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-[0.3em] mt-2 font-bold">Relatório Executivo • Inteligência Competitiva • {generated_at}</p>
      </div>
      <div class="flex-none basis-[100px] md:basis-[150px] flex justify-end items-center">
        <img src="/logos/ntt-data-black.png" alt="NTT DATA" class="h-6 md:h-8 w-auto object-contain" />
      </div>
    </header>

    {self._render_kpi_grid(kpis)}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
      {self._render_other_widgets(others)}
    </div>

    {self._render_diagnostico(diagnostico_consolidado)}

    <footer class="mt-20 pt-8 border-t border-gray-100 flex justify-between items-center no-print">
      <span class="text-[10px] text-gray-300 font-bold tracking-widest uppercase">Agent-BI Engine v2.0 • NTT DATA Private</span>
      <button onclick="window.print()" class="text-[10px] bg-gray-900 text-white px-6 py-2 rounded-full font-bold hover:bg-black transition-colors">EXPORTAR PDF</button>
    </footer>
  </div>
"""
        
        # Injeção SEGURA de Scripts (Sem f-string para evitar conflitos de chaves)
        scripts_section = "\n  <script>\n    setTimeout(function() {\n"
        scripts_section += self._assemble_scripts(widget_results)
        scripts_section += "\n    }, 100);\n  </script>\n</div>\n"

        return html_body + scripts_section

    def _render_kpi_grid(self, kpis: list) -> str:
        if not kpis: return ""
        cards = ""
        for w in kpis:
            w_id = w.get('widget_id', 'Indicador')
            w_title = w.get('title', w_id)
            cards += f"""
            <div class="kpi-card min-w-0 w-full flex flex-col items-center justify-center text-center relative group">
              <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-help" title="{self._escape_html(w.get('business_rationale', 'Insight estratégico'))}">
                <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="kpi-label mb-2">{self._escape_html(w_title)}</span>
              <div id="widget-{w_id}" class="text-5xl font-black kpi-value tracking-tighter">
                <span class="text-gray-200 text-lg">...</span>
              </div>
            </div>"""
        return f'<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">{cards}</div>'

    def _render_other_widgets(self, others: list) -> str:
        html = ""
        for w in others:
            w_id = w.get('widget_id', 'Visualização')
            w_title = w.get('title', w_id)
            html += f"""
            <div class="kpi-card flex flex-col min-h-[500px] relative group">
              <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                <h3 class="text-sm font-black text-gray-800 uppercase tracking-widest italic">{self._escape_html(w_title)}</h3>
                <div class="flex items-center gap-2">
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" title="{self._escape_html(w.get('business_rationale', 'Insight estratégico'))}">
                        <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <span class="bg-gray-50 text-[9px] px-2 py-1 rounded text-gray-400 font-bold uppercase">Live Insight</span>
                </div>
              </div>
              <div id="widget-{w_id}" class="flex-1 w-full h-full min-h-[400px]"></div>
            </div>"""
        return html

    def _render_diagnostico(self, diagnostico: str) -> str:
        if not diagnostico: return ""
        lines = [line.strip() for line in diagnostico.split('\n') if line.strip()]
        formatted = "".join([f'<p class="mb-3">{self._escape_html(line)}</p>' for line in lines])
        
        return f"""
        <div class="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
          <div class="relative z-10">
            <div class="flex items-center gap-4 mb-8">
              <div class="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              </div>
              <h2 class="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Diagnóstico Estratégico</h2>
            </div>
            <div class="text-gray-600 leading-relaxed text-lg max-w-4xl space-y-4">{formatted}</div>
          </div>
        </div>"""

    def _assemble_scripts(self, results: list) -> str:
        scripts = ""
        for w in results:
            content = w.get('script_content', '')
            w_id = w.get('widget_id', 'unknown')
            w_type = w.get('visual_type', 'BAR') # Agora usa o tipo visual correto (PIE, LINE, BIGNUMBER)
            title = w.get('title', w_id.replace('_', ' ').title())
            
            # Serializa o SQL/Python retornado para ser alocado como uma string segura no JS
            content_js = json.dumps(content)
            
            scripts += f"      try {{ if(window.AgentBI && window.AgentBI.renderWidget) {{ window.AgentBI.renderWidget('widget-{w_id}', {content_js}, '{w_type}', '{title}'); }} else {{ console.warn('AgentBI runtime indisponível para {w_id}'); }} }} catch(e) {{ console.error('Erro no widget {w_id}:', e); }}\n"
        return scripts

    def _escape_html(self, value: Any) -> str:
        text = str(value or "")
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#39;")

    def is_operational_dashboard_html(self, html: str) -> bool:
        return self.OPERATIONAL_MARKER in (html or "")
