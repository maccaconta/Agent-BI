"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Loader2,
  CloudUpload,
  Eye as EyeIcon,
  Code as CodeIcon,
  Trash,
  Star,
  Sparkles,
  ChevronLeft,
  LayoutDashboard,
  CheckCircle2,
  Server,
  Download,
  FileJson,
  PieChart as PieChartIcon,
  BarChart,
  BarChart3,
  LineChart as LineChartIcon,
  ChevronDown,
  Activity,
  Zap,
  ShieldCheck,
  Layers,
  Table,
  Clock as ClockIcon,
  RefreshCw,
  Plus,
  Database,
  Search,
  AlertCircle,
  History,
  Edit2,
  Check,
  GripVertical
} from "lucide-react";
import DevHUD from '@/components/layout/DevHUD';
import { useRouter, useSearchParams } from "next/navigation";
import { getProjectRelationshipsKey, readProjectSources, writeProjectSources } from "@/lib/projectSources";
import { getBackendJsonHeaders } from "@/lib/backendAuth";
import { ProjectHeaderStandard } from "@/components/project/ProjectHeaderStandard";
import { ProjectPhases } from "@/components/project/ProjectPhases";

interface DashboardTab {
  id: string;
  name: string;
  prompt: string;
  isBlueprint: boolean;
  content: string;
  fullPrompt?: string;
  auditTrail?: {
    orchestrator_thought?: string;
    pandas_code?: string;
    pandas_thought?: string;
    nl2sql_sql?: string;
    nl2sql_thought?: string;
  };
  followUpSuggestions?: { label: string; prompt: string }[];
}

