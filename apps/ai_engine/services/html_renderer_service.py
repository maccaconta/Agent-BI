"""
apps.ai_engine.services.html_renderer_service
Camada de renderizacao HTML do dashboard.
"""
from __future__ import annotations

import json
import re
from typing import Any

from django.utils import timezone


class DashboardHtmlRendererService:
    OPERATIONAL_MARKER = 'data-agent-bi-operational-dashboard="true"'

    def render_premium_deterministic_dashboard(self, dashboard, widget_results, diagnostico_consolidado: str = "", is_blueprint: bool = False) -> str:
        """
        Gera o HTML final do dashboard com motor JS embutido. Standalone.
        """
        
        # Limpeza de insights (remover artefatos de pontuação indesejados no início/fim)
        clean_diag = diagnostico_consolidado.strip()
        clean_diag = re.sub(r'^[.,\s]+|[.,\s]+$', '', clean_diag)
        
        kpis = [w for w in widget_results if w.get('visual_type') == 'BIGNUMBER']
        others = [w for w in widget_results if w.get('visual_type') != 'BIGNUMBER']
        
        title = dashboard.project.name if dashboard.project else dashboard.name
        title = title.lstrip("/").strip()
        generated_at = timezone.now().strftime('%d %b %Y • %H:%M')
        
        dataset_ids = [str(ds.id) for ds in dashboard.project.datasets.filter(is_deleted=False)] if dashboard.project else []

        # Template HTML com Runtime embutido
        html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{self._escape_html(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Inter', sans-serif; background-color: #FDFDFD; color: #1A1A1A; margin: 0; -webkit-print-color-adjust: exact; }}
    .kpi-card {{ background: white; border-radius: 24px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); border: 1px solid #F0F0F0; transition: all 0.3s ease; break-inside: avoid; }}
    .kpi-value {{ color: #1A1A1A; font-size: 28px; font-weight: 900; margin-top: 8px; font-variant-numeric: tabular-nums; }}
    .kpi-label {{ color: #D4AF37; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; font-size: 13px; }}
    .diagnostic-box {{ break-inside: avoid; background: white; border-radius: 32px; border: 1px solid #F0F0F0; padding: 48px; box-shadow: 0 10px 40px rgba(0,0,0,0.03); }}
    @media print {{ .no-print {{ display: none; }} body {{ padding: 0 !important; }} .kpi-card {{ box-shadow: none; border: 1px solid #EEE; }} }}
  </style>
</head>
<body class="p-6 md:p-16">
  <div class="max-w-7xl mx-auto">
    
    <header class="flex flex-row items-center justify-between mb-12">
      <div class="flex-none w-32 md:w-48 flex justify-start no-print">
        <img src="/logos/ntt-data-black.png" alt="NTT DATA" style="height:32px" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/NTT_Data_logo.svg/320px-NTT_Data_logo.svg.png'" />
      </div>

      <div class="flex-grow text-center flex flex-col items-center justify-center px-4">
        { f'<div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 border border-blue-400 rounded-full mb-4 shadow-[0_0_15px_rgba(37,99,235,0.4)]"><span class="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#FFF] animate-pulse"></span><span class="text-[9px] font-black text-white uppercase tracking-widest">Certified Blueprint</span></div>' if is_blueprint else '' }
        <h1 class="text-4xl md:text-5xl font-black tracking-tightest text-gray-900 lowercase italic">{self._escape_html(title)}</h1>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em] mt-3">{generated_at}</p>
      </div>

      <div class="flex-none w-32 md:w-48 flex justify-end no-print">
        <img src="/logos/aws-partner.png" alt="AWS" style="height:35px" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/200px-Amazon_Web_Services_Logo.svg.png'" />
      </div>
    </header>

    <div class="w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-40 mb-16"></div>

    <div class="grid grid-cols-2 gap-8 mb-16">
      {self._render_widgets_ordered(widget_results)}
    </div>


    {self._render_diagnostico(clean_diag)}

    <footer class="mt-24 pt-10 border-t border-gray-100 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
      <span>Agent-BI Engine v4.0 • Strategic Analytics</span>
      <div class="flex items-center gap-4 no-print">
         <button onclick="window.focus(); window.print();" class="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-black transition-all">Exportar PDF</button>
      </div>
    </footer>
  </div>

  <script>
    console.log("[AgentBI] 🚀 Dashboard Inicializado. Aguardando DOM...");
    window.AgentBI_Datasets = {json.dumps(dataset_ids)};
    window.AgentBI = {{
      renderWidget: async (containerId, content, type, title, hasError) => {{
        console.log(`[AgentBI] 🎨 Tentativa de renderizar: ${{title}} (${{type}}) - Erro Prévio: ${{hasError}}`);
        const container = document.getElementById(containerId);
        if(!container) return;
        
        if (hasError) {{
          container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-amber-500 opacity-60">
            <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span class="text-[10px] font-black uppercase tracking-widest">Indisponível</span>
          </div>`;
          return;
        }}

        const formatValue = (val) => {{
          if (val === null || val === undefined || val === '') return '-';
          const num = parseFloat(val);
          if (isNaN(num)) return val;
          if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
          if (num > 1000) return (num / 1000).toFixed(1) + 'K';
          return num.toLocaleString('pt-BR');
        }};

        try {{
          const response = await fetch('/api/v1/ai/sql-preview', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{ sql: content, datasets: window.AgentBI_Datasets }}) 
          }});
          const data = await response.json();
          
          if (data && data.rows && data.rows.length > 0) {{
            const rows = data.rows;
            const cols = Object.keys(rows[0]);

            if (type === 'BIGNUMBER') {{
              container.innerText = formatValue(Object.values(rows[0])[0]);
            }} else if (type === 'TABLE') {{
              // --- RENDERIZADOR DE TABELAS LUXURY ---
              container.classList.remove('min-h-[150px]');
              container.classList.add('overflow-x-auto');
              let html = `<table class="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr class="border-b border-gray-100">
                    ${{cols.map(c => `<th class="py-3 px-2 font-black text-gray-400 uppercase tracking-tighter">${{c}}</th>`).join('')}}
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  ${{rows.slice(0, 15).map(r => `
                    <tr class="hover:bg-gray-50/50 transition-colors">
                      ${{cols.map(c => `<td class="py-3 px-2 font-medium text-gray-600">${{formatValue(r[c])}}</td>`).join('')}}
                    </tr>
                  `).join('')}}
                </tbody>
              </table>`;
              
              if(rows.length > 15) {{
                html += `<div class="mt-4 text-[9px] text-center font-bold text-gray-300 uppercase tracking-widest">+ ${{rows.length - 15}} registros ocultos para brevidade executiva</div>`;
              }}
              container.innerHTML = html;
            }} else {{
              const chart = echarts.init(container);
              const isPie = type.toLowerCase() === 'pie';
              const xAxisData = rows.map(r => r[cols[0]]);
              const series = cols.slice(1).map(c => ({{
                name: c, type: isPie ? 'pie' : 'bar',
                colorBy: isPie ? 'data' : (cols.length === 2 ? 'data' : 'series'),
                radius: isPie ? ['40%', '70%'] : undefined,
                data: isPie ? rows.map(r => ({{name: r[cols[0]], value: r[c]}})) : rows.map(r => r[c])
              }}));

              chart.setOption({{
                color: ['#112A46', '#D4AF37', '#1A2530', '#0F4C5C', '#7F8C8D', '#34495E', '#BDC3C7'],
                tooltip: {{ trigger: isPie ? 'item' : 'axis' }},
                legend: {{ bottom: 0, textStyle: {{ fontSize: 8, fontWeight: 'bold' }} }},
                grid: {{ top: 40, bottom: 60, left: 60, right: 30 }},
                xAxis: isPie ? undefined : {{ type: 'category', data: xAxisData, axisLabel: {{ fontSize: 9 }} }},
                yAxis: isPie ? undefined : {{ type: 'value', axisLabel: {{ fontSize: 9 }} }},
                series: series
              }});
            }}
          }}
          console.log(`[AgentBI] ✅ Widget ${{title}} renderizado com sucesso.`);
        }} catch (e) {{ 
          console.error(`[AgentBI] ❌ Erro ao renderizar ${{title}}:`, e);
          container.innerText = 'Erro de Dados'; 
        }}
      }}
    }};

    document.addEventListener('DOMContentLoaded', () => {{
      {self._assemble_scripts(widget_results)}
    }});
  </script>
</body>
</html>"""
        return html

    def _render_widgets_ordered(self, results: list) -> str:
        """
        Renderiza todos os widgets em uma única sequência, respeitando a ordem da lista.
        """
        html = ""
        for w in results:
            v_type = w.get('visual_type', 'CHART')
            
            if v_type == 'BIGNUMBER':
                html += self._render_single_kpi(w)
            else:
                html += self._render_single_complex_widget(w)
        return html

    def _render_single_kpi(self, w: dict) -> str:
        w_id = w.get('widget_id', 'Indicador')
        w_title = w.get('title', w_id)
        has_error = not w.get('success', True)
        error_class = "border-amber-100 bg-amber-50/30" if has_error else "border-[#F0F0F0]"
        
        return f"""
        <div class="kpi-card col-span-1 min-w-0 w-full flex flex-col items-center justify-center text-center relative group {error_class}">
          <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-help" title="{self._escape_html(w.get('business_rationale', 'Insight estratégico'))}">
            <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <span class="kpi-label mb-2">{self._escape_html(w_title)}</span>
          <div id="widget-{w_id}" class="text-5xl font-black kpi-value tracking-tighter">
            <span class="text-gray-200 text-lg">...</span>
          </div>
        </div>"""

    def _render_single_complex_widget(self, w: dict) -> str:
        w_id = w.get('widget_id', 'Visualização')
        w_title = w.get('title', w_id)
        has_error = not w.get('success', True)
        error_class = "border-amber-100 bg-amber-50/10" if has_error else "border-[#F0F0F0]"
        
        return f"""
        <div class="kpi-card col-span-2 flex flex-col min-h-[500px] relative group {error_class}">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
            <h3 class="text-sm font-black uppercase tracking-widest italic" style="color: #D4AF37;">{self._escape_html(w_title)}</h3>
            <div class="flex items-center gap-2">
                <div class="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" title="{self._escape_html(w.get('business_rationale', 'Insight estratégico'))}">
                    <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                { '<span class="bg-amber-100 text-[9px] px-2 py-1 rounded text-amber-600 font-bold uppercase">LLM Offline</span>' if has_error else '<span class="bg-gray-50 text-[9px] px-2 py-1 rounded text-gray-400 font-bold uppercase">Live Insight</span>' }
            </div>
          </div>
          <div id="widget-{w_id}" class="flex-1 w-full h-full min-h-[400px]"></div>
        </div>"""

    def _render_other_widgets(self, others: list) -> str:
        html = ""
        for w in others:
            w_id = w.get('widget_id', 'Visualização')
            w_title = w.get('title', w_id)
            has_error = not w.get('success', True)
            error_class = "border-amber-100 bg-amber-50/10" if has_error else "border-[#F0F0F0]"
            
            html += f"""
            <div class="kpi-card flex flex-col min-h-[500px] relative group {error_class}">
              <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                <h3 class="text-sm font-black uppercase tracking-widest italic" style="color: #D4AF37;">{self._escape_html(w_title)}</h3>
                <div class="flex items-center gap-2">
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" title="{self._escape_html(w.get('business_rationale', 'Insight estratégico'))}">
                        <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    { '<span class="bg-amber-100 text-[9px] px-2 py-1 rounded text-amber-600 font-bold uppercase">LLM Offline</span>' if has_error else '<span class="bg-gray-50 text-[9px] px-2 py-1 rounded text-gray-400 font-bold uppercase">Live Insight</span>' }
                </div>
              </div>
              <div id="widget-{w_id}" class="flex-1 w-full h-full min-h-[400px]"></div>
            </div>"""
        return html

    def _render_diagnostico(self, diagnostico: str) -> str:
        if not diagnostico: return ""
        # Limpeza de pontuação indesejada gerada por modelos de IA (ex: .,)
        clean_text = diagnostico.replace('.,', '.').replace(',.', '.')
        lines = [line.strip() for line in clean_text.split('\n') if line.strip()]
        formatted = "".join([f'<p class="mb-3">{self._escape_html(line)}</p>' for line in lines])
        
        return f"""
        <div class="diagnostic-box bg-white rounded-[2.5rem] p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
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
            w_type = w.get('visual_type', 'BAR')
            title = w.get('title', w_id.replace('_', ' ').title())
            has_error = "true" if not w.get('success', True) else "false"
            
            content_js = json.dumps(content)
            scripts += f"window.AgentBI.renderWidget('widget-{w_id}', {content_js}, '{w_type}', {json.dumps(title)}, {has_error});\n"
        return scripts

    def _escape_html(self, value: Any) -> str:
        text = str(value or "")
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#39;")

    def is_operational_dashboard_html(self, html: str) -> bool:
        return self.OPERATIONAL_MARKER in (html or "")
