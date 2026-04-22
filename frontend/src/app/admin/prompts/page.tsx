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
  Wallet,
  Database,
  UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
  const [activeTab, setActiveTab] = useState("MASTER");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState<any | null>(null);
  const [systemPrompts, setSystemPrompts] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [costsSummary, setCostsSummary] = useState<any>(null);
  const [costsHistory, setCostsHistory] = useState<any[]>([]);
  const [usersQuotas, setUsersQuotas] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [subdomains, setSubdomains] = useState<any[]>([]);
  const [cleaning, setCleaning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);
  const [showAddSubdomainModal, setShowAddSubdomainModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", role: "VIEWER" });
  const [newDomainName, setNewDomainName] = useState("");
  const router = useRouter();
  const { user, getRole } = useAuth();

  const currentRole = getRole();
  const isAdmin = user?.is_super_admin || currentRole === "ADMIN" || currentRole === "OWNER";
  const isCriador = currentRole === "ANALYST";
  const canEdit = isAdmin;

  // Redirecionamento de segurança para Visualizadores
  useEffect(() => {
    if (user && !isAdmin && !isCriador) {
        router.push("/projects");
    }
  }, [user, isAdmin, isCriador, router]);

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
    session_timeout_minutes: 15,
    is_active: true
  });

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "X-Tenant-Slug": "default" // Identificação obrigatória para o backend Django
  });

  useEffect(() => {
    fetchGlobalPrompt();
    fetchSpecialists();
    fetchSystemPrompts();
    fetchCostsData();
    fetchUsersQuotas();
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/projects/domains/?t=${Date.now()}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDomains(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) {
      console.error("Erro ao carregar domínios:", err);
    }
  }

  async function fetchSubdomains(domainId: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/projects/subdomains/?domain=${domainId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSubdomains(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) {
      console.error("Erro ao carregar subdomínios:", err);
    }
  }

  async function fetchCostsData() {
    try {
      const summaryRes = await fetch(`${BACKEND_URL}/api/v1/governance/costs/summary/`, { headers: getHeaders() });
      if (summaryRes.ok) setCostsSummary(await summaryRes.json());

      const historyRes = await fetch(`${BACKEND_URL}/api/v1/governance/costs/history/`, { headers: getHeaders() });
      if (historyRes.ok) setCostsHistory(await historyRes.json());
    } catch (err) {
      console.error("Erro ao carregar dados de custos:", err);
    }
  }

  async function fetchUsersQuotas() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/users_quotas/`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsersQuotas(data);
      }
    } catch (err) {
      console.error("Erro ao carregar quotas de usuários:", err);
    }
  }

  const handleAddDomain = async () => {
    if (!newDomainName) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/projects/domains/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name: newDomainName })
      });
      if (res.ok) {
        setNewDomainName("");
        setShowAddDomainModal(false);
        fetchDomains();
      }
    } catch (err) {
      console.error("Erro ao adicionar domínio:", err);
    }
  };

  const handleAddSubdomain = async () => {
    if (!newDomainName || !subdomains[0]?.domain) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/projects/subdomains/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ domain: subdomains[0].domain, name: newDomainName })
      });
      if (res.ok) {
        setNewDomainName("");
        setShowAddSubdomainModal(false);
        fetchSubdomains(subdomains[0].domain);
      }
    } catch (err) {
      console.error("Erro ao adicionar subdomínio:", err);
    }
  };

  const updateQuotaLimit = async (userId: string, limit: number, loginLimit?: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/update_limit/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId, limit, login_limit: loginLimit })
      });
      if (res.ok) {
        fetchCostsData();
        fetchUsersQuotas();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setError("Falha ao atualizar limites");
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/update_user_role/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId, role })
      });
      if (res.ok) {
        fetchCostsData();
        fetchUsersQuotas();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setError("Falha ao atualizar papel do usuário");
    }
  };

  const handleCreateUser = async (email: string, role: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/invite_user/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email, role })
      });
      if (res.ok) {
        fetchCostsData();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao convidar usuário");
      }
    } catch (err) {
      setError("Falha na rede ao convidar usuário");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Deseja revogar o acesso de ${email}?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/delete_user/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        fetchCostsData();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setError("Falha ao remover usuário");
    }
  };

  async function fetchSpecialists() {
    const timestamp = new Date().getTime();
    const url = `${BACKEND_URL}/api/v1/governance/prompt-templates/?_t=${timestamp}`;
    
    try {
      const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const rawResults = Array.isArray(data) ? data : (data.results || []);
        const filtered = rawResults.filter((s: any) => 
            !s.category || 
            s.category.toUpperCase().includes("SPECIALIST") || 
            s.category.toUpperCase().includes("ESPECIALISTA") ||
            s.category.toUpperCase().includes("PERSONA") ||
            s.category.toUpperCase().includes("COGNITIVA")
        );
        setSpecialists(filtered);
      }
    } catch (err: any) {
      console.error("Erro ao carregar especialistas:", err);
    }
  }

  async function fetchSystemPrompts() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/system-prompts/`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        setSystemPrompts(list);
        if (list.length > 0 && !selectedAgent) {
          setSelectedAgent(list[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar prompts de sistema:", err);
    }
  }

  async function fetchGlobalPrompt() {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/global-config/`, {
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
            session_timeout_minutes: p.session_timeout_minutes ?? 15,
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
            ? `${BACKEND_URL}/api/v1/governance/global-config/${prompt.id}/` 
            : `${BACKEND_URL}/api/v1/governance/global-config/`;
          
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
      } else if (activeTab === "SYSTEM_PROMPTS" && selectedAgent) {
          const res = await fetch(`${BACKEND_URL}/api/v1/governance/system-prompts/${selectedAgent.id}/`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({
              content: selectedAgent.content,
              description: selectedAgent.description,
              version: selectedAgent.version
            })
          });
          if (!res.ok) throw new Error("Erro ao salvar prompt do agente.");
          fetchSystemPrompts();
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

  const handlePurgeCache = async () => {
    if (!window.confirm("ATENÇÃO: Este procedimento de HIGIENE DE DADOS irá deletar todos os datasets ingeridos e logs de execução. Usuários, Prompts e Projetos estão SEGUROS. Deseja prosseguir com a faxina profunda?")) return;
    
    setCleaning(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/purge_analytical_cache/`, {
        method: "POST",
        headers: getHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Sucesso! ${data.message}\nDetalhes: ${JSON.stringify(data.details)}`);
        fetchCostsData();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("Erro ao realizar limpeza.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCleaning(false);
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
              {canEdit 
                ? "Defina a persona cognitiva, os especialistas de domínio e as diretrizes de compliance bancário." 
                : "Visualização das diretrizes e políticas de governança ativas (Modo de Leitura)."}
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
              Governança
           </button>
           <button 
              onClick={() => setActiveTab("SPECIALISTS")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "SPECIALISTS" ? "bg-[#1A1A1A] text-white shadow-lg" : "text-[#8C8C8C] hover:bg-white"}`}>
              Especialistas
           </button>
           <button 
              onClick={() => setActiveTab("SYSTEM_PROMPTS")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "SYSTEM_PROMPTS" ? "bg-[#1A1A1A] text-white shadow-lg" : "text-[#8C8C8C] hover:bg-white"}`}>
              Prompts do Sistema
           </button>
           <button 
              onClick={() => setActiveTab("COSTS")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "COSTS" ? "bg-[#1A1A1A] text-white shadow-lg" : "text-[#8C8C8C] hover:bg-white"}`}>
              Gestão de Custos
           </button>
           {isAdmin && (
             <button 
                onClick={() => setActiveTab("DOMAINS")}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "DOMAINS" ? "bg-[#1A1A1A] text-white shadow-lg" : "text-[#8C8C8C] hover:bg-white"}`}>
                Áreas e Domínios
             </button>
           )}
           {isAdmin && (
             <button 
                onClick={() => setActiveTab("USERS")}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "USERS" ? "bg-[#1A1A1A] text-white shadow-lg" : "text-[#8C8C8C] hover:bg-white"} flex items-center gap-2`}>
                <Users size={12} /> Gestão de Usuários
             </button>
           )}
        </div>

        {canEdit && (
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
        )}
        {!canEdit && (
          <div className="flex items-center gap-2 text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.2em] bg-[#FDF9F0] px-6 py-3 rounded-full border border-[#D4AF37]/20 shadow-sm">
             <ShieldCheck size={14} /> Somente Leitura
          </div>
        )}
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
                      readOnly={!canEdit}
                      onChange={(e) => setPrompt({...prompt, persona_title: e.target.value})}
                      className={`w-full p-6 bg-[#F9F9F9] border-2 border-transparent focus:border-[#F1E9DB] focus:bg-white rounded-[1.75rem] text-md font-bold transition-all outline-none shadow-inner ${!canEdit ? 'opacity-80 cursor-not-allowed' : ''}`}
                      placeholder="Ex: Consultor Estratégico de Negócios"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.25em] font-black text-[#D4AF37] mb-4 block">Essência Cognitiva (Lógica & Comportamento)</label>
                    <textarea 
                      rows={6}
                      value={prompt.persona_description}
                      readOnly={!canEdit}
                      onChange={(e) => setPrompt({...prompt, persona_description: e.target.value})}
                      className={`w-full p-8 bg-[#F9F9F9] border-2 border-transparent focus:border-[#F1E9DB] focus:bg-white rounded-[2rem] text-sm leading-relaxed transition-all outline-none resize-none font-serif text-[#333] shadow-inner ${!canEdit ? 'opacity-80 cursor-not-allowed' : ''}`}
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
                    </div>

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
                  </div>
                </div>

                <div className="space-y-8 bg-[#FDF9F0]/30 p-8 rounded-[2.5rem] border border-[#F1E9DB]/50 mb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] font-black text-[#1A1A1A] block mb-2 flex items-center gap-2">
                        Timeout de Inatividade (Sessão) <Info size={14} className="text-[#D4AF37]" />
                      </label>
                      <p className="text-xs text-[#8C8C8C] leading-relaxed max-w-md italic">
                        Redireciona para a tela de apresentação após o tempo selecionado sem interações.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white border border-[#F1E9DB] p-4 px-6 rounded-2xl shadow-sm text-[#1A1A1A]">
                      <ShieldCheck size={20} className="text-[#D4AF37]" />
                      <span className="text-lg font-mono font-black tracking-tighter">
                        {prompt.session_timeout_minutes} <span className="text-[#8C8C8C] text-xs">Minutos</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative pt-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="120" 
                      step="1"
                      value={prompt.session_timeout_minutes}
                      onChange={(e) => setPrompt({...prompt, session_timeout_minutes: parseInt(e.target.value)})}
                      className="w-full h-3 bg-white border border-[#F1E9DB] rounded-full appearance-none cursor-pointer accent-[#D4AF37] hover:scale-[1.01] transition-transform"
                    />
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
          ) : activeTab === "DOMAINS" ? (
            <section className="bg-white border border-[#F1E9DB] p-10 rounded-[3.5rem] shadow-sm animate-in fade-in slide-in-from-right-4">
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-[#FDF9F0] text-[#D4AF37] rounded-3xl"><Database size={24} /></div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Domínios de Dados</h2>
                      <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Governança de Propriedade e Áreas de Negócio</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        setNewDomainName("");
                        setShowAddDomainModal(true);
                    }}
                    className="px-8 py-3 bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#333] transition-all shadow-xl"
                  >
                    + Novo Domínio Master
                  </button>
               </div>

               {/* Modal de Novo Domínio */}
               {showAddDomainModal && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                   <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-[#F1E9DB] animate-in zoom-in-95 duration-300">
                     <h3 className="text-xl font-black text-[#1A1A1A] mb-2">Novo Domínio Data Mesh</h3>
                     <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest mb-8">Defina um novo agrupamento corporativo</p>
                     
                     <input 
                       type="text" 
                       placeholder="Ex: Comercial, Operações..."
                       value={newDomainName}
                       onChange={(e) => setNewDomainName(e.target.value)}
                       className="w-full bg-[#F9F9F9] border-2 border-[#F1E9DB] p-4 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37] mb-6 transition-all"
                       autoFocus
                     />

                     <div className="flex items-center gap-3">
                       <button 
                         onClick={() => setShowAddDomainModal(false)}
                         className="flex-1 py-4 bg-[#F9F9F9] text-[#8C8C8C] font-black text-[10px] uppercase rounded-2xl hover:bg-gray-100 transition-all"
                       >
                         Cancelar
                       </button>
                       <button 
                         onClick={handleAddDomain}
                         className="flex-1 py-4 bg-[#D4AF37] text-white font-black text-[10px] uppercase rounded-2xl hover:scale-105 transition-all shadow-lg"
                       >
                         Confirmar
                       </button>
                     </div>
                   </div>
                 </div>
               )}

               {/* Modal de Subdomínio */}
               {showAddSubdomainModal && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                   <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-[#F1E9DB] animate-in zoom-in-95 duration-300">
                     <h3 className="text-xl font-black text-[#1A1A1A] mb-2">Nova Área de Negócio</h3>
                     <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest mb-8">Subdomínio sob {domains.find(d => d.id === subdomains[0]?.domain)?.name}</p>
                     
                     <input 
                       type="text" 
                       placeholder="Ex: Logística, Vendas Diretas..."
                       value={newDomainName}
                       onChange={(e) => setNewDomainName(e.target.value)}
                       className="w-full bg-[#F9F9F9] border-2 border-[#F1E9DB] p-4 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37] mb-6 transition-all"
                       autoFocus
                     />

                     <div className="flex items-center gap-3">
                       <button 
                         onClick={() => setShowAddSubdomainModal(false)}
                         className="flex-1 py-4 bg-[#F9F9F9] text-[#8C8C8C] font-black text-[10px] uppercase rounded-2xl hover:bg-gray-100 transition-all"
                       >
                         Cancelar
                       </button>
                       <button 
                         onClick={handleAddSubdomain}
                         className="flex-1 py-4 bg-[#1A1A1A] text-white font-black text-[10px] uppercase rounded-2xl hover:scale-105 transition-all shadow-lg"
                       >
                         Adicionar Área
                       </button>
                     </div>
                   </div>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-4">1. Selecione o Domínio Master</p>
                     <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {domains.map(d => (
                           <div 
                             key={d.id}
                             onClick={() => fetchSubdomains(d.id)}
                             className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between group ${subdomains.length > 0 && subdomains[0].domain === d.id ? "bg-[#1A1A1A] border-transparent text-white" : "bg-[#F9F9F9] border-transparent hover:border-[#F1E9DB]"}`}
                           >
                              <div className="flex items-center gap-4">
                                 <div className={`p-3 rounded-2xl ${subdomains.length > 0 && subdomains[0].domain === d.id ? "bg-white/10" : "bg-white"}`}><Database size={18} /></div>
                                 <div className="font-black text-sm uppercase tracking-tight">{d.name}</div>
                              </div>
                              <span className="text-[9px] font-black opacity-40 group-hover:opacity-100">{d.project_count || 0} Projetos</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4 bg-[#FDF9F0]/30 p-8 rounded-[3rem] border border-[#F1E9DB]">
                     <div className="flex items-center justify-between mb-6">
                        <p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">2. Subdomínios (Áreas)</p>
                        {subdomains.length > 0 && (
                            <button 
                                onClick={() => {
                                    setNewDomainName("");
                                    setShowAddSubdomainModal(true);
                                }}
                                className="text-[9px] font-black uppercase text-[#D4AF37] hover:underline"
                            >
                                + Adicionar Área
                            </button>
                        )}
                     </div>
                     
                     <div className="space-y-3">
                        {subdomains.length > 0 ? subdomains.map(s => (
                           <div key={s.id} className="p-5 bg-white border border-[#F1E9DB] rounded-2xl flex items-center justify-between shadow-sm group">
                              <span className="text-xs font-bold text-[#1A1A1A]">{s.name}</span>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                 <button className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </div>
                        )) : (
                           <div className="py-12 text-center">
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C8C8C] opacity-50">Selecione um domínio para gerenciar áreas</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
             </section>
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
                   </div>
                   <div className="bg-white border border-[#F1E9DB] p-6 rounded-[2rem] shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#F9F9F9] text-[#1A1A1A] rounded-xl"><Zap size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C8C]">Tokens Processados</span>
                      </div>
                      <div className="text-3xl font-serif font-black text-[#1A1A1A]">{(costsHistory.reduce((acc, curr) => acc + curr.tokens, 0) / 1000).toFixed(1)}k</div>
                   </div>
                   <div className="bg-white border border-[#F1E9DB] p-6 rounded-[2rem] shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C8C]">Status de Compliance</span>
                      </div>
                      <div className="text-xl font-black text-emerald-600 uppercase tracking-tighter">SOB CONTROLE</div>
                   </div>
                   <div className="bg-white border border-[#F1E9DB] p-6 rounded-[2rem] shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#1A1A1A] text-[#D4AF37] rounded-xl"><RefreshCw size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C8C]">Eficiência (USD/1k)</span>
                      </div>
                      <div className="text-3xl font-serif font-black text-[#1A1A1A]">$ 0.042</div>
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
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#8C8C8C'}} />
                            <YAxis hide />
                            <Tooltip 
                               contentStyle={{backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff'}}
                               itemStyle={{color: '#D4AF37', fontWeight: 900, fontSize: '12px'}}
                            />
                            <Area type="monotone" dataKey="cost_usd" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="bg-white border border-[#F1E9DB] p-8 rounded-[3rem] shadow-sm h-[450px]">
                      <h3 className="text-lg font-black text-[#1A1A1A] mb-2">Custos por Domínio</h3>
                      <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-[0.1em] mb-8">Consumo acumulado por projeto</p>
                      
                      <div className="space-y-6 overflow-y-auto max-h-[300px] custom-scrollbar pr-4">
                        {(costsSummary?.by_project || []).map((proj: any) => (
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
                      </div>
                   </div>
                </div>

                {/* Simulador de Custos Multimodelo */}
                <section className="bg-[#1A1A1A] text-white p-12 rounded-[5rem] shadow-2xl relative overflow-hidden group">
                   <div className="flex flex-col lg:flex-row gap-16 relative z-10">
                      <div className="lg:w-1/3">
                        <div className="p-4 bg-white/10 w-fit rounded-3xl mb-8"><Coins size={32} className="text-[#D4AF37]" /></div>
                        <h2 className="text-4xl font-serif font-black tracking-tight mb-4">Simulador de<br/><span className="text-[#D4AF37]">Multimodelo</span></h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                          Descubra quanto seu consumo atual custaria se os dashboards fossem materializados em outros provedores da LLM.
                        </p>
                      </div>

                      <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { id: "AMAZON_NOVA_PRO", name: "Amazon Nova Pro", in: 0.8, out: 3.2, recommended: true },
                          { id: "CLAUDE_3_5", name: "Claude 3.5 Sonnet", in: 3.0, out: 15.0 },
                          { id: "LLAMA_3_3", name: "Meta Llama 3.3 (70B)", in: 0.72, out: 0.72 },
                          { id: "CLAUDE_3_HAIKU", name: "Claude 3 Haiku", in: 0.25, out: 1.25 }
                        ].map((m) => {
                          const totalTokens = costsHistory.reduce((acc, curr) => acc + curr.tokens, 0);
                          const estCost = (totalTokens * 0.7 / 1000000 * m.in) + (totalTokens * 0.3 / 1000000 * m.out);
                          
                          return (
                            <div key={m.id} className={`p-8 rounded-[2.5rem] border-2 transition-all group/card ${m.recommended ? "bg-[#D4AF37] border-white/20 text-[#1A1A1A]" : "bg-white/5 border-white/5 hover:border-white/20"}`}>
                               <h4 className="text-lg font-black tracking-tight mb-2 uppercase">{m.name}</h4>
                               <div className="text-4xl font-serif font-black mb-8">$ {estCost.toFixed(2)}</div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className={`p-4 rounded-2xl ${m.recommended ? "bg-[#1A1A1A]/10" : "bg-white/5"}`}>
                                     <div className="text-xs font-black uppercase opacity-60">Input</div>
                                     <div className="text-lg font-black">$ {m.in}</div>
                                  </div>
                                  <div className={`p-4 rounded-2xl ${m.recommended ? "bg-[#1A1A1A]/10" : "bg-white/5"}`}>
                                     <div className="text-xs font-black uppercase opacity-60">Output</div>
                                     <div className="text-lg font-black">$ {m.out}</div>
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </section>

                {/* Manutenção e Higiene de Dados */}
                <section className="bg-red-50/50 border-2 border-dashed border-red-100 p-12 rounded-[5rem] flex flex-col md:flex-row items-center justify-between gap-10">
                   <div className="max-w-2xl text-center md:text-left">
                      <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] mb-4">Higiene de Dados & Manutenção</h2>
                      <p className="text-sm text-[#8C8C8C] leading-relaxed">
                        A <span className="text-red-600 font-black uppercase tracking-widest text-[10px]">Limpeza Profunda</span> remove datasets obsoletos e rastros de execução, resetando o cache analítico sem afetar usuários ou prompts centrais. 
                      </p>
                   </div>
                   <button 
                      onClick={handlePurgeCache}
                      disabled={cleaning || !canEdit}
                      className="group flex flex-col items-center gap-4 bg-white p-10 rounded-[4rem] border border-red-100 hover:border-red-500 hover:shadow-2xl transition-all disabled:opacity-50"
                   >
                      <div className={`p-6 rounded-full ${cleaning ? 'bg-gray-100 animate-spin' : 'bg-red-500 text-white shadow-xl shadow-red-500/20 group-hover:scale-110'} transition-all`}>
                         <Trash2 size={32} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Purgar Cache Analítico</span>
                   </button>
                </section>
             </div>
          ) : activeTab === "SYSTEM_PROMPTS" ? (
             <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col lg:flex-row gap-10">
                   {/* Sidebar: Lista de Agentes */}
                   <aside className="lg:w-1/4 space-y-4">
                      <div className="flex items-center gap-3 mb-6 border-b border-[#F1E9DB] pb-4">
                         <div className="p-2 bg-[#F9F9F9] rounded-xl text-[#D4AF37]"><Cpu size={18} /></div>
                         <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest">Agentes de IA</h3>
                      </div>
                      <div className="space-y-2">
                        {systemPrompts.map((agent) => (
                           <button
                             key={agent.agent_key}
                             onClick={() => setSelectedAgent(agent)}
                             className={`w-full p-6 rounded-3xl text-left transition-all border-2 flex flex-col gap-1 ${selectedAgent?.agent_key === agent.agent_key ? "bg-[#1A1A1A] border-transparent text-white shadow-xl scale-[1.02]" : "bg-white border-[#F1E9DB] text-[#1A1A1A] hover:bg-[#FDF9F0]/50"}`}
                           >
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Agente Técnico</span>
                             <span className="text-sm font-black">{agent.name}</span>
                           </button>
                        ))}
                      </div>
                   </aside>

                   {/* Editor: Conteúdo do Agent System Prompt */}
                   <main className="flex-1 bg-white border border-[#F1E9DB] p-10 rounded-[4rem] shadow-sm relative h-fit">
                      {selectedAgent ? (
                        <div className="space-y-10">
                          <div className="flex items-center gap-5 border-b border-[#F1E9DB] pb-10">
                             <div className="p-5 bg-[#FDF9F0] text-[#D4AF37] rounded-3xl"><Sparkles size={32} /></div>
                             <div className="flex-1">
                                <input 
                                  type="text" 
                                  value={selectedAgent.name}
                                  onChange={(e) => setSelectedAgent({...selectedAgent, name: e.target.value})}
                                  className="text-2xl font-black tracking-tight text-[#1A1A1A] uppercase bg-transparent w-full outline-none focus:text-[#D4AF37] transition-colors"
                                />
                                <div className="text-[10px] font-bold text-[#8C8C8C] mt-2 uppercase tracking-widest flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-[#F9F9F9] border border-[#F1E9DB] rounded-md">{selectedAgent.agent_key}</span>
                                  <span>v{selectedAgent.version}</span>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-10">
                             <div>
                                <label className="text-[10px] uppercase tracking-[0.25em] font-black text-[#D4AF37] mb-4 block">Descrição da Missão</label>
                                <input 
                                  type="text" 
                                  value={selectedAgent.description}
                                  onChange={(e) => setSelectedAgent({...selectedAgent, description: e.target.value})}
                                  className="w-full p-5 bg-[#F9F9F9] border-2 border-transparent focus:border-[#F1E9DB] focus:bg-white rounded-2xl text-[12px] font-bold text-[#1A1A1A] outline-none transition-all shadow-inner"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] uppercase tracking-[0.25em] font-black text-[#D4AF37] mb-4 block">Cérebro Lógico (Prompt)</label>
                                <textarea 
                                  rows={14}
                                  value={selectedAgent.content}
                                  onChange={(e) => setSelectedAgent({...selectedAgent, content: e.target.value})}
                                  className="w-full p-10 bg-[#F9F9F9] border-2 border-transparent focus:border-[#F1E9DB] focus:bg-white rounded-[3rem] text-[14px] leading-relaxed font-serif text-[#333] shadow-inner outline-none transition-all resize-none custom-scrollbar"
                                />
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[500px] flex flex-col items-center justify-center text-[#8C8C8C] gap-6">
                           <div className="p-10 bg-[#F9F9F9] rounded-full border border-dashed border-[#F1E9DB] animate-pulse"><Box size={64} className="opacity-10" /></div>
                           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Selecione um agente para auditar</p>
                         </div>
                       )}
                    </main>
                 </div>
              </div>
           ) : (activeTab === "USERS" && isAdmin) ? (
            <div className="lg:col-span-12 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <div className="bg-white border border-[#F1E9DB] p-10 rounded-[3.5rem] shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-[#FDF9F0] text-[#D4AF37] rounded-3xl shadow-sm"><Users size={24} /></div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Colaboradores & Permissões</h2>
                        <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Gestão de Identidade e Quotas de Consumo</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setShowAddUserModal(true)}
                        className="px-8 py-3 bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"
                      >
                        <UserPlus size={14} className="text-[#D4AF37]" />
                        + Novo Usuário
                      </button>
                    </div>
                  </div>

                  {/* Modal de Novo Usuário */}
                  {showAddUserModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-[#F1E9DB] animate-in zoom-in-95 duration-300">
                        <h3 className="text-xl font-black text-[#1A1A1A] mb-2">Novo Colaborador</h3>
                        <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest mb-8">Convite para o ecossistema</p>
                        
                        <div className="space-y-4">
                          <input 
                            type="email" 
                            placeholder="exemplo@empresa.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            className="w-full bg-[#F9F9F9] border-2 border-[#F1E9DB] p-4 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37] transition-all"
                            autoFocus
                          />
                          <select 
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                            className="w-full bg-[#F9F9F9] border-2 border-[#F1E9DB] p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#D4AF37] transition-all"
                          >
                            <option value="ADMIN">Administrador</option>
                            <option value="ANALYST">Analista (Criador)</option>
                            <option value="VIEWER">Visualizador (Executivo)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-3 mt-8">
                          <button 
                            onClick={() => setShowAddUserModal(false)}
                            className="flex-1 py-4 bg-[#F9F9F9] text-[#8C8C8C] font-black text-[10px] uppercase rounded-2xl hover:bg-gray-100 transition-all"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={() => {
                              handleCreateUser(newUser.email, newUser.role);
                              setShowAddUserModal(false);
                            }}
                            className="flex-1 py-4 bg-[#1A1A1A] text-white font-black text-[10px] uppercase rounded-2xl hover:scale-105 transition-all shadow-lg"
                          >
                            Convidar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de Usuários (Simplificada para a Tab, mas mantendo o poder) */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#F1E9DB] text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">
                          <th className="px-4 py-6">Usuário</th>
                          <th className="px-4 py-6">Acesso</th>
                          <th className="px-4 py-6">Quota (Tokens)</th>
                          <th className="px-4 py-6 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(usersQuotas || []).map((u: any) => (
                          <tr key={u.user_id} className="border-b border-[#F1E9DB]/50 hover:bg-[#FDF9F0]/30 transition-all group">
                            <td className="px-4 py-6">
                              <div className="font-bold text-xs text-[#1A1A1A]">{u.email}</div>
                              <div className="text-[9px] text-[#8C8C8C] font-black uppercase mt-1">Ativo</div>
                            </td>
                            <td className="px-4 py-6">
                               <select 
                                 value={u.role}
                                 onChange={(e) => handleUpdateRole(u.user_id, e.target.value)}
                                 className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] focus:ring-0 cursor-pointer"
                               >
                                  <option value="ADMIN">Administrador</option>
                                  <option value="ANALYST">Analista</option>
                                  <option value="VIEWER">Visualizador</option>
                               </select>
                            </td>
                            <td className="px-4 py-6">
                               <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-black">{(u.max_limit / 1000).toFixed(0)}k</span>
                                  <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                                     <div className="h-full bg-[#D4AF37]" style={{ width: `${u.percent_used}%` }} />
                                  </div>
                               </div>
                            </td>
                            <td className="px-4 py-6 text-right">
                               <button 
                                 onClick={() => handleDeleteUser(u.user_id, u.email)}
                                 className="p-2 text-[#8C8C8C] hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
           ) : (
             <div className="lg:col-span-12">
                {!selectedSpecialist ? (
                   <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center justify-between mb-12 border-b border-[#F1E9DB] pb-8">
                        <div>
                          <h3 className="text-3xl font-serif font-black text-[#1A1A1A] tracking-tight">Biblioteca de Especialistas</h3>
                          <p className="text-[10px] text-[#8C8C8C] font-black tracking-[0.25em] uppercase mt-1">Conhecimento de Domínio Ativo</p>
                        </div>
                        <span className="px-6 py-2.5 bg-[#FDF9F0] text-[#D4AF37] text-[10px] font-black rounded-full border border-[#F1E9DB] shadow-sm">
                           {specialists.length} MÓDULOS ATIVOS
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {specialists.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSpecialist(s)}
                            className="bg-white border border-[#F1E9DB] p-10 rounded-[3rem] flex flex-col items-center text-center group hover:border-[#D4AF37]/50 hover:shadow-2xl hover:-translate-y-2 transition-all"
                          >
                            <div className="p-6 bg-[#F9F9F9] text-[#8C8C8C] rounded-[2rem] mb-8 group-hover:bg-[#1A1A1A] group-hover:text-[#D4AF37] transition-all shadow-sm">
                               <Cpu size={40} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-tight text-[#1A1A1A]">{s.name}</h4>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mt-3">{s.category}</p>
                            <div className="mt-8 pt-6 w-full border-t border-[#F1E9DB]/50 text-[10px] font-black text-[#8C8C8C] opacity-0 group-hover:opacity-100 transition-all">
                               AUDITAR PARÂMETROS →
                            </div>
                          </button>
                        ))}
                      </div>
                   </section>
                ) : (
                  <section className="bg-white border border-[#F1E9DB] p-12 rounded-[4.5rem] shadow-sm animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-6">
                        <button onClick={() => setSelectedSpecialist(null)} className="p-3 bg-white border border-[#F1E9DB] rounded-full hover:bg-[#1A1A1A] hover:text-white transition-all">
                           <ArrowLeft size={16} />
                        </button>
                        <div>
                          <h3 className="text-3xl font-serif font-black text-[#1A1A1A] tracking-tight">{selectedSpecialist.name}</h3>
                          <p className="text-[11px] text-[#D4AF37] font-black tracking-widest uppercase">{selectedSpecialist.category} • Auditing Mode</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleDeleteSpecialist(selectedSpecialist.id)} className="p-4 text-red-100 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                           <Trash2 size={24} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] font-black text-[#8C8C8C] mb-4 block">Descrição do Expert</label>
                        <input 
                          type="text" 
                          value={selectedSpecialist.description}
                          onChange={(e) => setSelectedSpecialist({...selectedSpecialist, description: e.target.value})}
                          className="w-full p-6 bg-[#F9F9F9] border-2 border-transparent focus:border-[#F1E9DB] focus:bg-white rounded-[2rem] text-sm font-bold text-[#1A1A1A] outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] font-black text-[#8C8C8C] mb-4 block">Lógica de Reconhecimento de Padrão (Custom Prompt)</label>
                        <textarea 
                          rows={15}
                          value={selectedSpecialist.content}
                          onChange={(e) => setSelectedSpecialist({...selectedSpecialist, content: e.target.value})}
                          className="w-full p-10 bg-[#F9F9F9] border-2 border-transparent focus:border-[#F1E9DB] focus:bg-white rounded-[3rem] text-[14px] leading-relaxed font-serif text-[#333] shadow-inner outline-none transition-all resize-none custom-scrollbar"
                        />
                      </div>
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