function DashboardContent() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<Record<string, string> | null>(null);
  const [globalPrompt, setGlobalPrompt] = useState("");
  const [plannedWidgets, setPlannedWidgets] = useState<any[]>([]);
  const [activeDashboardId, setActiveDashboardId] = useState<number | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isMaterializing, setIsMaterializing] = useState(false);
  const [materializeTimer, setMaterializeTimer] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Iniciando motor de inteligência...");
  const [tabs, setTabs] = useState<DashboardTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [dataReady, setDataReady] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [projectMetadata, setProjectMetadata] = useState<any>(null);

  // Controle de Visualização por Widget (Prompt vs SQL)
  const [widgetViewMode, setWidgetViewMode] = useState<Record<string, 'PROMPT' | 'SQL'>>({});

  const [loadingAgent, setLoadingAgent] = useState("Orquestrador de IA");
  const [loadingAction, setLoadingAction] = useState("Preparando analistas virtuais...");
  const [aiTemperature, setAiTemperature] = useState(0.3);
  const [showAuditModal, setShowAuditModal] = useState(false);
  
  const [plannerWidth, setPlannerWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [projectSources, setProjectSources] = useState<any[]>([]);
  const [sampleData, setSampleData] = useState<{tableName: string, rows: any[]} | null>(null);
  const [viewCode, setViewCode] = useState(false);
  const [projectDatasets, setProjectDatasets] = useState<any[]>([]);
  const isWorking = isPlanning || isMaterializing;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorking) {
      const phrases = [
        { agent: "🧠 Planner", action: "Elaborando plano..." },
        { agent: "💾 Data Expert", action: "Consultando base analítica..." },
        { agent: "👨‍💻 Business Analyst", action: "Formulando insights..." },
        { agent: "🎨 Frontend", action: "Desenhando cards..." },
        { agent: "🛡️ Quality Inspector", action: "Validando integridade..." }
      ];
      let i = 0;
      setLoadingAgent(phrases[0].agent);
      setLoadingAction(phrases[0].action);
      interval = setInterval(() => {
        i = (i + 1) % phrases.length;
        setLoadingAgent(phrases[i].agent);
        setLoadingAction(phrases[i].action);
      }, 2500);
    } else {
      setLoadingAgent("Agent-BI Ready");
      setLoadingAction("Aguardando nova solicitação...");
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isWorking]);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(320, Math.min(e.clientX - 32, 900));
      setPlannerWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (projectId && projectId !== 'PRJ-TEMP') {
      const sources = readProjectSources(projectId);
      setProjectSources(sources);

      // Buscar datasets reais para o contexto do dashboard
      fetch(`/api/v1/datasets/?project_id=${projectId}`, {
        headers: getBackendJsonHeaders()
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjectDatasets(data);
        } else if (data.results && Array.isArray(data.results)) {
          setProjectDatasets(data.results);
        }
      })
      .catch(err => { /* erro silenciado para producao */ });
    }
  }, [projectId]);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Prioridade 1: Query param na URL (vindo da listagem de projetos)
    // Prioridade 2: sessionStorage (fluxo contínuo do wizard)
    const urlProjectId = searchParams.get('project_id');
    const sessionProjectId = sessionStorage.getItem("agent_bi_current_project_id");
    
    const pId = urlProjectId || sessionProjectId;
    setProjectId(pId);

    const rawDraft = sessionStorage.getItem("agent_bi_project_draft");
    if (!rawDraft) return;
    try {
      const parsed = JSON.parse(rawDraft);
      setProjectDraft(parsed);
      if (parsed.aiTemperature !== undefined) setAiTemperature(parsed.aiTemperature);
    } catch { setProjectDraft(null); }
  }, [searchParams]);

  useEffect(() => {
    if (!projectId || projectId === "PRJ-TEMP" || dataReady) return;
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/v1/projects/${projectId}/`, {
          headers: getBackendJsonHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setDataReady(data.data_ready);
          setPendingCount(data.pending_datasets_count || 0);
          
          // Captura metadados para carregamento instantâneo do plano estratégico
          if (data.intake_metadata) {
             setProjectMetadata(data.intake_metadata);
          }

          if (data.dashboards && data.dashboards.length > 0) {
            setActiveDashboardId(data.dashboards[0].id);
            // Injetar Blueprint Widgets se o projeto for BLUEPRINT
            if (data.status === "BLUEPRINT" && data.blueprint_widgets && data.blueprint_widgets.length > 0 && plannedWidgets.length === 0) {
               // Blueprint carregado
               // Ordenação padronizada: KPIs primeiro
               const sortedWidgets = [...data.blueprint_widgets].sort((a: any, b: any) => {
                 if (a.type === 'BIGNUMBER' && b.type !== 'BIGNUMBER') return -1;
                 if (a.type !== 'BIGNUMBER' && b.type === 'BIGNUMBER') return 1;
                 return 0;
               });
               setPlannedWidgets(sortedWidgets);
               
               // Ativar modo SQL para todos os widgets do Blueprint
               const blueprintModes: Record<string, 'PROMPT' | 'SQL'> = {};
               sortedWidgets.forEach((w: any) => {
                 blueprintModes[w.id] = 'SQL';
               });
               setWidgetViewMode(blueprintModes);
            }
          }
        }
      } catch (err) { /* erro silenciado para producao */ }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 1500); // Polling mais agressivo para ROI de tempo
    return () => clearInterval(interval);
  }, [projectId, dataReady]);

  // Gatilho de Autostart: Se os dados estão prontos e não há widgets, inicia o planejamento automático
  useEffect(() => {
    if (dataReady && plannedWidgets.length === 0 && !isPlanning && !isMaterializing && projectId) {
       autoPlan();
    }
  }, [dataReady, plannedWidgets.length, projectId]);

  // Temporizador de Materialização (Progresso Visível)
  useEffect(() => {
    let interval: any;
    if (isMaterializing) {
      setMaterializeTimer(0);
      interval = setInterval(() => {
        setMaterializeTimer(prev => prev + 1);
      }, 1000);
    } else {
      setMaterializeTimer(0);
    }
    return () => clearInterval(interval);
  }, [isMaterializing]);

  // Mensagens dinâmicas baseadas no tempo
  useEffect(() => {
    if (!isMaterializing) return;
    if (materializeTimer < 5) setLoadingMessage("Sincronizando com Amazon Bedrock...");
    else if (materializeTimer < 12) setLoadingMessage("Orquestrando 7 widgets em paralelo...");
    else if (materializeTimer < 20) setLoadingMessage("Refinando complexidade analítica e roteamento...");
    else if (materializeTimer < 30) setLoadingMessage("Finalizando polimento e consistência no SQLite...");
    else setLoadingMessage("Quase lá! Finalizando empacotamento...");
  }, [materializeTimer, isMaterializing]);

  const autoPlan = async () => {
    if (!projectId || isPlanning) return;
    
    // ATALHO: Cache Estratégico (Pre-Planning)
    // Se a IA já desenhou o plano durante a ingestão, carregamos instantaneamente
    if (projectMetadata?.initial_strategic_plan && Array.isArray(projectMetadata.initial_strategic_plan)) {
       // Plano estrategico carregado
       setPlannedWidgets(projectMetadata.initial_strategic_plan);
       return; 
    }

    setIsPlanning(true);
    setLoadingAgent("Designer IA");
    setLoadingAction("Interpretando datasets para sugestão estratégica...");
    try {
      const response = await fetch("/api/v1/ai/report-prompt/plan", {
        method: "POST",
        headers: getBackendJsonHeaders(),
        body: JSON.stringify({
          project_id: projectId,
          global_prompt: "Gere um esqueleto estratégico sugerindo 4 indicadores chave (BIGNUMBER) e 3 gráficos analíticos (CHART) baseados exclusivamente nas reais colunas e cruzamentos analíticos desse dataset."
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.design && data.design.widgets) {
          // Ordenação estratégica: KPIs primeiro
          const sorted = [...data.design.widgets].sort((a: any, b: any) => {
            if (a.type === 'BIGNUMBER' && b.type !== 'BIGNUMBER') return -1;
            if (a.type !== 'BIGNUMBER' && b.type === 'BIGNUMBER') return 1;
            return 0;
          });
          setPlannedWidgets(sorted);
        }
      }
    } catch (err) { /* erro silenciado para producao */ }
    finally { setIsPlanning(false); }
  };

  const addWidget = (type: 'BIGNUMBER' | 'CHART') => {
    const id = `${type.toLowerCase()}_${Date.now()}`;
    const newWidget = {
      id,
      title: type === 'BIGNUMBER' ? 'Novo Indicador' : 'Novo Gráfico',
      type,
      prompt: ''
    };
    setPlannedWidgets([...plannedWidgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setPlannedWidgets(plannedWidgets.filter(w => w.id !== id));
  };

  const handleMaterialize = async () => {
    if (plannedWidgets.length === 0 || isMaterializing) return;
    setIsMaterializing(true);
    const trace_id = crypto.randomUUID();
    window.dispatchEvent(new CustomEvent('agent-bi-trace', { detail: { traceId: trace_id } }));

    try {
      const response = await fetch("/api/v1/ai/report-prompt/materialize", {
        method: "POST",
        headers: getBackendJsonHeaders(),
        body: JSON.stringify({
          dashboard_id: activeDashboardId,
          project_id: projectId,
          widget_prompts: plannedWidgets.map(w => ({ 
            id: w.id,
            title: w.title,
            prompt: w.prompt,
            type: w.type,
            subType: w.subType,
            business_rationale: w.business_rationale,
            view_mode: widgetViewMode[w.id] || 'PROMPT',
            override_sql: (w as any).sql !== undefined ? (w as any).sql : extractWidgetSql(w.id, activeTab?.content)
          })),
          trace_id: trace_id
        }),
      });

      // Tratamento resiliente de JSON para evitar erro "Unexpected token I..."
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        // erro silenciado para producao
        throw new Error("O servidor retornou um erro inesperado (Non-JSON). Verifique os logs do backend.");
      }

      if (!response.ok) throw new Error(data.detail || `Erro ${response.status} no servidor`);

      if (data.status === "success") {
        if (data.results && Array.isArray(data.results)) {
            setPlannedWidgets(prev => prev.map(w => {
                const matched = data.results.find((res: any) => res.widget_id === w.id);
                if (matched && matched.script_content) {
                    return { ...w, sql: matched.script_content };
                }
                return w;
            }));
        }

        // --- UX: Abrir abas SQL automaticamente ---
        const newModeMap: Record<string, 'PROMPT' | 'SQL'> = {};
        plannedWidgets.forEach(w => { newModeMap[w.id] = 'SQL'; });
        setWidgetViewMode(newModeMap);
        
        const dashboardIdStr = String(data.dashboard_id);
        const newTab = {
          id: dashboardIdStr,
          name: data.dashboard_name,
          prompt: "",
          content: data.dashboard_html,
          isBlueprint: false
        };
        setTabs(prev => [...prev, newTab]);
        setTimeout(() => {
          setActiveTabId(dashboardIdStr);
          setViewCode(false);
        }, 100); 
      }
    } catch (err: any) { 
      // erro silenciado para producao
      // Feedback visual simples para o usuário
      alert(`Falha na Materialização: ${err.message}`);
    } finally { 
      setIsMaterializing(false); 
    }
  };

  const handlePromote = async (tabId: string) => {
    try {
      const response = await fetch(`/api/v1/dashboards/${tabId}/promote/`, {
        method: "POST",
        headers: getBackendJsonHeaders(),
        body: JSON.stringify({
          widgets: plannedWidgets.map(w => ({
            id: w.id,
            prompt: w.prompt,
            sql: (w as any).sql || extractWidgetSql(w.id, tabs.find(t => t.id === tabId)?.content),
            type: w.type
          }))
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isBlueprint: true } : t));
        // Feedback visual de prestígio imediato
        const activeContainer = document.querySelector('.dashboard-shell-active');
        if (activeContainer) {
          activeContainer.classList.add('animate-blueprint-elevate');
          setTimeout(() => activeContainer.classList.remove('animate-blueprint-elevate'), 2000);
        }
      }
    } catch (err) { /* erro silenciado para producao */ }
  };

  const handleExportStreamlit = async () => {
    if (!activeTabId) return;
    try {
      const response = await fetch(`/api/v1/ai/export-streamlit/${activeTabId}`, {
        method: "GET",
        headers: getBackendJsonHeaders(),
      });
      if (!response.ok) throw new Error("Falha ao gerar exportação.");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent_bi_export_${activeTabId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // erro silenciado para producao
      alert("Erro ao exportar dashboard. Verifique sua conexão.");
    }
  };

  const saveTabName = (tabId: string, newName: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, name: newName } : t));
    setEditingTabId(null);
  };

  const deleteTab = (id: string) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== id));
    if (activeTabId === id && tabs.length > 1) {
      const remaining = tabs.filter((tab) => tab.id !== id);
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const wrapInPremiumShell = (fragment: string, datasets: any[], isBlueprint: boolean = false) => {
    const title = activeTab?.name || "Pipeline Canvas";
    const generatedAt = new Date().toLocaleDateString('pt-BR') + " " + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (fragment && fragment.trim().startsWith("<!DOCTYPE")) {
      return fragment;
    }

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Outfit:wght@700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; background: ${isBlueprint ? '#FFFFFF' : '#F8F9FA'}; color: #1A1A1A; margin: 0; overflow-x: hidden; transition: background 0.5s ease; }
            .kpi-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.05); border-radius: 20px; transition: all 0.4s ease; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.08); break-inside: avoid; }
            .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.12); border-color: #D4AF37; }
            .kpi-value { font-family: 'Outfit', sans-serif; color: #1A1A1A; font-weight: 800; font-size: 28px; }
            .kpi-label { color: #D4AF37; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; font-size: 11px; }
            .diagnostic-box { break-inside: avoid; }
            
            /* Melhoria Dark Mode no Iframe Shell */
            @media (prefers-color-scheme: dark) {
              body { background: ${isBlueprint ? '#FFFFFF' : '#0c0c0e'}; color: ${isBlueprint ? '#1A1A1A' : '#E0E0E0'}; }
              .kpi-card { background: ${isBlueprint ? '#FFFFFF' : '#161618'}; border-color: rgba(255,255,255,0.05); color: ${isBlueprint ? '#1A1A1A' : '#FFF'}; }
              .kpi-value { color: ${isBlueprint ? '#1A1A1A' : '#FFF'}; }
            }

            ::-webkit-scrollbar { width: 4px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 10px; }
            .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          </style>
        </head>
        <body class="p-10 animate-fade-in">
          <script>
            window.AgentBI_Context = { datasets: ${JSON.stringify(datasets)} };
            window.AgentBI = {
                renderWidget: async (containerId, sql, type, title) => {
                    const container = document.getElementById(containerId);
                    if(!container) return;
                    container.innerHTML = '<div class="flex items-center justify-center h-full opacity-20"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div></div>';
                    
                    const formatValue = (val) => {
                        if (val === null || val === undefined || val === '') return '-';
                        const num = parseFloat(val);
                        if (isNaN(num)) return val;
                        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
                        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
                        return num.toLocaleString();
                    };

                    try {
                        const response = await fetch('/api/v1/ai/sql-preview', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                sql, 
                                datasets: window.AgentBI_Context.datasets || [] 
                            }) 
                        });
                        const data = await response.json();
                        
                        if (!response.ok) {
                            throw new Error(data.detail || 'Falha na execução do SQL');
                        }

                        if (data && data.rows && data.rows.length > 0) {
                            const rows = data.rows;
                            const cols = Object.keys(rows[0]);

                            if (type === 'BIGNUMBER') {
                                let val = 0;
                                if (rows.length === 1) {
                                    val = Object.values(rows[0])[0];
                                } else {
                                    val = rows.reduce((acc, row) => {
                                        const v = parseFloat(Object.values(row)[0]);
                                        return acc + (isNaN(v) ? 0 : v);
                                    }, 0);
                                }
                                
                                container.innerText = formatValue(val);
                            } else if (type === 'TABLE') {
                                // Prioriza colunas oficiais do backend para garantir integridade (Zero perda de campos)
                                const actualCols = (data.columns && data.columns.length > 0) ? data.columns : cols;
                                
                                const tableHtml = \`
                                    <div class="overflow-hidden border border-gray-100 rounded-xl bg-white shadow-inner">
                                        <div class="overflow-x-auto custom-scrollbar">
                                            <table class="w-full text-left border-collapse">
                                                <thead>
                                                    <tr class="bg-gray-50 border-b border-gray-100">
                                                        \${actualCols.map(c => \`<th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#D4AF37] shadow-sm">\${c}</th>\`).join('')}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    \${rows.map((row, i) => \`
                                                        <tr class="\${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                            \${actualCols.map(col => \`<td class="px-6 py-4 text-[11px] text-gray-700 font-medium">\${row[col] !== undefined && row[col] !== null ? row[col] : '-'}</td>\`).join('')}
                                                        </tr>
                                                    \`).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                \`;
                                container.innerHTML = tableHtml;
                                container.style.minHeight = 'auto';
                            } else {
                                const chart = echarts.init(container, 'light');
                                let xAxisData = [];
                                let series = [];
                                const pastelColors = ['#B3E5FC', '#C8E6C9', '#FFF9C4', '#FFCCBC', '#D1C4E9', '#F8BBD0', '#CFD8DC'];

                                if (cols.length === 2) {
                                    // Formato Simples: [Label, Valor]
                                    xAxisData = rows.map(r => r[cols[0]]);
                                    series = [{ name: title, data: rows.map(r => r[cols[1]]), type: type.toLowerCase() }];
                                } else if (cols.length >= 3) {
                                    // Detecção inteligente de formato: Pivotado [Series, Dim, Val] vs Wide [Dim, Metric1, Metric2]
                                    const firstRow = rows[0];
                                    const isPivoted = typeof firstRow[cols[0]] === 'string' && 
                                                     (typeof firstRow[cols[1]] === 'string' || firstRow[cols[1]] instanceof Date) &&
                                                     typeof firstRow[cols[2]] === 'number';

                                    if (isPivoted && cols.length === 3) {
                                        // Formato Pivotado ECharts padrão
                                        const devNames = [...new Set(rows.map(r => r[cols[0]]))];
                                        xAxisData = [...new Set(rows.map(r => r[cols[1]]))].sort();
                                        series = devNames.map(name => ({
                                            name: name, type: type.toLowerCase(),
                                            data: xAxisData.map(x => {
                                                const m = rows.find(r => r[cols[0]] === name && r[cols[1]] === x);
                                                return m ? m[cols[2]] : 0;
                                            })
                                        }));
                                    } else {
                                        // Formato Wide: [X-Axis, Métrica 1, Métrica 2, ...]
                                        xAxisData = rows.map(r => r[cols[0]]);
                                        series = cols.slice(1).map(colName => ({
                                            name: colName,
                                            type: type.toLowerCase(),
                                            data: rows.map(r => r[colName])
                                        }));
                                    }
                                }

                                chart.setOption({
                                    backgroundColor: 'transparent', color: pastelColors,
                                    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 0, textStyle: { color: '#000', fontSize: 10 } },
                                    legend: { show: true, bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { color: '#8C8C8C', fontSize: 8 } },
                                    grid: { top: 40, bottom: 60, left: 50, right: 20 },
                                    xAxis: { type: 'category', data: xAxisData, axisLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } }, axisLabel: { color: '#8C8C8C', fontSize: 9 } },
                                    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } }, axisLabel: { color: '#8C8C8C', fontSize: 9 } },
                                    series: series.map(s => ({ ...s, smooth: true, itemStyle: { borderRadius: [4, 4, 0, 0] } }))
                                });
                                // Ajuste de altura para gráficos para garantir que não fiquem achatados
                                container.style.minHeight = '400px';
                            }

                            // Indicador de status removido a pedido do usuário
                        } else {
                            container.innerHTML = \`
                                <div class="kpi-card p-8 flex flex-col items-center justify-center text-center shadow-md h-full">
                                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">No Data Distributed</span>
                                    <span class="text-[8px] text-gray-300 mt-1 whitespace-normal max-w-[150px]">\${title}</span>
                                </div>\`;
                        }
                    } catch (e) {
                        // erro silenciado para producao
                        container.innerHTML = \`
                            <div class="kpi-card p-6 border-red-200 bg-red-50 flex flex-col items-center justify-center text-center shadow-inner h-full overflow-hidden">
                                <svg class="w-8 h-8 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                <span class="text-red-700 text-[10px] uppercase font-black tracking-widest mb-2">Erro de Execução</span>
                                <div class="bg-white/50 p-3 rounded-lg border border-red-100 w-full overflow-auto max-h-[150px]">
                                    <code class="text-red-600 text-[9px] font-mono leading-tight break-words">\${e.message}</code>
                                </div>
                                <span class="text-gray-400 text-[8px] mt-3 italic">Verifique as colunas e a sintaxe do SQL manual.</span>
                            </div>\`;
                    }
                }
            };
          </script>

          <header class="flex flex-col items-center mb-10 pt-4 relative">
            <div class="w-full flex justify-between items-center mb-10 px-2 opacity-60 grayscale hover:grayscale-0 transition-all no-print">
              <img src="/logos/aws.svg" alt="AWS" class="h-8 w-auto object-contain" />
              <img src="/logos/ntt-data.svg" alt="NTT DATA" class="h-8 w-auto object-contain" />
            </div>

            <div class="text-center max-w-4xl mx-auto space-y-3">
              ${isBlueprint ? `<div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#3B82F6] border border-[#2563EB] rounded-full mb-6 animate-fade-in shadow-[0_0_20px_rgba(59,130,246,0.5)]"><span class="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#FFF] animate-pulse"></span><span class="text-[9px] font-black text-white uppercase tracking-[0.2em]">Certified Analytics Blueprint</span></div>` : ''}
              <h1 class="text-4xl md:text-5xl lg:text-6xl font-black tracking-tightest text-gray-900 leading-none">${title}</h1>
              <div class="flex items-center justify-center gap-4 mt-6">
                <span class="h-[1px] w-12 bg-gray-200"></span>
                <p class="text-[10px] text-gray-500 font-medium uppercase tracking-[0.4em]">${generatedAt}</p>
                <span class="h-[1px] w-12 bg-gray-200"></span>
              </div>
            </div>
          </header>

          <div class="w-full h-[2px] bg-gradient-to-r from-black via-[#D4AF37] to-black mb-12 opacity-80 shadow-sm transition-all"></div>

          <div id="dashboard-root" class="max-w-7xl mx-auto space-y-12">
            ${fragment}
          </div>
        </body>
      </html>
    `;
  };

  // Componente de animação isolado e memoizado para evitar re-renderizações que causam "engasgos"
  const GeneratingAnimation = React.memo(({ action, message, timer }: { action: string, message: string, timer: number }) => (
    <div className="flex flex-col items-center justify-center p-20 text-center h-full relative overflow-hidden bg-lux-bg/50">
      {/* Background Glow sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-lux-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="relative flex items-center justify-center mb-12 h-32">
          
          {/* Núcleo Central - Estilo Ingestão (Clockwise) */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Círculo de Base Minimalista */}
            <div className="absolute inset-0 border border-lux-accent/10 rounded-full" />
            
            {/* Spinner principal sentido horário - Alinhado com a Ingestão */}
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="w-20 h-20 border-2 border-transparent border-t-lux-accent border-r-lux-accent/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.1)]"
            >
               <Zap className="w-8 h-8 text-lux-accent drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
            </motion.div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-lux-text uppercase tracking-[0.2em] mb-1">
            {action}
          </h3>
          <p className="text-lux-muted text-xs italic opacity-80 font-medium">
             {message}
          </p>
        </div>

        {/* HUD de Tempo e Progresso - Cores integradas ao padrão LUX */}
        <div className="mt-10 space-y-4">
          <div className="flex justify-between items-end text-[9px] uppercase tracking-widest font-black text-lux-muted/60">
            <span>Runtime: <span className="text-lux-accent font-mono">{timer}s</span></span>
            <span>Sync: <span className="text-lux-accent">{Math.min(Math.round((timer / 25) * 100), 99)}%</span></span>
          </div>
          
          {/* Barra de Progresso com fundo lux-bg/10 (mais elegante que o cinza anterior) */}
          <div className="h-1 w-full bg-lux-text/5 dark:bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min((timer / 25) * 100, 99)}%` }}
               transition={{ duration: 0.5 }}
               className="h-full bg-lux-accent shadow-[0_0_10px_rgba(212,175,55,0.4)]"
             />
          </div>
          
          <div className="flex items-center gap-2 justify-center pt-3">
            <span className="w-1 h-1 rounded-full bg-lux-accent animate-ping" />
            <span className="text-[9px] text-lux-muted font-bold uppercase tracking-[0.25em]">
              Agent-BI Intelligence Engine Active
            </span>
          </div>
        </div>
      </div>
    </div>
  ));
  GeneratingAnimation.displayName = 'GeneratingAnimation';

  const extractWidgetSql = (widgetId: string, content: string | undefined): string => {
    if (!content) return "-- Dashboard não gerado.";
    try {
      const pattern = "AgentBI\\.renderWidget\\s*\\(\\s*['\"]widget-" + widgetId + "['\"]\\s*,\\s*(.*?)\\s*,\\s*['\"]";
      const regex = new RegExp(pattern, 'm');
      const match = content.match(regex);
      if (match && match[1]) {
          try {
              let sql = JSON.parse(match[1]);
              return sql;
          } catch(e) {
              return match[1].replace(/^"|"$/g, '').replace(/\\n/g, '\n').trim();
          }
      }
      return "-- SQL não encontrado para este widget.";
    } catch (err) { return "-- Erro na extração do SQL."; }
  };

  const activeTab = tabs.find((tab) => String(tab.id) === String(activeTabId));
  
  // Sincronização de segurança: Se temos abas mas nenhuma ativa (ou ID órfão), seleciona a primeira
  useEffect(() => {
    if (tabs.length > 0 && !activeTab && !isWorking) {
      setActiveTabId(tabs[tabs.length - 1].id);
    }
  }, [tabs, activeTab, isWorking]);

  const previousHref = projectId ? `/projects/${projectId}/insights` : "/projects";

  return (
    <div className="max-w-full mx-auto w-full h-screen flex flex-col overflow-hidden bg-lux-bg transition-colors duration-500">
      <header className="shrink-0 z-[60] bg-white/80 dark:bg-lux-card/80 backdrop-blur-md border-b border-lux-border/10">
        <div className="px-6 py-3 flex items-center justify-between">
          <ProjectHeaderStandard 
            projectId={projectId || "PRJ-TEMP"} step={5} title="Studio Room" 
            prevHref={previousHref} prevLabel="Insights" isCompact 
          />
          <ProjectPhases projectId={projectId || "PRJ-TEMP"} isCompact />
        </div>
      </header>

      <div className="flex w-full flex-1 min-h-0 overflow-hidden relative border-t border-lux-border/10">
        <div style={{ width: plannerWidth }} className="flex-shrink-0 flex flex-col bg-white/40 dark:bg-black/20 backdrop-blur-xl border-r border-lux-border/20 overflow-hidden">
          <div className="p-6 border-b border-lux-border/10 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-lux-text text-lux-bg flex items-center justify-center shadow-lg"><LayoutDashboard size={18} /></div>
                <h2 className="text-sm font-black uppercase tracking-widest text-lux-text">Planner</h2>
             </div>
             <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 bg-lux-accent/10 border border-lux-accent/30 text-lux-accent px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-sm">
               <Database size={12} /><span>Catalog</span>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-32">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-[10px] uppercase font-black text-lux-text tracking-[0.4em] flex items-center gap-3">
                 <ShieldCheck size={14} className="text-lux-accent" /> Planner Estratégico
               </h2>
               <button 
                  onClick={handleMaterialize} disabled={plannedWidgets.length === 0 || isMaterializing}
                  className="bg-lux-text text-lux-bg px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isMaterializing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} className="text-lux-accent" />}
                  {isMaterializing ? "Gerando..." : "Gerar Relatório"}
               </button>
            </div>
            
              {isPlanning && plannedWidgets.length === 0 && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-lux-bg/50 dark:bg-white/5 border border-lux-border/10 rounded-3xl animate-pulse flex flex-col p-4 gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-lux-text/10" />
                          <div className="w-24 h-3 bg-lux-text/10 rounded-full" />
                        </div>
                        <div className="w-12 h-4 bg-lux-accent/10 rounded-full" />
                      </div>
                      <div className="w-full h-12 bg-lux-text/5 rounded-2xl" />
                    </div>
                  ))}
                  <div className="flex flex-col items-center gap-2 py-4">
                     <Loader2 size={18} className="text-lux-accent animate-spin" />
                     <p className="text-[9px] font-black uppercase tracking-widest text-lux-accent animate-pulse">IA desenhando estratégia...</p>
                  </div>
                </div>
              )}

              <Reorder.Group 
                axis="y" 
                values={plannedWidgets} 
                onReorder={setPlannedWidgets}
                className="space-y-4"
              >
                {plannedWidgets.map((widget) => {
                  const isBigNumber = widget.type === 'BIGNUMBER';
                  const viewMode = widgetViewMode[widget.id] || 'PROMPT';
                  
                  return (
                    <Reorder.Item 
                      key={widget.id} 
                      value={widget}
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="group bg-white dark:bg-[#161618] border border-lux-border/20 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-lux-accent/30 transition-shadow flex flex-col cursor-auto select-none"
                    >
                      <div className={`px-4 py-3 bg-[#fdfdfd] dark:bg-black/20 border-b border-lux-border/10 flex items-center justify-between gap-3`}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                           {/* Alça de Arraste */}
                           <div className="cursor-grab active:cursor-grabbing text-lux-muted/30 hover:text-lux-accent transition-colors shrink-0 -ml-1 pr-1">
                              <GripVertical size={14} />
                           </div>

                           <div className={`p-2 rounded-xl shrink-0 ${isBigNumber ? 'bg-lux-text/10 text-lux-text' : (widget.type === 'TABLE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-lux-accent/20 text-lux-accent')}`}>
                             {isBigNumber ? <Activity size={15} /> : (
                               widget.type === 'TABLE' ? <Table size={15} /> : (
                                 widget.subType === 'PIE' ? <PieChartIcon size={15} /> : (widget.subType === 'LINE' ? <LineChartIcon size={15} /> : <BarChart3 size={15} />)
                               )
                             )}
                           </div>
                           <input 
                              value={widget.title}
                              onChange={(e) => {
                                const next = [...plannedWidgets];
                                const idx = next.findIndex(w => w.id === widget.id);
                                next[idx].title = e.target.value;
                                setPlannedWidgets(next);
                              }}
                              className="bg-transparent border-none text-[11px] font-black uppercase text-lux-text p-0 focus:ring-0 flex-1 min-w-0 truncate"
                              placeholder="Título..."
                           />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           <div className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${isBigNumber ? 'bg-emerald-500 text-white' : (widget.type === 'TABLE' ? 'bg-lux-text text-white' : 'bg-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.5)]')}`}>
                              {isBigNumber ? 'KPI' : (widget.type === 'TABLE' ? 'GRID' : 'Chrt')}
                           </div>
                           <div className="flex items-center gap-0.5 bg-black/5 p-0.5 rounded-xl border border-black/5">
                              <button onClick={() => setWidgetViewMode(prev => ({ ...prev, [widget.id]: 'PROMPT' }))} className={`px-2.5 py-1 rounded-lg text-[8px] font-black transition-all ${viewMode === 'PROMPT' ? 'bg-lux-text text-white shadow-md' : 'text-lux-muted hover:text-lux-text'}`}>PROMPT</button>
                              <button onClick={() => tabs.length > 0 && setWidgetViewMode(prev => ({ ...prev, [widget.id]: 'SQL' }))} disabled={tabs.length === 0} className={`px-2.5 py-1 rounded-lg text-[8px] font-black transition-all ${viewMode === 'SQL' ? 'bg-lux-accent text-black shadow-md' : 'text-lux-muted hover:text-lux-accent disabled:opacity-30'}`}>SQL</button>
                           </div>
                        </div>
                      </div>
                      
                      <div className="p-4 relative min-h-[140px] flex flex-col">
                        
                        {/* Container Simétrico Unificado para Editores (Fix para Diferença de Altura) */}
                        <div className="flex-1 w-full h-[340px] bg-black/5 dark:bg-white/5 border border-lux-border/20 rounded-2xl overflow-hidden shadow-inner flex flex-col relative transition-all p-5">
                          {viewMode === 'PROMPT' ? (
                            <textarea 
                              value={widget.prompt}
                              onChange={(e) => {
                                const next = [...plannedWidgets];
                                const idx = next.findIndex(w => w.id === widget.id);
                                next[idx].prompt = e.target.value;
                                setPlannedWidgets(next);
                              }}
                              className="w-full h-full bg-transparent text-[13px] text-lux-text font-medium leading-relaxed resize-none outline-none focus:bg-lux-accent/[0.02] transition-all overflow-y-auto custom-scrollbar"
                              placeholder="Descreva a regra de negócio..."
                            />
                          ) : (
                            <div className="w-full h-full bg-black relative group/terminal flex flex-col -m-5 p-5">
                              <div className="absolute top-2 right-4 flex gap-1.5 z-10">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                              </div>
                               <textarea 
                                  value={(widget as any).sql !== undefined ? (widget as any).sql : extractWidgetSql(widget.id, activeTab?.content)}
                                  onChange={(e) => {
                                    const next = [...plannedWidgets];
                                    const idx = next.findIndex(w => w.id === widget.id);
                                    (next[idx] as any).sql = e.target.value;
                                    setPlannedWidgets(next);
                                  }}
                                  spellCheck={false}
                                  className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[12px] font-mono text-[#00FF41] custom-scrollbar whitespace-pre-wrap break-words leading-relaxed drop-shadow-[0_0_5px_rgba(0,255,65,0.4)] overflow-y-auto"
                               />
                            </div>
                          )}
                        </div>
                      </div>
                        
                        {/* Unified Widget Toolbar */}
                        <div className="mt-4 pt-4 border-t border-lux-border/5 flex items-center justify-between">
                           {!isBigNumber ? (
                             <div className="flex gap-2">
                                {[
                                  { id: 'BAR', icon: <BarChart3 size={11} />, label: 'Barras' },
                                  { id: 'LINE', icon: <LineChartIcon size={11} />, label: 'Linhas' },
                                  { id: 'PIE', icon: <PieChartIcon size={11} />, label: 'Pizza' },
                                  { id: 'GRID', icon: <Table size={11} />, label: 'Grade' }
                                ].map((tool) => {
                                  const vType = tool.id;
                                  let isActive = false;
                                  if (vType === 'GRID') isActive = widget.type === 'TABLE';
                                  else isActive = widget.type === 'CHART' && widget.subType === vType;

                                  return (
                                    <button 
                                      key={vType} 
                                      title={tool.label}
                                      onClick={() => {
                                        const next = [...plannedWidgets];
                                        const idx = next.findIndex(w => w.id === widget.id);
                                        if (vType === 'GRID') {
                                          next[idx].type = 'TABLE';
                                          if ('subType' in next[idx]) delete (next[idx] as any).subType;
                                        } else {
                                          next[idx].type = 'CHART';
                                          next[idx].subType = vType;
                                        }
                                        setPlannedWidgets(next);
                                      }} 
                                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${isActive ? 'bg-lux-accent text-black border-lux-accent shadow-lg shadow-lux-accent/10' : 'border-lux-border/10 text-lux-muted hover:border-lux-accent/30 hover:bg-lux-accent/5'}`}
                                    >
                                      {tool.icon}
                                    </button>
                                  );
                                })}
                             </div>
                           ) : (
                             <div className="bg-lux-text/5 px-3 py-1.5 rounded-xl border border-lux-border/5 text-[9px] font-black uppercase tracking-widest text-lux-text/60">KPI Metric</div>
                           )}

                           <div className="flex items-center gap-3">
                              <button 
                                onClick={() => removeWidget(widget.id)} 
                                className="p-2.5 text-lux-muted hover:text-red-500 transition-all hover:bg-red-500/10 rounded-xl"
                                title="Remover Widget"
                              >
                                <Trash size={14} />
                              </button>
                           </div>
                        </div>
                      </Reorder.Item>
                  );
                })}
              </Reorder.Group>

            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={() => addWidget('BIGNUMBER')}
                className="flex-1 py-4 border-2 border-dashed border-lux-border/20 rounded-3xl text-lux-muted hover:border-lux-accent transition-all flex flex-col items-center gap-1 group"
              >
                 <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Novo KPI</span>
              </button>
              <button 
                onClick={() => addWidget('CHART')}
                className="flex-1 py-4 border-2 border-dashed border-lux-border/20 rounded-3xl text-lux-muted hover:border-lux-accent transition-all flex flex-col items-center gap-1 group"
              >
                 <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Novo Gráfico</span>
              </button>
            </div>

            <div className="mt-12 pt-12 border-t border-lux-border/10 flex flex-col items-center gap-6">
              <div className="text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lux-muted">Finalização de Blueprint</p>
                 <p className="text-[9px] text-lux-muted/60 italic">Clique para materializar todos os componentes acima em rastro analítico</p>
              </div>
              <button 
                onClick={handleMaterialize}
                disabled={isWorking}
                className="w-full py-4 bg-lux-text text-lux-bg rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-lux-accent hover:scale-[1.02] hover:shadow-2xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Zap size={16} className={isWorking ? 'animate-pulse' : ''} fill="currentColor" /> 
                {isWorking ? 'Processando Inteligência...' : 'Materializar Dashboard'}
              </button>
            </div>
          </div>
        </div>

        <div onMouseDown={startResizing} className={`w-1 cursor-col-resize z-[30] ${isResizing ? 'bg-lux-accent' : 'bg-transparent hover:bg-lux-border/30'}`} />

        <div className="flex-1 min-w-0 bg-[#f8f9fa] dark:bg-[#0c0c0e] flex flex-col relative overflow-hidden">
            <div className="h-14 bg-white/80 dark:bg-lux-card/80 backdrop-blur-xl border-b border-lux-border/10 flex items-center px-6 gap-2 shrink-0 z-40 relative">
              <div className="flex items-center gap-3 pr-4 border-r border-lux-border/10 mr-2 shrink-0">
                <ClockIcon size={14} className="text-lux-accent" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-lux-muted">History</span>
              </div>
              
              {/* Rail de Versões Ativas (Max 5) */}
              <div className="flex items-center gap-1 overflow-visible">
                {tabs.slice(0, 5).map((tab) => (
                  <div key={tab.id} className="relative group/tab">
                    {editingTabId === tab.id ? (
                      <div className="h-9 px-4 bg-lux-accent/10 border border-lux-accent/30 rounded-xl flex items-center gap-2">
                        <input 
                          autoFocus
                          className="bg-transparent border-none outline-none text-[10px] font-bold text-lux-accent w-20"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveTabName(tab.id, editingName); if (e.key === 'Escape') setEditingTabId(null); }}
                          onBlur={() => saveTabName(tab.id, editingName)}
                        />
                        <Check size={12} className="text-lux-accent cursor-pointer" onClick={() => saveTabName(tab.id, editingName)} />
                      </div>
                    ) : (
                      <button 
                        onClick={() => setActiveTabId(tab.id)}
                        onDoubleClick={() => { setEditingTabId(tab.id); setEditingName(tab.name); }}
                        className={`h-9 px-5 flex items-center gap-3 transition-all relative rounded-xl group ${activeTabId === tab.id ? "bg-lux-text text-white shadow-lg scale-[1.02]" : "text-lux-muted hover:bg-lux-border/5"}`}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[80px] ${tab.isBlueprint ? 'text-lux-accent drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : ''}`}>
                          {tab.isBlueprint ? 'BLU' : tab.name.split(' ').pop()}
                        </span>
                        {tab.isBlueprint && <Star size={10} className="text-lux-accent fill-current animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
                        {activeTabId === tab.id && (
                          <motion.div layoutId="tab-glow" className="absolute inset-0 bg-lux-accent/10 rounded-xl -z-10" />
                        )}
                        <button onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }} className="p-1 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-40"><Plus size={10} className="rotate-45" /></button>
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Botão de Histórico / Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${isHistoryOpen ? 'bg-lux-accent text-black' : 'text-lux-muted hover:bg-lux-border/5'}`}
                  >
                    <History size={16} />
                  </button>
                  
                  <AnimatePresence>
                    {isHistoryOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-12 left-0 w-64 bg-white dark:bg-lux-card border border-lux-border/20 shadow-2xl rounded-2xl overflow-hidden z-[100] backdrop-blur-2xl"
                      >
                        <div className="p-3 bg-lux-bg/50 dark:bg-black/20 border-b border-lux-border/10">
                          <span className="text-[8px] font-black uppercase tracking-widest text-lux-muted">Timeline Completa</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                          {tabs.map((tab) => (
                            <button 
                              key={tab.id}
                              onClick={() => { setActiveTabId(tab.id); setIsHistoryOpen(false); }}
                              className={`w-full p-4 flex items-center justify-between hover:bg-lux-accent/5 transition-all border-b border-lux-border/5 text-left group ${activeTabId === tab.id ? 'bg-lux-accent/10' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                {tab.isBlueprint ? <Star size={12} className="text-lux-accent fill-current" /> : <div className="w-1.5 h-1.5 rounded-full bg-lux-muted/30" />}
                                <span className={`text-[10px] font-bold ${activeTabId === tab.id ? 'text-lux-text' : 'text-lux-muted'}`}>{tab.name}</span>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                <Edit2 size={10} className="text-lux-muted hover:text-lux-accent" onClick={(e) => { e.stopPropagation(); setEditingTabId(tab.id); setEditingName(tab.name); setIsHistoryOpen(false); }} />
                                <Plus size={12} className="rotate-45 text-lux-muted hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }} />
                              </div>
                            </button>
                          ))}
                        </div>
                        {tabs.length === 0 && (
                          <div className="p-10 text-center text-lux-muted italic text-[10px]">Nenhum rascunho na linha do tempo</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

           <div className="flex-1 relative flex flex-col p-6 space-y-6 overflow-hidden">
              <div className="flex-1 bg-white dark:bg-lux-card rounded-[2.5rem] shadow-2xl border border-lux-border/5 overflow-hidden flex flex-col relative">
                <div className="h-12 bg-lux-bg/50 dark:bg-black/40 border-b border-lux-border/10 flex items-center px-6 gap-4 shrink-0 transition-all">
                  <div className="flex gap-1.5 shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-sm" /><div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-sm" /><div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-sm" /></div>
                  
                  <div className="flex-1 h-7 bg-white/40 dark:bg-white/5 rounded-xl border border-lux-border/10 flex items-center px-4 justify-between group overflow-hidden">
                     <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity overflow-hidden">
                       <span className="text-[9px] text-lux-muted font-bold tracking-widest uppercase shrink-0">secure.agent-bi.studio /</span> 
                       <span className={`text-[9px] font-black uppercase truncate ${activeTab?.isBlueprint ? 'text-blue-600 drop-shadow-[0_0_10px_rgba(37,99,235,0.6)] animate-pulse' : 'text-lux-accent'}`}>{activeTab?.name || 'pipeline-active'}</span>
                     </div>
                     {activeTab?.isBlueprint ? (
                       <div className="flex items-center gap-2 bg-blue-600 border border-blue-400 px-3 py-1 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                          <Star size={10} className="text-white fill-current animate-pulse" />
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">Certified Blueprint</span>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-lg">
                         <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                         <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Draft Version</span>
                       </div>
                     )}
                  </div>

                  {activeTab && !activeTab.isBlueprint && (
                    <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={handleExportStreamlit}
                          className="h-8 px-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
                        >
                          <Download size={12} /> Export Streamlit (Beta)
                        </button>

                        <button 
                          onClick={() => handlePromote(activeTab.id)}
                          className="h-8 px-4 bg-blue-600 border border-blue-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
                        >
                          <Star size={12} fill="currentColor" /> Elevate to Blueprint
                        </button>
                    </div>
                  )}

                  {activeTab && activeTab.isBlueprint && (
                    <button 
                      onClick={handleExportStreamlit}
                      className="h-8 px-4 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
                    >
                      <Download size={12} /> Export Streamlit Code
                    </button>
                  )}
                </div>
                <div className="flex-1 relative bg-white dark:bg-[#0c0c0e] overflow-hidden">
                   {activeTab?.content && !viewCode ? (
                    <iframe key={`dashboard-${activeTab.id}`} srcDoc={wrapInPremiumShell(activeTab.content, projectDatasets, activeTab.isBlueprint)} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin allow-modals" title="Agente BI Canvas" />
                  ) : activeTab?.content ? (
                    <pre className="p-10 text-[11px] text-[#E0E0E0] bg-[#0c0c0e] h-full overflow-auto font-mono leading-relaxed custom-scrollbar">{activeTab.content}</pre>
                  ) : activeTabId && !activeTab ? (
                    <div className="flex flex-col items-center justify-center h-full text-lux-muted">
                      <p className="text-sm font-bold">Aba {activeTabId} não encontrada</p>
                      <button onClick={() => setActiveTabId(tabs[0]?.id)} className="mt-2 text-[10px] underline">Voltar para início</button>
                    </div>
                  ) : isWorking ? (
                    <GeneratingAnimation action={loadingAction} message={loadingMessage} timer={materializeTimer} />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-lux-muted/50 text-center h-full">
                      <div className="p-10 rounded-[3rem] border border-lux-border/10 bg-lux-bg/5 flex flex-col items-center gap-6">
                        <Layers size={48} strokeWidth={1} className="opacity-20" />
                        <div className="space-y-2">
                           <p className="font-serif italic text-xl text-lux-text">Agent-BI Engine Ready</p>
                           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-lux-accent">Aguardando sua configuração estratégica</p>
                        </div>
                        <button onClick={autoPlan} className="mt-4 px-6 py-3 bg-lux-text text-lux-bg hover:bg-lux-accent transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 group">
                           <Sparkles size={14} className="group-hover:animate-spin" /> Auto-Configuração IA
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-1.5 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-30">
                    <button onClick={() => setShowAuditModal(true)} title="Governance Trail" className="p-3 text-white/60 hover:text-lux-accent transition-colors"><ShieldCheck size={18} /></button>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <button onClick={() => setViewCode(!viewCode)} title="Toggle Code View" className="p-3 text-white/60 hover:text-lux-accent transition-colors">{viewCode ? <EyeIcon size={18} /> : <CodeIcon size={18} />}</button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 right-10 z-[100]">
        <motion.div animate={{ width: isDrawerOpen ? 340 : 56, height: isDrawerOpen ? 500 : 56, borderRadius: isDrawerOpen ? 32 : 28 }} className="bg-white/90 dark:bg-lux-card/90 backdrop-blur-2xl border border-lux-border/40 shadow-2xl overflow-hidden flex flex-col relative">
          <div className="flex items-center justify-between p-3 shrink-0">
             {isDrawerOpen && (
               <div className="flex items-center gap-3 px-3">
                 <div className="w-8 h-8 rounded-full bg-lux-accent/20 flex items-center justify-center"><Database size={16} className="text-lux-accent" /></div>
                 <div className="flex flex-col text-left"><span className="text-[10px] font-black uppercase tracking-widest text-lux-text">Data Assets</span><span className="text-[8px] text-lux-muted font-bold">FIELD CATALOG</span></div>
               </div>
             )}
             <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className={`flex items-center justify-center transition-all ${isDrawerOpen ? 'w-10 h-10 hover:bg-lux-border/10 text-lux-muted' : 'w-10 h-10 bg-lux-text text-lux-bg shadow-lg hover:scale-110'}`}>{isDrawerOpen ? <Plus className="rotate-45" size={24} /> : <Database size={20} />}</button>
          </div>
          <AnimatePresence>
            {isDrawerOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto px-5 pb-8 space-y-6 custom-scrollbar">
                 {projectSources.map((source) => (
                   <div key={source.id} className="space-y-4">
                      <div className="flex items-center justify-between px-2 pt-2"><span className="text-[10px] font-black text-lux-accent uppercase truncate">{source.name}</span><button onClick={() => setSampleData({ tableName: source.name, rows: source.sample.slice(0, 5) })} className="p-1.5 hover:bg-lux-accent/10 rounded-lg text-lux-accent"><EyeIcon size={14} /></button></div>
                      <div className="grid grid-cols-1 gap-2">
                         {source.columns.map((col: string) => (
                           <div key={col} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", col)} className="px-4 py-2 bg-lux-bg/50 dark:bg-white/5 border border-lux-border/10 rounded-2xl text-[10px] font-bold text-lux-text hover:border-lux-accent hover:scale-[1.02] transition-all cursor-grab flex items-center justify-between group shadow-sm text-left">
                              <div className="flex items-center gap-3 overflow-hidden"><div className="w-1.5 h-1.5 rounded-full bg-lux-accent/30 group-hover:bg-lux-accent shrink-0" /><span className="truncate">{col}</span></div>
                              <Plus size={10} className="text-lux-muted/30 group-hover:text-lux-accent" />
                           </div>
                         ))}
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {sampleData && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-4xl bg-white dark:bg-lux-card rounded-[2.5rem] shadow-2xl border border-lux-border/30 overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-6 bg-lux-text text-lux-bg flex items-center justify-between shrink-0"><div className="flex items-center gap-3"><Table size={20} className="text-lux-accent" /><span className="text-xs font-black uppercase tracking-widest">Sample View: {sampleData.tableName}</span></div><button onClick={() => setSampleData(null)} className="p-1 hover:bg-white/10 rounded-full"><Plus size={20} className="rotate-45" /></button></div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead><tr className="border-b border-lux-border/20 sticky top-0 bg-white dark:bg-lux-card z-10">{sampleData.rows.length > 0 && Object.keys(sampleData.rows[0]).map(col => (<th key={col} className="p-4 text-[9px] font-black uppercase tracking-widest text-lux-muted">{col}</th>))}</tr></thead>
                  <tbody>{sampleData.rows.map((row, i) => (<tr key={i} className="border-b border-lux-border/10 hover:bg-lux-accent/5 transition-colors">{Object.values(row).map((val: any, j) => (<td key={j} className="p-4 text-[10px] font-bold text-lux-text tabular-nums">{String(val)}</td>))}</tr>))}</tbody>
               </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
          {showAuditModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 md:p-12">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-5xl h-full max-h-[85vh] bg-lux-bg border border-lux-border/40 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-lux-border/20 flex items-center justify-between shrink-0"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-lux-text text-lux-bg flex items-center justify-center shadow-xl"><ShieldCheck size={28} /></div><div><h2 className="text-2xl font-serif font-bold text-lux-text">Analytics Audit Trail</h2><p className="text-xs text-lux-muted uppercase tracking-widest font-black mt-1">Audit Log • {activeTab?.name}</p></div></div><button onClick={() => setShowAuditModal(false)} className="w-12 h-12 rounded-full border border-lux-border/20 flex items-center justify-center text-lux-muted hover:bg-lux-text hover:text-white transition-all"><Plus className="rotate-45" size={24} /></button></div>
                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                  <section><h3 className="text-sm font-black uppercase tracking-widest text-lux-text mb-6 flex items-center gap-3"><Sparkles size={18} className="text-lux-accent" /> Raciocínio de Dados</h3><div className="p-8 bg-white/40 dark:bg-white/5 border border-lux-border/10 rounded-[2rem] text-sm text-lux-text italic leading-relaxed shadow-inner">{activeTab?.auditTrail?.nl2sql_thought || "Nenhum raciocínio técnico capturado."}</div></section>
                  {activeTab?.auditTrail?.pandas_code && (
                    <section><h3 className="text-sm font-black uppercase tracking-widest text-lux-text mb-6 flex items-center gap-3"><CodeIcon size={18} className="text-lux-accent" /> Algoritmo Python (Pandas Analytics)</h3><div className="relative group"><pre className="p-8 bg-[#1a1c1e] text-emerald-400 rounded-[2rem] overflow-x-auto font-mono text-xs leading-relaxed shadow-2xl border border-lux-border/10">{activeTab?.auditTrail?.pandas_code || "Código não disponível"}</pre></div></section>
                  )}
                  <section><h3 className="text-sm font-black uppercase tracking-widest text-lux-text mb-6 flex items-center gap-3"><Database size={18} className="text-lux-accent" /> Consulta SQL Analytics</h3><pre className="p-8 bg-black text-emerald-400 rounded-3xl font-mono text-xs overflow-x-auto leading-relaxed border border-emerald-500/20 shadow-inner">{activeTab?.auditTrail?.nl2sql_sql || "-- SQL indisponível."}</pre></section>
                </div>
                <div className="p-8 bg-lux-bg/50 border-t border-lux-border/20 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-[10px] text-lux-muted font-bold tracking-widest uppercase"><AlertCircle size={14} /> Trilha auditada e criptografada por NTT DATA Governance</div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        const traceEvent = new CustomEvent('agent-bi-export-trace');
                        window.dispatchEvent(traceEvent);
                      }}
                      className="bg-lux-accent/10 border border-lux-accent/30 text-lux-accent px-6 py-3 rounded-2xl text-xs font-bold shadow-sm hover:bg-lux-accent/20 transition-all flex items-center gap-2"
                    >
                      <Download size={14} /> Exportar Auditoria (JSON)
                    </button>
                    <button onClick={() => setShowAuditModal(false)} className="bg-lux-text text-lux-bg px-10 py-3 rounded-2xl text-xs font-bold shadow-xl hover:scale-105 transition-transform">Fechar Auditoria</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      <DevHUD />
          </div>
        </div>
      </div>
    );
}

export default function EngineRoom() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-lux-bg flex flex-col items-center justify-center p-10">
        <Loader2 className="animate-spin text-lux-text mb-4" size={48} />
        <h2 className="text-2xl font-serif font-bold text-lux-text">Iniciando Gerador BI...</h2>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
