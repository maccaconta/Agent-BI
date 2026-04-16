"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MessageSquareQuote, 
  RefreshCw, 
  Sparkles,
  Info,
  CheckCircle2,
  Cpu,
  BarChart3,
  Zap,
  Activity,
  ArrowLeft,
  Trash2,
  Save,
  DollarSign,
  TrendingDown,
  Users,
  Box,
  Coins,
  ShieldCheck,
  TrendingUp,
  Wallet
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

/**
 * AdminPromptsPage
 * ───────────────
 * Central de Governança de IA. Permite configurar o GlobalSystemPrompt do Tenant.
 * Estética: Ultra-Modern Luxury (Gradients, high-end typography).
 * Atualizado com terminologia corporativa e cores de status nos switches.
 */
export default function AdminPromptsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"MASTER" | "SPECIALISTS" | "COSTS">("MASTER");
  const [costsSummary, setCostsSummary] = useState<any>(null);
  const [costsHistory, setCostsHistory] = useState<any[]>([]);
  const [usersQuotas, setUsersQuotas] = useState<any[]>([]);
  const [simModel, setSimModel] = useState("AMAZON_NOVA_PRO");
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState<any>(null);

  // Ponte direta para o backend no modo Local Fast
  const BACKEND_URL = "";

  const [prompt, setPrompt] = useState({
    id: null as string | null,
    persona_title: "Analista Financeiro Sênior",
    persona_description: "Você é um analista financeiro sênior especializado em identificar relações ocultas em dados e gerar insights estratégicos.",
    compliance_rules: "",
    temperature: 0.3,
    top_p: 0.9,
    top_k: 250,
    max_tokens_limit: 32000,
    ingestion_row_limit: 5000,
    is_active: true
  });

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "X-Tenant-Slug": "default" // Identificação obrigatória para o backend Django
  });

  useEffect(() => {
    fetchGlobalPrompt();
    fetchSpecialists();
    fetchCostsData();
  }, []);

  async function fetchCostsData() {
    try {
      const summaryRes = await fetch(`${BACKEND_URL}/api/v1/governance/costs/summary/`, { headers: getHeaders() });
      if (summaryRes.ok) setCostsSummary(await summaryRes.json());

      const historyRes = await fetch(`${BACKEND_URL}/api/v1/governance/costs/history/`, { headers: getHeaders() });
      if (historyRes.ok) setCostsHistory(await historyRes.json());

      const quotasRes = await fetch(`${BACKEND_URL}/api/v1/governance/costs/users_quotas/`, { headers: getHeaders() });
      if (quotasRes.ok) setUsersQuotas(await quotasRes.json());
    } catch (err) {
      console.error("Erro ao carregar dados de custos:", err);
    }
  }

  const updateQuotaLimit = async (userId: string, limit: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/update_limit/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId, limit })
      });
      if (res.ok) {
        fetchCostsData();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setError("Falha ao atualizar limite");
    }
  };

  async function fetchSpecialists() {
    const timestamp = new Date().getTime();
    const url = `${BACKEND_URL}/api/v1/governance/prompt-templates/?_t=${timestamp}`;
    
    try {
      const res = await fetch(url, {
        headers: getHeaders(),
        cache: 'no-store'
      });
      
      if (res.ok) {
        const data = await res.json();
        // Como desativamos a paginação no backend, 'data' agora deve ser um array direto
        const rawResults = Array.isArray(data) ? data : (data.results || []);
        
        // Filtra por categoria, mas aceita variações ou apenas a presença do texto 'SPECIALIST'
        const filtered = rawResults.filter((s: any) => 
            !s.category || // Se não tiver categoria, mostra (para debug)
            s.category.toUpperCase().includes("SPECIALIST") || 
            s.category.includes("Especialista")
        );
        
        console.log("🔍 Especialistas carregados:", filtered.length);
        setSpecialists(filtered);
        if (filtered.length > 0 && (!selectedSpecialist || !filtered.find((f: any) => f.id === selectedSpecialist.id))) {
            setSelectedSpecialist(filtered[0]);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar especialistas:", err);
    }
  }

  async function fetchGlobalPrompt() {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/system-prompts/`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        // Ajuste Crítico: O backend retorna um array direto quando a paginação está desativada.
        const configList = Array.isArray(data) ? data : (data.results || []);
        
        if (configList.length > 0) {
          const p = configList[0];
          console.log("✅ Governança Master carregada:", p.persona_title);
          
          setPrompt({
            id: p.id,
            persona_title: p.persona_title || "",
            persona_description: p.persona_description || "",
            compliance_rules: p.compliance_rules || "",
            temperature: p.temperature ?? 0.3,
            top_p: p.top_p ?? 0.9,
            top_k: p.top_k ?? 250,
            max_tokens_limit: p.max_tokens_limit ?? 32000,
            ingestion_row_limit: p.ingestion_row_limit ?? 5000,
            is_active: p.is_active ?? true
          });
        }
      }
    } catch (err) {
      console.error("Erro ao carregar governança:", err);
      setError("Não foi possível carregar as políticas globais.");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      if (activeTab === "MASTER") {
          const isUpdate = !!prompt.id;
          const url = isUpdate 
            ? `${BACKEND_URL}/api/v1/governance/system-prompts/${prompt.id}/` 
            : `${BACKEND_URL}/api/v1/governance/system-prompts/`;
          
          const method = isUpdate ? "PATCH" : "POST";

          const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(prompt)
          });

          if (!res.ok) {
            const errDetail = await res.json().catch(() => ({}));
            throw new Error(errDetail.detail || "Erro ao salvar diretrizes.");
          }
      } else if (activeTab === "SPECIALISTS" && selectedSpecialist) {
          const res = await fetch(`${BACKEND_URL}/api/v1/governance/prompt-templates/${selectedSpecialist.id}/`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({
                content: selectedSpecialist.content,
                description: selectedSpecialist.description
            })
          });
          if (!res.ok) throw new Error("Erro ao salvar especialista.");
          fetchSpecialists();
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Falha ao salvar as diretrizes. Verifique sua conexão.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpecialist = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este especialista? Esta ação é irreversível.")) return;
    
    try {
      setSaving(true);
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/prompt-templates/${id}/`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Erro ao excluir especialista.");
      
      setSelectedSpecialist(null);
      fetchSpecialists();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-[#D4AF37]">
       <RefreshCw className="animate-spin" size={32} />
       <p className="text-xs font-bold tracking-widest uppercase animate-pulse">Sincronizando com a Governança...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20 px-4">
      {/* 0. Navegação / Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link 
          href="/projects" 
          className="flex items-center gap-2 text-[#8C8C8C] hover:text-[#D4AF37] transition-all group py-2"
        >
          <div className="p-2 rounded-full bg-white border border-[#F1E9DB] group-hover:border-[#D4AF37] group-hover:shadow-sm transition-all">
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Voltar ao Portfólio de Dados</span>
        </Link>
      </div>

      {/* 1. Título e Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-[#1A1A1A] font-serif">Centro de Governança de IA</h1>
          <p className="text-[#8C8C8C] mt-2 max-w-xl text-sm leading-relaxed tracking-tight border-l-2 border-[#D4AF37] pl-4">
            Defina a persona cognitiva, os especialistas de domínio e as diretrizes de compliance bancário.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-4">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Diretrizes Publicadas com Sucesso
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-500 text-[9px] font-black uppercase px-3 py-1 border border-red-100 rounded-full animate-pulse">{error}</div>
          )}
        </div>
      </div>

      {/* 2. Abas e Ações Principais */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#F1E9DB]">
        <div className="flex gap-2 p-1 bg-[#F9F9F9] border border-[#F1E9DB] rounded-2xl w-fit">
           <button 
              onClick={() => setActiveTab("MASTER")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "MASTER" ? "bg-[#1A1A1A] text-white shadow-lg" : "text-[#8C8C8C] hover:bg-white"}`}>
              Configurações Master
           </button>
           <button 
              onClick={() => setActiveTab("SPECIALISTS")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "SPECIALISTS" ? "bg-[#1A1A1A] text-white shadow-lg" : "text-[#8C8C8C] hover:bg-white"}`}>
              Especialistas
           </button>
           <button 
              onClick={() => setActiveTab("COSTS")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "COSTS" ? "bg-[#1A1A1A] text-white shadow-lg" : "text-[#8C8C8C] hover:bg-white"}`}>
              Gestão de Custos
           </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-[#1A1A1A] text-white rounded-full font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_10px_20px_rgba(212,175,55,0.15)] transition-all disabled:opacity-50 active:scale-95 group shadow-lg"
          >
            {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 space-y-10">
          {activeTab === "MASTER" ? (
            <>
              {/* Persona Master */}
              <section className="bg-white border border-[#F1E9DB] p-10 rounded-[3rem] shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_60px_rgba(212,175,55,0.05)] transition-all duration-700 relative group">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-[#FDF9F0] text-[#D4AF37] rounded-3xl group-hover:rotate-6 transition-transform shadow-sm">
                    <MessageSquareQuote size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Configurações de Identidade Global</h2>
                    <p className="text-[10px] text-[#8C8C8C] font-black tracking-[0.2em] uppercase">Configurações Globais de Persona</p>
                  </div>
                </div>
                
                <div className="space-y-10">
                  <div className="relative group/input">
                    <label className="text-[10px] uppercase tracking-[0.25em] font-black text-[#D4AF37] mb-4 block">Título da Persona Master</label>
                    <input 
                      type="text" 
                      value={prompt.persona_title}
                      onChange={(e) => setPrompt({...prompt, persona_title: e.target.value})}
                      className="w-full p-6 bg-[#F9F9F9] border-2 border-transparent focus:border-[#F1E9DB] focus:bg-white rounded-[1.75rem] text-md font-bold transition-all outline-none shadow-inner"
                      placeholder="Ex: Consultor Estratégico de Negócios"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.25em] font-black text-[#D4AF37] mb-4 block">Essência Cognitiva (Lógica & Comportamento)</label>
                    <textarea 
                      rows={6}
                      value={prompt.persona_description}
                      onChange={(e) => setPrompt({...prompt, persona_description: e.target.value})}
                      className="w-full p-8 bg-[#F9F9F9] border-2 border-transparent focus:border-[#F1E9DB] focus:bg-white rounded-[2rem] text-sm leading-relaxed transition-all outline-none resize-none font-serif text-[#333] shadow-inner"
                      placeholder="Descreva detalhadamente como o Agente de IA deve raciocinar e interagir..."
                    />
                  </div>
                </div>
              </section>

              {/* Data Intelligence & AI Performance */}
              <section className="bg-white border border-[#F1E9DB] p-10 rounded-[3rem] shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Cpu size={120} />
                </div>

                <div className="flex items-center gap-4 mb-12">
                  <div className="p-4 bg-[#1A1A1A] text-[#D4AF37] rounded-3xl shadow-lg">
                    <Activity size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Inteligência de Dados & Performance</h2>
                    <p className="text-[10px] text-[#D4AF37] font-black tracking-[0.2em] uppercase">Motor de Processamento "Nova Amazonas"</p>
                  </div>
                </div>

                <div className="space-y-16">
                  {/* Token Limit Control */}
                  <div className="space-y-8 bg-[#FDF9F0]/30 p-8 rounded-[2.5rem] border border-[#F1E9DB]/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] font-black text-[#1A1A1A] block mb-2 flex items-center gap-2">
                           Limite Mestre de Tokens <Info size={14} className="text-[#D4AF37]" />
                        </label>
                        <p className="text-xs text-[#8C8C8C] leading-relaxed max-w-md italic">
                          Define a profundidade da análise. Valores entre **16k e 32k** são o equilíbrio ideal entre custo e precisão para auditorias de dados.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 bg-white border border-[#F1E9DB] p-4 px-6 rounded-2xl shadow-sm text-[#1A1A1A]">
                        <Zap size={20} className="text-[#D4AF37]" />
                        <span className="text-lg font-mono font-black tracking-tighter">
                          {prompt.max_tokens_limit.toLocaleString()} <span className="text-[#8C8C8C] text-xs">Tokens</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative pt-4">
                      <input 
                        type="range" 
                        min="4000" 
                        max="200000" 
                        step="4000"
                        value={prompt.max_tokens_limit}
                        onChange={(e) => setPrompt({...prompt, max_tokens_limit: parseInt(e.target.value)})}
                        className="w-full h-3 bg-white border border-[#F1E9DB] rounded-full appearance-none cursor-pointer accent-[#D4AF37] hover:scale-[1.01] transition-transform"
                      />
                      <div className="flex justify-between mt-4 text-[9px] text-[#8C8C8C] font-black uppercase tracking-[0.2em]">
                        <span className="opacity-50">Econômico (4k)</span>
                        <span className="text-[#D4AF37] font-black border-b-2 border-[#D4AF37]">Sugestão Ideal (32k)</span>
                        <span className="opacity-50">Contexto Infinito (200k)</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Inference Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F9F9F9] p-8 rounded-[2.5rem] border border-[#F1E9DB]">
                    
                    {/* Temperature Slider */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-[#1A1A1A] flex items-center gap-2">
                           Temperatura (Criatividade) <Info size={12} className="text-[#D4AF37]" />
                        </label>
                        <div className="text-sm font-mono font-black text-[#D4AF37] bg-white border border-[#F1E9DB] p-2 px-4 rounded-xl shadow-sm">
                           {prompt.temperature.toFixed(2)}
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={prompt.temperature}
                        onChange={(e) => setPrompt({...prompt, temperature: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-white border border-[#F1E9DB] rounded-full appearance-none cursor-pointer accent-[#D4AF37]"
                      />
                      <div className="flex justify-between text-[8px] text-[#8C8C8C] font-black uppercase tracking-tight">
                        <span>Preciso (0.0)</span>
                        <span>Equilibrado</span>
                        <span>Criativo (1.0)</span>
                      </div>
                    </div>

                    {/* Top P Slider */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-[#1A1A1A] flex items-center gap-2">
                           Top P (Amostragem) <Info size={12} className="text-[#D4AF37]" />
                        </label>
                        <div className="text-sm font-mono font-black text-[#D4AF37] bg-white border border-[#F1E9DB] p-2 px-4 rounded-xl shadow-sm">
                           {prompt.top_p.toFixed(2)}
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={prompt.top_p}
                        onChange={(e) => setPrompt({...prompt, top_p: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-white border border-[#F1E9DB] rounded-full appearance-none cursor-pointer accent-[#1A1A1A]"
                      />
                      <div className="flex justify-between text-[8px] text-[#8C8C8C] font-black uppercase tracking-tight">
                        <span>Focado</span>
                        <span>Diversificado</span>
                      </div>
                    </div>

                    {/* Top K Control */}
                    <div className="space-y-6 md:col-span-2 pt-4 border-t border-[#F1E9DB]/50">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-[#1A1A1A] flex items-center gap-2">
                           Top K (Diversidade Técnica)
                        </label>
                        <div className="flex items-center gap-2 text-sm font-mono font-black text-[#D4AF37] bg-white border border-[#F1E9DB] p-2 px-4 rounded-xl shadow-sm">
                           <input 
                            type="number" 
                            value={prompt.top_k}
                            onChange={(e) => setPrompt({...prompt, top_k: parseInt(e.target.value)})}
                            className="bg-transparent text-right outline-none w-16"
                           />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              {/* Compliance & Data Guardrails */}
              <section className="bg-white border border-[#F1E9DB] p-10 rounded-[3rem] shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="p-4 bg-[#FDF9F0] text-[#D4AF37] rounded-3xl border border-[#F1E9DB] shadow-sm">
                      <Zap size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Controle de Escala (Ingestão)</h2>
                      <p className="text-[10px] text-[#D4AF37] font-black tracking-[0.25em] uppercase">Limitação de Processamento</p>
                    </div>
                </div>
                
                <div className="space-y-8 bg-[#FDF9F0]/30 p-8 rounded-[2.5rem] border border-[#F1E9DB]/50 mb-8 mt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] font-black text-[#1A1A1A] block mb-2 flex items-center gap-2">
                        Limite de Linhas para Ingestão (Global) <Info size={14} className="text-[#D4AF37]" />
                      </label>
                      <p className="text-xs text-[#8C8C8C] leading-relaxed max-w-md italic">
                        Este parâmetro define o teto de processamento para novos datasets do Tenant.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white border border-[#F1E9DB] p-4 px-6 rounded-2xl shadow-sm text-[#1A1A1A]">
                      <BarChart3 size={20} className="text-[#D4AF37]" />
                      <span className="text-lg font-mono font-black tracking-tighter">
                        {prompt.ingestion_row_limit.toLocaleString()} <span className="text-[#8C8C8C] text-xs">Linhas</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative pt-4">
                    <input 
                      type="range" 
                      min="500" 
                      max="100000" 
                      step="500"
                      value={prompt.ingestion_row_limit}
                      onChange={(e) => setPrompt({...prompt, ingestion_row_limit: parseInt(e.target.value)})}
                      className="w-full h-3 bg-white border border-[#F1E9DB] rounded-full appearance-none cursor-pointer accent-[#1A1A1A] hover:scale-[1.01] transition-transform"
                    />
                    <div className="flex justify-between mt-4 text-[9px] text-[#8C8C8C] font-black uppercase tracking-[0.2em]">
                      <span className="opacity-50">Experimental (500)</span>
                      <span className="text-[#D4AF37] font-black border-b-2 border-[#D4AF37]">Batch Corporativo (5k)</span>
                      <span className="opacity-50">Big Data (100k)</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#F1E9DB] pt-8">
                  <label className="text-[10px] uppercase tracking-[0.25em] font-black text-[#D4AF37] mb-4 block">Diretrizes de Compliance</label>
                  <textarea 
                    rows={5}
                    value={prompt.compliance_rules}
                    onChange={(e) => setPrompt({...prompt, compliance_rules: e.target.value})}
                    className="w-full p-8 bg-[#F9F9F9] border-2 border-transparent rounded-[2rem] text-sm leading-relaxed font-serif focus:border-[#F1E9DB] focus:bg-white outline-none text-[#1A1A1A] placeholder:text-[#8C8C8C]/40 resize-none transition-all shadow-inner relative z-10"
                    placeholder="Ex: 1. Proteger PII (Nomes, CPFs)...\n2. Manter tom de voz institucional...\n3. Não alucinar datas futuras..."
                  />
                </div>
              </section>
            </>
          ) : activeTab === "COSTS" ? (
             <div className="lg:col-span-12 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Dashboard de KPIs Financeiros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="bg-white border border-[#F1E9DB] p-6 rounded-[2rem] shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#FDF9F0] text-[#D4AF37] rounded-xl"><DollarSign size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C8C]">Gasto Total (Mês)</span>
                      </div>
                      <div className="text-3xl font-serif font-black text-[#1A1A1A]">$ {costsHistory.reduce((acc, curr) => acc + curr.cost_usd, 0).toFixed(2)}</div>
                      <div className="text-[9px] font-bold text-emerald-500 mt-2 flex items-center gap-1"><TrendingUp size={10} /> +2.4% vs anterior</div>
                   </div>
                   <div className="bg-white border border-[#F1E9DB] p-6 rounded-[2rem] shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#F9F9F9] text-[#1A1A1A] rounded-xl"><Zap size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C8C]">Tokens Processados</span>
                      </div>
                      <div className="text-3xl font-serif font-black text-[#1A1A1A]">{(costsHistory.reduce((acc, curr) => acc + curr.tokens, 0) / 1000).toFixed(1)}k</div>
                      <div className="text-[9px] font-bold text-[#8C8C8C] mt-2 italic">Acumulado em {costsHistory.length} dias</div>
                   </div>
                   <div className="bg-white border border-[#F1E9DB] p-6 rounded-[2rem] shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C8C]">Status de Compliance</span>
                      </div>
                      <div className="text-xl font-black text-emerald-600 uppercase tracking-tighter">SOB CONTROLE</div>
                      <div className="text-[9px] font-bold text-[#8C8C8C] mt-2">Zero bloqueios por quota hoje</div>
                   </div>
                   <div className="bg-white border border-[#F1E9DB] p-6 rounded-[2rem] shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#1A1A1A] text-[#D4AF37] rounded-xl"><RefreshCw size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C8C]">Eficiência (USD/1k)</span>
                      </div>
                      <div className="text-3xl font-serif font-black text-[#1A1A1A]">$ 0.042</div>
                      <div className="text-[9px] font-bold text-[#D4AF37] mt-2 italic">Amazon Nova Pro</div>
                   </div>
                </div>

                {/* Gráficos de Governança */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="bg-white border border-[#F1E9DB] p-8 rounded-[3rem] shadow-sm h-[450px]">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-lg font-black text-[#1A1A1A]">Evolução de Consumo</h3>
                          <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-[0.1em]">Gastos diários em USD</p>
                        </div>
                        <div className="px-4 py-1.5 bg-[#F9F9F9] border border-[#F1E9DB] rounded-full text-[9px] font-black uppercase text-[#8C8C8C]">Últimos 30 Dias</div>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={costsHistory}>
                            <defs>
                              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1E9DB" opacity={0.5} />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 9, fontWeight: 700, fill: '#8C8C8C'}} 
                              dy={10}
                            />
                            <YAxis 
                              hide 
                            />
                            <Tooltip 
                              contentStyle={{backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff'}}
                              itemStyle={{color: '#D4AF37', fontWeight: 900, fontSize: '12px'}}
                              labelStyle={{color: '#8C8C8C', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px'}}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="cost_usd" 
                              stroke="#D4AF37" 
                              strokeWidth={3} 
                              fillOpacity={1} 
                              fill="url(#colorCost)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="bg-white border border-[#F1E9DB] p-8 rounded-[3rem] shadow-sm h-[450px]">
                      <h3 className="text-lg font-black text-[#1A1A1A] mb-2">Custos por Domínio</h3>
                      <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-[0.1em] mb-8">Consumo acumulado por projeto</p>
                      
                      <div className="space-y-6 overflow-y-auto max-h-[300px] custom-scrollbar pr-4">
                        {(costsSummary?.by_project || []).map((proj: any, idx: number) => (
                           <div key={proj.project_id} className="flex flex-col gap-2 group">
                              <div className="flex items-center justify-between font-black text-[11px] uppercase tracking-tighter">
                                 <span className="text-[#1A1A1A]">{proj.name}</span>
                                 <span className="text-[#D4AF37]">$ {proj.total_cost_usd.toFixed(2)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#F9F9F9] rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-[#1A1A1A] rounded-full transition-all duration-1000 group-hover:bg-[#D4AF37]" 
                                    style={{ width: `${Math.min((proj.total_cost_usd / (costsHistory.reduce((acc, curr) => acc + curr.cost_usd, 0) || 1) * 100), 100)}%` }}
                                 />
                              </div>
                           </div>
                        ))}
                        {(!costsSummary?.by_project || costsSummary.by_project.length === 0) && (
                          <div className="h-full flex items-center justify-center text-[#8C8C8C] text-[10px] font-bold uppercase tracking-widest italic opacity-50">
                            Nenhum domínio com consumo registrado
                          </div>
                        )}
                      </div>
                   </div>
                </div>

                {/* Gestão de Quotas por Usuário */}
                <section className="bg-white border border-[#F1E9DB] p-10 rounded-[3.5rem] shadow-sm">
                   <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-[#F9F9F9] text-[#1A1A1A] rounded-3xl"><Users size={24} /></div>
                        <div>
                          <h2 className="text-2xl font-black tracking-tight">Governança de Quotas</h2>
                          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Controle Individual de Consumo</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-[#F9F9F9] border border-[#F1E9DB] rounded-full text-[10px] font-black uppercase tracking-widest text-[#8C8C8C] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-all">
                        <RefreshCw size={12} /> Sincronizar Quotas
                      </button>
                   </div>

                   <div className="overflow-hidden border border-[#F1E9DB] rounded-[2rem]">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F9F9F9]">
                          <tr className="border-b border-[#F1E9DB]">
                            <th className="px-8 py-5 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Colaborador</th>
                            <th className="px-8 py-5 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Consumo Real (USD)</th>
                            <th className="px-8 py-5 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Barra de Limite</th>
                            <th className="px-8 py-5 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest text-right">Configurar Teto (Tokens)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersQuotas.map((q) => (
                            <tr key={q.user_id} className="border-b border-[#F1E9DB] hover:bg-[#FDF9F0]/30 transition-colors">
                              <td className="px-8 py-6">
                                <div className="font-black text-sm text-[#1A1A1A]">{q.email}</div>
                                <div className="text-[10px] text-[#8C8C8C] font-bold mt-1">UUID: {q.user_id.slice(0, 8)}...</div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="font-serif font-black text-lg text-[#1A1A1A]">$ {q.cost_usd.toFixed(2)}</div>
                                <div className="text-[10px] text-emerald-500 font-black uppercase">Eficiência OK</div>
                              </td>
                              <td className="px-8 py-6 w-[300px]">
                                <div className="flex items-center justify-between text-[9px] font-black uppercase mb-1.5">
                                   <span className={q.percent_used > 90 ? "text-red-500" : "text-[#8C8C8C]"}>{q.consumed_tokens.toLocaleString()} / {q.max_limit.toLocaleString()}</span>
                                   <span className={q.percent_used > 90 ? "text-red-500 animate-pulse" : "text-[#1A1A1A]"}>{q.percent_used}%</span>
                                </div>
                                <div className="w-full h-2 bg-[#F9F9F9] rounded-full overflow-hidden border border-[#F1E9DB]/30 shadow-inner">
                                   <div 
                                      className={`h-full rounded-full transition-all duration-700 ${q.percent_used > 90 ? "bg-red-500" : q.percent_used > 70 ? "bg-amber-400" : "bg-emerald-400"}`}
                                      style={{ width: `${Math.min(q.percent_used, 100)}%` }}
                                   />
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-3">
                                   <input 
                                      type="number" 
                                      defaultValue={q.max_limit}
                                      onBlur={(e) => updateQuotaLimit(q.user_id, parseInt(e.target.value))}
                                      className="w-32 bg-[#F9F9F9] border-2 border-transparent focus:border-[#D4AF37] focus:bg-white p-2.5 rounded-xl text-xs font-black text-center outline-none transition-all shadow-sm"
                                   />
                                   <div className="p-2 bg-[#1A1A1A] text-white rounded-lg opacity-20 hover:opacity-100 cursor-pointer transition-opacity">
                                      <Save size={14} />
                                   </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </section>

                {/* Simulador de Custos Multimodelo (What-if Analysis) */}
                <section className="bg-[#1A1A1A] text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute -bottom-20 -right-20 p-20 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp size={300} strokeWidth={1} />
                   </div>
                   
                   <div className="flex flex-col lg:flex-row gap-16 relative z-10">
                      <div className="lg:w-1/3">
                        <div className="p-4 bg-white/10 w-fit rounded-3xl mb-8"><Coins size={32} className="text-[#D4AF37]" /></div>
                        <h2 className="text-4xl font-serif font-black tracking-tight mb-4">Simulador de<br/><span className="text-[#D4AF37]">Multimodelo</span></h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                          Descubra quanto seu consumo atual custaria se os dashboards fossem materializados em outros provedores da LLM.
                        </p>
                        
                        <div className="space-y-4">
                           <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Carga de Trabalho Base</div>
                           <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                              <div className="flex items-center justify-between mb-2">
                                 <span className="text-xs text-gray-400">Tokens Acumulados</span>
                                 <span className="text-lg font-black">{costsHistory.reduce((acc, curr) => acc + curr.tokens, 0).toLocaleString()}</span>
                              </div>
                              <div className="w-full h-1 bg-white/10 rounded-full" />
                           </div>
                        </div>
                      </div>

                      <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { id: "AMAZON_NOVA_PRO", name: "Amazon Nova Pro", in: 0.8, out: 3.2, recommended: true },
                          { id: "CLAUDE_3_5", name: "Claude 3.5 Sonnet", in: 3.0, out: 15.0 },
                          { id: "LLAMA_3_3", name: "Meta Llama 3.3 (70B)", in: 0.72, out: 0.72 },
                          { id: "CLAUDE_3_HAIKU", name: "Claude 3 Haiku", in: 0.25, out: 1.25 }
                        ].map((m) => {
                          const totalTokens = costsHistory.reduce((acc, curr) => acc + curr.tokens, 0);
                          // Estimativa: 70% input, 30% output
                          const estIn = totalTokens * 0.7;
                          const estOut = totalTokens * 0.3;
                          const estCost = (estIn / 1000000 * m.in) + (estOut / 1000000 * m.out);
                          
                          return (
                            <div key={m.id} className={`p-8 rounded-[2.5rem] border-2 transition-all hover:scale-[1.02] ${m.recommended ? "bg-[#D4AF37] border-white/20 text-[#1A1A1A]" : "bg-white/5 border-white/5 hover:border-white/20"}`}>
                               <div className="flex items-center justify-between mb-8">
                                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${m.recommended ? "bg-[#1A1A1A] text-white" : "bg-white/10 text-white"}`}>
                                     {m.recommended ? "Custo-Benefício" : "Alternativa"}
                                  </div>
                                  <BarChart3 size={20} />
                               </div>
                               <h4 className="text-lg font-black tracking-tight mb-2">{m.name}</h4>
                               <div className="text-3xl font-serif font-black mb-8">$ {estCost.toFixed(2)}<span className="text-xs opacity-50 ml-1">/mês estim.</span></div>
                               
                               <div className={`text-[9px] font-black uppercase tracking-widest ${m.recommended ? "text-[#1A1A1A]/70" : "text-gray-500"} mb-2`}>Taxa Sugerida (1M Tokens)</div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className={`p-3 rounded-xl ${m.recommended ? "bg-[#1A1A1A]/10" : "bg-white/5"}`}>
                                     <div className="text-[14px] font-black">$ {m.in}</div>
                                     <div className="text-[7px] font-black uppercase opacity-60">Input</div>
                                  </div>
                                  <div className={`p-3 rounded-xl ${m.recommended ? "bg-[#1A1A1A]/10" : "bg-white/5"}`}>
                                     <div className="text-[14px] font-black">$ {m.out}</div>
                                     <div className="text-[7px] font-black uppercase opacity-60">Output</div>
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </section>
             </div>
          ) : (
             <div className="lg:col-span-12">
                {!selectedSpecialist ? (
                   <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center justify-between mb-10 border-b border-[#F1E9DB] pb-6">
                        <div>
                          <h3 className="text-2xl font-serif font-black text-[#1A1A1A] tracking-tight">Especialistas</h3>
                          <p className="text-[10px] text-[#8C8C8C] font-black tracking-[0.2em] uppercase mt-1">Biblioteca de Capacidades Disponíveis</p>
                        </div>
                        <span className="px-5 py-2 bg-[#FDF9F0] text-[#D4AF37] text-[10px] font-black rounded-full border border-[#F1E9DB] shadow-sm">
                           {specialists.length} TOTAL
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {specialists.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSpecialist(s)}
                            className="bg-white border border-[#F1E9DB] p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:bg-[#FDF9F0]/30 hover:border-[#D4AF37]/50 hover:shadow-xl hover:-translate-y-1 transition-all"
                          >
                            <div className="p-5 bg-[#F9F9F9] text-[#8C8C8C] rounded-[1.75rem] mb-6 group-hover:bg-[#1A1A1A] group-hover:text-[#D4AF37] transition-all shadow-sm">
                               <Cpu size={32} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-tight text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">{s.name}</h4>
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#8C8C8C] mt-2 opacity-60 group-hover:opacity-100">{s.category}</p>
                            <div className="mt-6 w-full h-[1px] bg-[#F1E9DB] opacity-40" />
                            <div className="mt-4 text-[10px] font-bold text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                               Editar Parâmetros →
                            </div>
                          </button>
                        ))}
                      </div>
                   </section>
                ) : (
                    <section className="bg-white border border-[#F1E9DB] p-8 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.03)] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden h-fit">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                         <Sparkles size={180} />
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 relative z-10 border-b border-[#F1E9DB] pb-8">
                        <button 
                          onClick={() => setSelectedSpecialist(null)}
                          className="p-3 bg-[#F9F9F9] text-[#8C8C8C] hover:bg-[#1A1A1A] hover:text-white rounded-2xl transition-all shadow-sm group/back"
                        >
                          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </button>

                        <div className="p-4 bg-[#1A1A1A] text-[#D4AF37] rounded-3xl shadow-lg ring-4 ring-[#D4AF37]/10 flex-shrink-0">
                          <Sparkles size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-black tracking-tighter text-[#1A1A1A] uppercase truncate">{selectedSpecialist.name}</h2>
                          <div className="group/field mt-2 relative">
                            <input 
                              type="text" 
                              value={selectedSpecialist.description}
                              onChange={(e) => setSelectedSpecialist({...selectedSpecialist, description: e.target.value})}
                              className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-[#8C8C8C] uppercase tracking-widest outline-none focus:text-[#1A1A1A] transition-colors"
                              placeholder="Defina o propósito deste especialista..."
                            />
                            <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D4AF37] transition-all group-focus-within/field:w-20" />
                          </div>
                        </div>

                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleDeleteSpecialist(selectedSpecialist.id)}
                             disabled={saving}
                             className="p-4 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm disabled:opacity-50"
                           >
                             <Trash2 size={18} />
                           </button>
                        </div>
                      </div>

                      <div className="relative z-10">
                        <label className="text-[10px] uppercase tracking-[0.25em] font-black text-[#D4AF37] mb-3 block flex items-center gap-2">
                           <Cpu size={12} /> Lógica de Raciocínio (Prompt Context)
                        </label>
                        <textarea 
                          rows={14}
                          value={selectedSpecialist.content}
                          onChange={(e) => setSelectedSpecialist({...selectedSpecialist, content: e.target.value})}
                          className="w-full p-6 bg-[#F9F9F9] border-2 border-transparent focus:border-[#F1E9DB] focus:bg-white rounded-[2rem] text-[13px] leading-relaxed font-serif text-[#333] shadow-inner outline-none transition-all resize-none custom-scrollbar"
                          placeholder="Descreva as regras que este especialista deve seguir..."
                        />
                      </div>
                    </section>
                )}
                </div>
          )}
        </div>

      </div>
    </div>
  );
}
