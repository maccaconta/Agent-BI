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
  Lock,
  TrendingUp,
  Wallet,
  Database,
  UserPlus,
  Layers,
  X
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
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeStats, setPurgeStats] = useState<any>(null);
  const [invitedUserData, setInvitedUserData] = useState<any>(null);
  const [newUser, setNewUser] = useState({ email: "", role: "VIEWER" });
  const [newDomainName, setNewDomainName] = useState("");
  const router = useRouter();
  const { user, getRole } = useAuth();

  const currentRole = getRole();
  const isAdmin = user?.is_super_admin || currentRole === "ADMIN" || currentRole === "OWNER";
  const isCriador = currentRole === "ANALYST";
  const canEdit = isAdmin;

  useEffect(() => {
    if (user && !isAdmin && !isCriador) {
        router.push("/projects");
    }
  }, [user, isAdmin, isCriador, router]);

  const BACKEND_URL = "";

  const [prompt, setPrompt] = useState({
    id: null as string | null,
    persona_title: "Analista Financeiro Sênior",
    persona_description: "Você é um analista financeiro sênior especializado em identificar relações ocultas em dados e gerar insights estratégicos.",
    compliance_rules: "",
    pii_keywords_json: {
      "nome": "MASK_NAME",
      "nm_cliente": "MASK_NAME",
      "sobrenome": "MASK_NAME",
      "cpf": "MASK_ID",
      "cnpj": "MASK_ID",
      "email": "MASK_EMAIL",
      "contato": "MASK_EMAIL",
      "telefone": "MASK_PHONE",
      "celular": "MASK_PHONE",
      "endereco": "REDACTED",
      "logradouro": "REDACTED",
      "senha": "REDACTED",
      "password": "REDACTED",
      "credit_card": "REDACTED",
      "cartao": "REDACTED"
    } as any,
    temperature: 0.3,
    top_p: 0.9,
    top_k: 250,
    max_tokens_limit: 32000,
    ingestion_row_limit: 5000,
    session_timeout_minutes: 15,
    is_active: true
  });

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("agent_bi_access_token") : null;
    return {
      "Content-Type": "application/json",
      "X-Tenant-Slug": "default",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

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
        const data = await res.json();
        setInvitedUserData(data);
        fetchCostsData();
        fetchUsersQuotas();
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
        const configList = Array.isArray(data) ? data : (data.results || []);
        
        if (configList.length > 0) {
          const p = configList[0];
          setPrompt({
            id: p.id,
            persona_title: p.persona_title || "",
            persona_description: p.persona_description || "",
            compliance_rules: p.compliance_rules || "",
            pii_keywords_json: p.pii_keywords_json || {},
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

  const fetchPurgeStats = async () => {
    try {
        const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/purge_stats/`, {
            headers: getHeaders()
        });
        if (res.ok) {
            setPurgeStats(await res.json());
            setShowPurgeModal(true);
        } else {
            const err = await res.json().catch(() => ({}));
            setError(err.error || "Ação restrita a administradores.");
        }
    } catch (err) {
        setError("Não foi possível carregar estatísticas de manutenção.");
    }
  };

  const handlePurgeCache = async () => {
    setCleaning(true);
    setShowPurgeModal(false);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/purge_analytical_cache/`, {
        method: "POST",
        headers: getHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Sucesso! Higiene concluída.`);
        fetchCostsData();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao realizar limpeza profunda.");
      }
    } catch (err: any) {
      console.error("Erro na purga:", err);
      setError(err.message || "Falha ao realizar higienização.");
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
    <div className="min-h-screen bg-[#FDF9F0]/20 selection:bg-[#D4AF37]/20">
      {/* Header Luxury Light - Fundo Bege Suave com Borda Dourada */}
      <header className="bg-[#FDF9F0]/80 backdrop-blur-xl border-b border-[#D4AF37]/20 sticky top-0 z-[50] py-6 px-8 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Link 
              href="/projects" 
              className="p-3 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#D4AF37] rounded-xl transition-all border border-[#D4AF37]/20 group"
              title="Voltar ao Portfólio"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="p-3.5 bg-[#1A1A1A] text-[#D4AF37] rounded-2xl shadow-lg hover:scale-105 transition-all">
              <ShieldCheck size={30} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-black text-[#1A1A1A] tracking-tighter uppercase">Governança em IA</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Enterprise Guardrail System v4</span>
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {canEdit && (
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="px-10 py-4 bg-[#1A1A1A] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} className="text-[#D4AF37]" />}
                  <span>{saving ? "Sincronizando..." : "Publicar Alterações"}</span>
                </button>
              )}
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 md:p-10 space-y-12">
        <div className="flex flex-col gap-10">
          {/* Menu de Abas Compacto - Grid de 7 colunas para caber tudo no visor */}
          <nav className="grid grid-cols-4 md:grid-cols-7 gap-2 bg-white/40 p-2 rounded-[2.5rem] border border-[#F1E9DB] shadow-inner">
            {[
              { id: "MASTER", label: "Geral", icon: <ShieldCheck size={14} /> },
              { id: "SECURITY", label: "Segurança", icon: <Lock size={14} /> },
              { id: "SYSTEM_PROMPTS", label: "Agentes", icon: <Sparkles size={14} /> },
              { id: "SPECIALISTS", label: "Expert", icon: <Database size={14} /> },
              { id: "DOMAINS", label: "Domínios", icon: <Layers size={14} /> },
              { id: "COSTS", label: "Custos", icon: <Coins size={14} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col lg:flex-row items-center justify-center gap-1.5 px-2 py-4 rounded-[1.75rem] text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1A1A1A] text-[#D4AF37] shadow-xl scale-[1.02]"
                    : "text-[#8C8C8C] hover:bg-white hover:text-[#1A1A1A]"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

      {(success || error) && (
        <div className="flex justify-end mt-2 animate-in fade-in slide-in-from-top-2">
          {success && <div className="flex items-center gap-2 text-emerald-600 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Publicado com Sucesso</div>}
          {error && <div className="bg-red-50 text-red-500 text-[9px] font-black uppercase px-4 py-1.5 border border-red-100 rounded-full shadow-sm">{error}</div>}
        </div>
      )}

      {activeTab === "MASTER" ? (
            <div className="space-y-12">
              <section className="group relative bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-12 rounded-[4rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] backdrop-blur-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-[#D4AF37]/10 transition-colors duration-700" />
                <div className="flex items-center gap-6 mb-12 relative z-10">
                  <div className="p-5 bg-gradient-to-br from-[#FDF9F0] to-[#F1E9DB] dark:from-white/5 dark:to-white/10 text-[#D4AF37] rounded-[2rem] shadow-sm group-hover:rotate-6 transition-transform duration-500"><MessageSquareQuote size={32} strokeWidth={1.5} /></div>
                  <div><h2 className="text-3xl font-black tracking-tight text-[#1A1A1A] dark:text-white font-serif">Configurações de Identidade Global</h2><p className="text-[11px] text-[#D4AF37] font-black tracking-[0.3em] uppercase mt-1">Core AI Persona Settings</p></div>
                </div>
                <div className="space-y-12 relative z-10">
                  <div className="space-y-4">
                    <label className="text-[11px] uppercase tracking-[0.3em] font-black text-[#D4AF37] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Título da Persona Master</label>
                    <input type="text" value={prompt.persona_title} readOnly={!canEdit} onChange={(e) => setPrompt({...prompt, persona_title: e.target.value})} className={`w-full p-8 bg-[#F9F9F9] dark:bg-white/5 border border-transparent focus:border-[#D4AF37]/30 focus:bg-white dark:focus:bg-white/10 rounded-[2rem] text-xl font-bold transition-all outline-none shadow-inner text-[#1A1A1A] dark:text-white ${!canEdit ? 'opacity-80 cursor-not-allowed' : ''}`} placeholder="Ex: Consultor Estratégico de Negócios" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] uppercase tracking-[0.3em] font-black text-[#D4AF37] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Essência Cognitiva (Lógica & Comportamento)</label>
                    <textarea rows={6} value={prompt.persona_description} readOnly={!canEdit} onChange={(e) => setPrompt({...prompt, persona_description: e.target.value})} className={`w-full p-10 bg-[#F9F9F9] dark:bg-white/5 border border-transparent focus:border-[#D4AF37]/30 focus:bg-white dark:focus:bg-white/10 rounded-[2.5rem] text-lg leading-relaxed transition-all outline-none resize-none font-serif text-[#333] dark:text-gray-300 shadow-inner ${!canEdit ? 'opacity-80 cursor-not-allowed' : ''}`} placeholder="Descreva detalhadamente como o Agente de IA deve raciocinar e interagir..." />
                  </div>
                </div>
              </section>
              <section className="group relative bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-12 rounded-[4rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] backdrop-blur-xl overflow-hidden">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-lux-accent/5 blur-[80px] rounded-full -ml-20 -mb-20" />
                <div className="flex items-center gap-6 mb-16 relative z-10">
                  <div className="p-5 bg-[#1A1A1A] text-[#D4AF37] rounded-[2rem] shadow-xl group-hover:scale-110 transition-transform duration-500 border border-white/10"><Activity size={32} strokeWidth={1.5} /></div>
                  <div><h2 className="text-3xl font-black tracking-tight text-[#1A1A1A] dark:text-white font-serif">Inteligência de Dados & Performance</h2><p className="text-[11px] text-[#D4AF37] font-black tracking-[0.3em] uppercase mt-1">Motor de Processamento "Nova Amazonas"</p></div>
                </div>
                <div className="space-y-20 relative z-10">
                  <div className="space-y-10 bg-[#FDF9F0]/40 dark:bg-white/5 p-10 rounded-[3rem] border border-lux-border/20 dark:border-white/5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                      <div className="space-y-3"><label className="text-sm uppercase tracking-[0.3em] font-black text-[#1A1A1A] dark:text-white block flex items-center gap-3">Limite Mestre de Tokens <div className="p-1.5 bg-white dark:bg-white/10 rounded-full border border-lux-border/20"><Info size={14} className="text-[#D4AF37]" /></div></label><p className="text-sm text-[#8C8C8C] leading-relaxed max-w-lg italic font-medium">Define a profundidade da análise. Valores entre <span className="text-[#D4AF37] font-bold">16k e 32k</span> são o equilíbrio ideal para auditorias corporativas.</p></div>
                      <div className="flex items-center gap-6 bg-white dark:bg-[#1A1A1A] border border-[#D4AF37]/20 dark:border-white/10 p-6 px-10 rounded-[2rem] shadow-2xl text-[#1A1A1A] dark:text-white group/value"><Zap size={24} className="text-[#D4AF37] group-hover/value:animate-pulse" /><div className="flex flex-col"><span className="text-3xl font-serif font-black tracking-tighter leading-none">{prompt.max_tokens_limit.toLocaleString()}</span><span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mt-1">Tokens Ativos</span></div></div>
                    </div>
                    <div className="relative pt-6 px-4">
                      <input type="range" min="4000" max="200000" step="4000" value={prompt.max_tokens_limit} onChange={(e) => setPrompt({...prompt, max_tokens_limit: parseInt(e.target.value)})} className="w-full h-2 bg-[#F1E9DB] dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D4AF37] hover:scale-[1.01] transition-transform" />
                      <div className="flex justify-between mt-6 text-[10px] text-[#8C8C8C] font-black uppercase tracking-[0.3em]"><span className="opacity-40">Econômico (4k)</span><div className="flex flex-col items-center"><div className="w-1 h-1 bg-[#D4AF37] rounded-full mb-2" /><span className="text-[#D4AF37] font-black">Sugestão Master (32k)</span></div><span className="opacity-40">Profundo (200k)</span></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F9F9F9] p-8 rounded-[2.5rem] border border-[#F1E9DB]">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between"><label className="text-[10px] uppercase tracking-[0.2em] font-black text-[#1A1A1A] flex items-center gap-2">Temperatura (Criatividade) <Info size={12} className="text-[#D4AF37]" /></label><div className="text-sm font-mono font-black text-[#D4AF37] bg-white border border-[#F1E9DB] p-2 px-4 rounded-xl shadow-sm">{prompt.temperature.toFixed(2)}</div></div>
                      <input type="range" min="0" max="1" step="0.05" value={prompt.temperature} onChange={(e) => setPrompt({...prompt, temperature: parseFloat(e.target.value)})} className="w-full h-2 bg-white border border-[#F1E9DB] rounded-full appearance-none cursor-pointer accent-[#D4AF37]" />
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between"><label className="text-[10px] uppercase tracking-[0.2em] font-black text-[#1A1A1A] flex items-center gap-2">Top P (Amostragem) <Info size={12} className="text-[#D4AF37]" /></label><div className="text-sm font-mono font-black text-[#D4AF37] bg-white border border-[#F1E9DB] p-2 px-4 rounded-xl shadow-sm">{prompt.top_p.toFixed(2)}</div></div>
                      <input type="range" min="0" max="1" step="0.05" value={prompt.top_p} onChange={(e) => setPrompt({...prompt, top_p: parseFloat(e.target.value)})} className="w-full h-2 bg-white border border-[#F1E9DB] rounded-full appearance-none cursor-pointer accent-[#1A1A1A]" />
                    </div>
                  </div>
                </div>
              </section>
              <section className="bg-white border border-[#F1E9DB] p-10 rounded-[3rem] shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-6 relative z-10"><div className="p-4 bg-[#FDF9F0] text-[#D4AF37] rounded-3xl border border-[#F1E9DB] shadow-sm"><Zap size={28} /></div><div><h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Controle de Escala (Ingestão)</h2><p className="text-[10px] text-[#D4AF37] font-black tracking-[0.25em] uppercase">Limitação de Processamento</p></div></div>
                <div className="space-y-8 bg-[#FDF9F0]/30 p-8 rounded-[2.5rem] border border-[#F1E9DB]/50 mb-8 mt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div><label className="text-xs uppercase tracking-[0.2em] font-black text-[#1A1A1A] block mb-2 flex items-center gap-2">Limite de Linhas para Ingestão (Global) <Info size={14} className="text-[#D4AF37]" /></label><p className="text-xs text-[#8C8C8C] leading-relaxed max-w-md italic">Este parâmetro define o teto de processamento para novos datasets do Tenant.</p></div>
                    <div className="flex items-center gap-4 bg-white border border-[#F1E9DB] p-4 px-6 rounded-2xl shadow-sm text-[#1A1A1A]"><BarChart3 size={20} className="text-[#D4AF37]" /><span className="text-lg font-mono font-black tracking-tighter">{prompt.ingestion_row_limit.toLocaleString()} <span className="text-[#8C8C8C] text-xs">Linhas</span></span></div>
                  </div>
                  <div className="relative pt-4"><input type="range" min="500" max="100000" step="500" value={prompt.ingestion_row_limit} onChange={(e) => setPrompt({...prompt, ingestion_row_limit: parseInt(e.target.value)})} className="w-full h-3 bg-white border border-[#F1E9DB] rounded-full appearance-none cursor-pointer accent-[#1A1A1A] hover:scale-[1.01] transition-transform" /></div>
                </div>
                <div className="space-y-8 bg-[#FDF9F0]/30 p-8 rounded-[2.5rem] border border-[#F1E9DB]/50 mb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div><label className="text-xs uppercase tracking-[0.2em] font-black text-[#1A1A1A] block mb-2 flex items-center gap-2">Timeout de Inatividade (Sessão) <Info size={14} className="text-[#D4AF37]" /></label><p className="text-xs text-[#8C8C8C] leading-relaxed max-w-md italic">Redireciona para a tela de apresentação após o tempo selecionado sem interações.</p></div>
                    <div className="flex items-center gap-4 bg-white border border-[#F1E9DB] p-4 px-6 rounded-2xl shadow-sm text-[#1A1A1A]"><ShieldCheck size={20} className="text-[#D4AF37]" /><span className="text-lg font-mono font-black tracking-tighter">{prompt.session_timeout_minutes} <span className="text-[#8C8C8C] text-xs">Minutos</span></span></div>
                  </div>
                  <div className="relative pt-4"><input type="range" min="1" max="120" step="1" value={prompt.session_timeout_minutes} onChange={(e) => setPrompt({...prompt, session_timeout_minutes: parseInt(e.target.value)})} className="w-full h-3 bg-white border border-[#F1E9DB] rounded-full appearance-none cursor-pointer accent-[#D4AF37] hover:scale-[1.01] transition-transform" /></div>
                </div>
              </section>
            </div>
          ) : activeTab === "SECURITY" ? (
            <div className="space-y-12">
              <section className="group relative bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-12 rounded-[4rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] backdrop-blur-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="flex items-center gap-6 mb-12 relative z-10">
                  <div className="p-5 bg-gradient-to-br from-[#FDF9F0] to-[#F1E9DB] dark:from-white/5 dark:to-white/10 text-[#D4AF37] rounded-[2rem] shadow-sm"><ShieldCheck size={32} strokeWidth={1.5} /></div>
                  <div><h2 className="text-3xl font-black tracking-tight text-[#1A1A1A] dark:text-white font-serif">Blindagem & Anonimização de PII</h2><p className="text-[11px] text-[#D4AF37] font-black tracking-[0.3em] uppercase mt-1">Data Privacy Control Center</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
                  <div className="lg:col-span-8 space-y-10">
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1"><label className="text-sm font-black text-[#1A1A1A] dark:text-white uppercase tracking-widest flex items-center gap-2">Dicionário de Blindagem Ativa <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] rounded-md border border-[#D4AF37]/20 animate-pulse">Proteção Real-time</span></label><p className="text-xs text-[#8C8C8C] font-medium italic">Mapeie colunas sensíveis para anonimização automática via "Pattern Guard".</p></div>
                        <button onClick={() => { const newKey = `coluna_${Object.keys(prompt.pii_keywords_json).length + 1}`; setPrompt({ ...prompt, pii_keywords_json: { ...prompt.pii_keywords_json, [newKey]: "MASK_NAME" } }); }} className="px-6 py-3 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-xl flex items-center gap-2 border border-white/10"><UserPlus size={16} /> Nova Regra</button>
                      </div>
                      <div className="bg-[#F9F9F9] dark:bg-white/5 rounded-[3rem] border border-lux-border/20 dark:border-white/10 overflow-hidden shadow-inner">
                        <table className="w-full text-left">
                          <thead><tr className="border-b border-lux-border/20 dark:border-white/5 bg-[#FDF9F0]/50 dark:bg-white/5 text-[10px] font-black text-[#8C8C8C] dark:text-gray-400 uppercase tracking-widest"><th className="px-10 py-6">Coluna (Target)</th><th className="px-10 py-6">Estratégia</th><th className="px-10 py-6 text-right">Ação</th></tr></thead>
                          <tbody className="divide-y divide-lux-border/10 dark:divide-white/5">
                            {Object.entries(prompt.pii_keywords_json).map(([key, value]: [string, any]) => (
                              <tr key={key} className="hover:bg-white dark:hover:bg-white/5 transition-colors group">
                                <td className="px-10 py-5"><input type="text" value={key} onChange={(e) => { const newKey = e.target.value; if (newKey === key) return; const newObj = { ...prompt.pii_keywords_json }; newObj[newKey] = value; delete newObj[key]; setPrompt({ ...prompt, pii_keywords_json: newObj }); }} className="bg-transparent border-none focus:ring-0 text-sm font-bold text-[#1A1A1A] dark:text-white w-full outline-none" /></td>
                                <td className="px-10 py-5"><select value={value} onChange={(e) => { setPrompt({ ...prompt, pii_keywords_json: { ...prompt.pii_keywords_json, [key]: e.target.value } }); }} className="bg-white dark:bg-[#1A1A1A] border border-lux-border/30 dark:border-white/10 rounded-xl text-[11px] font-bold text-[#1A1A1A] dark:text-white focus:ring-1 focus:ring-[#D4AF37] outline-none p-2 px-3 shadow-sm"><option value="MASK_NAME">Nome (Jo** Silva)</option><option value="MASK_ID">ID/CPF (****-00)</option><option value="MASK_EMAIL">E-mail (a***@doc.com)</option><option value="MASK_PHONE">Telefone ((**) 9***)</option><option value="REDACTED">Remoção Total (REDACTED)</option></select></td>
                                <td className="px-10 py-5 text-right"><button onClick={() => { const newObj = { ...prompt.pii_keywords_json }; delete newObj[key]; setPrompt({ ...prompt, pii_keywords_json: newObj }); }} className="p-3 text-[#8C8C8C] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-10">
                     <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] p-10 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group/card"><div className="absolute -top-12 -right-12 opacity-5 rotate-12 group-hover/card:scale-110 transition-transform duration-700"><ShieldCheck size={200} className="text-white" /></div><h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-8 flex items-center gap-3 relative z-10"><Info size={16} /> Guardrail Intelligence</h4><ul className="space-y-6 relative z-10">{[ { k: "Blindagem Nativa", d: "Detecção automática de padrões sensíveis via Regex avançado." }, { k: "Filtro Global", d: "Interceptação de saída em nível de camada de aplicação." }, { k: "Zero Latency", d: "Processamento otimizado para não impactar a fluidez da IA." } ].map((item, idx) => ( <li key={idx} className="space-y-2 pb-6 border-b border-white/5 last:border-0 group/item"><div className="text-[11px] font-black text-white uppercase tracking-widest group-hover/item:text-[#D4AF37] transition-colors">{item.k}</div><p className="text-xs text-gray-400 leading-relaxed font-medium opacity-70 italic">{item.d}</p></li> ))}</ul></div>
                     <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-10 rounded-[3rem] flex items-start gap-6 backdrop-blur-sm group/status"><div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 group-hover/status:rotate-12 transition-transform"><CheckCircle2 size={28} /></div><div><h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Escudo Ativado</h4><p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2 leading-relaxed font-bold italic">Sua infraestrutura de dados está protegendo {Object.keys(prompt.pii_keywords_json).length} chaves sensíveis mapeadas.</p></div></div>
                  </div>
                </div>
              </section>
            </div>
          ) : activeTab === "SYSTEM_PROMPTS" ? (
            <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex flex-col lg:flex-row gap-10">
                  <aside className="lg:w-1/4 space-y-4">
                     <div className="flex items-center gap-3 mb-6 border-b border-lux-border/20 pb-4"><div className="p-2 bg-[#F9F9F9] dark:bg-white/5 rounded-xl text-[#D4AF37]"><Cpu size={18} /></div><h3 className="text-sm font-black text-[#1A1A1A] dark:text-white uppercase tracking-widest">Agentes Técnicos</h3></div>
                     <div className="space-y-2">
                       {systemPrompts.map((agent) => (
                          <button key={agent.agent_key} onClick={() => setSelectedAgent(agent)} className={`w-full p-6 rounded-3xl text-left transition-all border-2 flex flex-col gap-1 ${selectedAgent?.agent_key === agent.agent_key ? "bg-[#1A1A1A] dark:bg-white border-transparent text-white dark:text-[#1A1A1A] shadow-xl scale-[1.02]" : "bg-white dark:bg-white/5 border-lux-border/20 text-[#1A1A1A] dark:text-white hover:bg-[#FDF9F0]/50"}`}><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Cognitive Layer</span><span className="text-sm font-black">{agent.name}</span></button>
                       ))}
                     </div>
                  </aside>
                  <main className="flex-1 bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-12 rounded-[4rem] shadow-2xl relative h-fit backdrop-blur-xl">
                     {selectedAgent ? (
                       <div className="space-y-10">
                         <div className="flex items-center gap-6 border-b border-lux-border/10 pb-10"><div className="p-5 bg-gradient-to-br from-[#FDF9F0] to-[#F1E9DB] dark:from-white/5 dark:to-white/10 text-[#D4AF37] rounded-3xl shadow-sm"><Sparkles size={32} /></div><div className="flex-1"><input type="text" value={selectedAgent.name} onChange={(e) => setSelectedAgent({...selectedAgent, name: e.target.value})} className="text-3xl font-black tracking-tight text-[#1A1A1A] dark:text-white uppercase bg-transparent w-full outline-none focus:text-[#D4AF37] transition-colors font-serif" /><div className="text-[10px] font-bold text-[#8C8C8C] mt-2 uppercase tracking-widest flex items-center gap-4"><span className="px-3 py-1 bg-lux-bg dark:bg-white/10 border border-lux-border/20 rounded-lg">{selectedAgent.agent_key}</span><span className="text-[#D4AF37] font-black">v{selectedAgent.version}</span></div></div></div>
                         <div className="space-y-10">
                            <div><label className="text-[11px] uppercase tracking-[0.3em] font-black text-[#D4AF37] mb-4 block">Missão do Agente</label><input type="text" value={selectedAgent.description} onChange={(e) => setSelectedAgent({...selectedAgent, description: e.target.value})} className="w-full p-6 bg-[#F9F9F9] dark:bg-white/5 border border-transparent focus:border-[#D4AF37]/30 focus:bg-white rounded-2xl text-xs font-bold text-[#1A1A1A] dark:text-white outline-none transition-all" /></div>
                            <div><label className="text-[11px] uppercase tracking-[0.3em] font-black text-[#D4AF37] mb-4 block">Arquitetura de Resposta (Prompt)</label><textarea rows={16} value={selectedAgent.content} onChange={(e) => setSelectedAgent({...selectedAgent, content: e.target.value})} className="w-full p-10 bg-[#F9F9F9] dark:bg-white/5 border border-transparent focus:border-[#D4AF37]/30 focus:bg-white dark:focus:bg-white/10 rounded-[3rem] text-sm leading-relaxed font-serif text-[#333] dark:text-gray-300 shadow-inner outline-none transition-all resize-none" /></div>
                         </div>
                       </div>
                     ) : (
                       <div className="h-[600px] flex flex-col items-center justify-center text-[#8C8C8C] gap-6 opacity-40"><Box size={80} strokeWidth={1} /><p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Selecione um agente para auditar</p></div>
                      )}
                   </main>
                </div>
             </div>
          ) : activeTab === "SPECIALISTS" ? (
            <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {!selectedSpecialist ? (
                   <section className="space-y-12">
                      <div className="flex items-center justify-between mb-12 border-b border-lux-border/20 pb-8"><div><h3 className="text-4xl font-serif font-black text-[#1A1A1A] dark:text-white tracking-tight">Biblioteca de Especialistas</h3><p className="text-[11px] text-[#D4AF37] font-black tracking-[0.25em] uppercase mt-2">Domain Knowledge Repositories</p></div><span className="px-8 py-3 bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] text-[#D4AF37] text-[11px] font-black rounded-full border border-white/10 shadow-2xl">{specialists.length} MÓDULOS ATIVOS</span></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">{specialists.map((s) => ( <button key={s.id} onClick={() => setSelectedSpecialist(s)} className="bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-12 rounded-[4rem] flex flex-col items-center text-center group hover:border-[#D4AF37]/50 hover:shadow-[0_30px_70px_rgba(0,0,0,0.1)] hover:-translate-y-3 transition-all duration-500 backdrop-blur-xl"><div className="p-8 bg-[#F9F9F9] dark:bg-white/5 text-[#8C8C8C] rounded-[2.5rem] mb-10 group-hover:bg-[#1A1A1A] dark:group-hover:bg-[#D4AF37] group-hover:text-[#D4AF37] dark:group-hover:text-[#1A1A1A] transition-all shadow-sm"><Cpu size={48} strokeWidth={1.5} /></div><h4 className="font-black text-sm uppercase tracking-tight text-[#1A1A1A] dark:text-white mb-2">{s.name}</h4><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">{s.category}</p><div className="mt-10 pt-8 w-full border-t border-lux-border/10 text-[10px] font-black text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-all tracking-widest">AUDITAR PARÂMETROS →</div></button> ))}</div>
                   </section>
                ) : (
                  <section className="bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-16 rounded-[5rem] shadow-2xl animate-in zoom-in-95 duration-500 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-16"><div className="flex items-center gap-8"><button onClick={() => setSelectedSpecialist(null)} className="p-4 bg-white dark:bg-white/5 border border-lux-border/20 rounded-full hover:bg-[#1A1A1A] dark:hover:bg-white hover:text-white dark:hover:text-[#1A1A1A] transition-all shadow-sm"><ArrowLeft size={20} /></button><div><h3 className="text-4xl font-serif font-black text-[#1A1A1A] dark:text-white tracking-tight">{selectedSpecialist.name}</h3><p className="text-[12px] text-[#D4AF37] font-black tracking-widest uppercase mt-1">{selectedSpecialist.category} • Auditing Mode</p></div></div><div className="flex items-center gap-6"><button onClick={() => handleDeleteSpecialist(selectedSpecialist.id)} className="p-5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-3xl transition-all"><Trash2 size={28} /></button></div></div>
                    <div className="space-y-16"><div><label className="text-[11px] uppercase tracking-[0.4em] font-black text-[#D4AF37] block">Expert Identity Profile</label><input type="text" value={selectedSpecialist.description} onChange={(e) => setSelectedSpecialist({...selectedSpecialist, description: e.target.value})} className="w-full p-8 bg-[#F9F9F9] dark:bg-white/5 border border-transparent focus:border-[#D4AF37]/30 focus:bg-white dark:focus:bg-white/10 rounded-[2.5rem] text-sm font-bold text-[#1A1A1A] dark:text-white outline-none transition-all shadow-inner" /></div><div><label className="text-[11px] uppercase tracking-[0.4em] font-black text-[#D4AF37] block">Cognitive Reasoning Patterns (Custom Prompt)</label><textarea rows={18} value={selectedSpecialist.content} onChange={(e) => setSelectedSpecialist({...selectedSpecialist, content: e.target.value})} className="w-full p-12 bg-[#F9F9F9] dark:bg-white/5 border border-transparent focus:border-[#D4AF37]/30 focus:bg-white dark:focus:bg-white/10 rounded-[4rem] text-base leading-relaxed font-serif text-[#333] dark:text-gray-300 shadow-inner outline-none transition-all resize-none" /></div></div>
                  </section>
                )}
             </div>
          ) : activeTab === "DOMAINS" ? (
            <section className="bg-white border border-[#F1E9DB] p-10 rounded-[3.5rem] shadow-sm animate-in fade-in slide-in-from-right-4">
               <div className="flex items-center justify-between mb-10"><div className="flex items-center gap-4"><div className="p-4 bg-[#FDF9F0] text-[#D4AF37] rounded-3xl"><Database size={24} /></div><div><h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Domínios de Dados</h2><p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Governança de Propriedade e Áreas de Negócio</p></div></div><button onClick={() => { setNewDomainName(""); setShowAddDomainModal(true); }} className="px-8 py-3 bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#333] transition-all shadow-xl">+ Novo Domínio Master</button></div>
               {showAddDomainModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"><div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-[#F1E9DB] animate-in zoom-in-95 duration-300"><h3 className="text-xl font-black text-[#1A1A1A] mb-2">Novo Domínio Data Mesh</h3><p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest mb-8">Defina um novo agrupamento corporativo</p><input type="text" placeholder="Ex: Comercial, Operações..." value={newDomainName} onChange={(e) => setNewDomainName(e.target.value)} className="w-full bg-[#F9F9F9] border-2 border-[#F1E9DB] p-4 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37] mb-6 transition-all" autoFocus /><div className="flex items-center gap-3"><button onClick={() => setShowAddDomainModal(false)} className="flex-1 py-4 bg-[#F9F9F9] text-[#8C8C8C] font-black text-[10px] uppercase rounded-2xl hover:bg-gray-100 transition-all">Cancelar</button><button onClick={handleAddDomain} className="flex-1 py-4 bg-[#D4AF37] text-white font-black text-[10px] uppercase rounded-2xl hover:scale-105 transition-all shadow-lg">Confirmar</button></div></div></div>)}
               {showAddSubdomainModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"><div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-[#F1E9DB] animate-in zoom-in-95 duration-300"><h3 className="text-xl font-black text-[#1A1A1A] mb-2">Nova Área de Negócio</h3><p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest mb-8">Subdomínio sob {domains.find(d => d.id === subdomains[0]?.domain)?.name}</p><input type="text" placeholder="Ex: Logística, Vendas Diretas..." value={newDomainName} onChange={(e) => setNewDomainName(e.target.value)} className="w-full bg-[#F9F9F9] border-2 border-[#F1E9DB] p-4 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37] mb-6 transition-all" autoFocus /><div className="flex items-center gap-3"><button onClick={() => setShowAddSubdomainModal(false)} className="flex-1 py-4 bg-[#F9F9F9] text-[#8C8C8C] font-black text-[10px] uppercase rounded-2xl hover:bg-gray-100 transition-all">Cancelar</button><button onClick={handleAddSubdomain} className="flex-1 py-4 bg-[#1A1A1A] text-white font-black text-[10px] uppercase rounded-2xl hover:scale-105 transition-all shadow-lg">Adicionar Área</button></div></div></div>)}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4"><p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-4">1. Selecione o Domínio Master</p><div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">{domains.map(d => (<div key={d.id} onClick={() => fetchSubdomains(d.id)} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between group ${subdomains.length > 0 && subdomains[0].domain === d.id ? "bg-[#1A1A1A] border-transparent text-white" : "bg-[#F9F9F9] border-transparent hover:border-[#F1E9DB]"}`}><div className="flex items-center gap-4"><div className={`p-3 rounded-2xl ${subdomains.length > 0 && subdomains[0].domain === d.id ? "bg-white/10" : "bg-white"}`}><Database size={18} /></div><div className="font-black text-sm uppercase tracking-tight">{d.name}</div></div><span className="text-[9px] font-black opacity-40 group-hover:opacity-100">{d.project_count || 0} Projetos</span></div>))}</div></div>
                  <div className="space-y-4 bg-[#FDF9F0]/30 p-8 rounded-[3rem] border border-[#F1E9DB]"><div className="flex items-center justify-between mb-6"><p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">2. Subdomínios (Áreas)</p>{subdomains.length > 0 && (<button onClick={() => { setNewDomainName(""); setShowAddSubdomainModal(true); }} className="text-[9px] font-black uppercase text-[#D4AF37] hover:underline">+ Adicionar Área</button>)}</div><div className="space-y-3">{subdomains.length > 0 ? subdomains.map(s => (<div key={s.id} className="p-5 bg-white border border-[#F1E9DB] rounded-2xl flex items-center justify-between shadow-sm group"><span className="text-xs font-bold text-[#1A1A1A]">{s.name}</span><div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all"><button className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button></div></div>)) : (<div className="py-12 text-center"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C8C8C] opacity-50">Selecione um domínio para gerenciar áreas</p></div>)}</div></div>
               </div>
             </section>
          ) : (activeTab === "USERS" && isAdmin) ? (
             <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-12 rounded-[5rem] shadow-2xl backdrop-blur-xl">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                     <div className="flex items-center gap-6"><div className="p-5 bg-gradient-to-br from-[#FDF9F0] to-[#F1E9DB] dark:from-white/5 dark:to-white/10 text-[#D4AF37] rounded-[2rem] shadow-sm"><Users size={32} strokeWidth={1.5} /></div><div><h2 className="text-3xl font-black tracking-tight text-[#1A1A1A] dark:text-white font-serif">Gestão de Identidade & Acessos</h2><p className="text-[11px] font-black text-[#8C8C8C] dark:text-gray-400 uppercase tracking-[0.3em] mt-1">IAM Governance Framework</p></div></div>
                     <button onClick={() => setShowAddUserModal(true)} className="px-10 py-5 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4"><UserPlus size={18} className="text-[#D4AF37]" />Convidar Colaborador</button>
                   </div>
                   <div className="bg-[#F9F9F9] dark:bg-white/5 rounded-[4rem] border border-lux-border/20 overflow-hidden shadow-inner">
                      <table className="w-full text-left">
                        <thead><tr className="bg-[#FDF9F0]/50 dark:bg-white/5 text-[10px] font-black text-[#8C8C8C] dark:text-gray-400 uppercase tracking-[0.4em] border-b border-lux-border/10"><th className="px-10 py-8">Membro da Rede</th><th className="px-10 py-8">Função Executiva</th><th className="px-10 py-8">Quota (Tokens)</th><th className="px-10 py-8">Logins</th><th className="px-10 py-8 text-right">Controle</th></tr></thead>
                        <tbody className="divide-y divide-lux-border/10">
                          {(usersQuotas || []).map((u: any, idx: number) => (
                            <tr key={u.user_id} className="hover:bg-white dark:hover:bg-white/5 transition-all group duration-300">
                              <td className="px-10 py-8"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white flex items-center justify-center rounded-2xl font-black text-xs border border-white/10 group-hover:scale-110 transition-transform">{u.email.substring(0, 2).toUpperCase()}</div><div className="flex flex-col"><span className="text-sm font-bold text-[#1A1A1A] dark:text-white">{u.email}</span><span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">Status: Ativo</span></div></div></td>
                              <td className="px-10 py-8"><select value={u.role} onChange={(e) => { const newList = [...usersQuotas]; newList[idx].role = e.target.value; setUsersQuotas(newList); }} className="bg-lux-bg dark:bg-white/10 border border-lux-border/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] dark:text-white focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"><option value="ADMIN">Administrador</option><option value="ANALYST">Analista Sênior</option><option value="VIEWER">Visualizador Executivo</option></select></td>
                              <td className="px-10 py-8">
                                <div className="flex items-center gap-1 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                                  <span>{(u.consumed_tokens / 1000).toFixed(0)}k / </span>
                                  <input 
                                    type="number" 
                                    value={(u.max_limit / 1000).toFixed(0)} 
                                    onChange={(e) => { const newList = [...usersQuotas]; newList[idx].max_limit = parseInt(e.target.value) * 1000; setUsersQuotas(newList); }}
                                    className="w-12 bg-transparent border-b border-[#D4AF37]/30 text-center focus:border-[#D4AF37] outline-none"
                                  />
                                  <span>k</span>
                                </div>
                              </td>
                              <td className="px-10 py-8">
                                <div className="flex items-center gap-1 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">
                                  <span>{u.total_logins} / </span>
                                  <input 
                                    type="number" 
                                    value={u.max_logins} 
                                    onChange={(e) => { const newList = [...usersQuotas]; newList[idx].max_logins = parseInt(e.target.value); setUsersQuotas(newList); }}
                                    className="w-10 bg-transparent border-b border-[#8C8C8C]/30 text-center focus:border-[#1A1A1A] outline-none"
                                  />
                                </div>
                              </td>
                              <td className="px-10 py-8 text-right flex items-center justify-end gap-2">
                                <button 
                                  onClick={async () => { 
                                    setSaving(true);
                                    try {
                                      await handleUpdateRole(u.user_id, u.role);
                                      await updateQuotaLimit(u.user_id, u.max_limit, u.max_logins);
                                      setSuccess(true);
                                      setTimeout(() => setSuccess(false), 2000);
                                    } finally {
                                      setSaving(false);
                                    }
                                  }} 
                                  className="p-3 bg-[#D4AF37] text-black rounded-2xl shadow-xl hover:scale-125 transition-all flex items-center justify-center border-2 border-black/10"
                                  title="ATUALIZAR DADOS"
                                >
                                  <RefreshCw size={20} className={saving ? "animate-spin" : "scale-110"} strokeWidth={3} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.user_id, u.email)} 
                                  className="p-3 text-[#8C8C8C] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                  title="Revogar Acesso"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                       </tbody>
                     </table>
                   </div>
                </div>
             </div>
          ) : activeTab === "COSTS" ? (
            <div className="lg:col-span-12 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                   <div className="group relative bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] backdrop-blur-md overflow-hidden hover:scale-105 transition-all duration-500"><div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={80} /></div><div className="flex items-center gap-4 mb-6"><div className="p-3 bg-gradient-to-br from-[#FDF9F0] to-[#F1E9DB] dark:from-white/5 dark:to-white/10 text-[#D4AF37] rounded-2xl shadow-sm"><DollarSign size={24} /></div><span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#8C8C8C] dark:text-gray-400">Gasto Mensal</span></div><div className="text-4xl font-serif font-black text-[#1A1A1A] dark:text-white">$ {costsHistory.reduce((acc, curr) => acc + curr.cost_usd, 0).toFixed(2)}</div></div>
                   <div className="group relative bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] backdrop-blur-md overflow-hidden hover:scale-105 transition-all duration-500"><div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Cpu size={80} /></div><div className="flex items-center gap-4 mb-6"><div className="p-3 bg-[#1A1A1A] dark:bg-white/10 text-[#D4AF37] rounded-2xl shadow-lg"><Zap size={24} /></div><span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#8C8C8C] dark:text-gray-400">Throughput</span></div><div className="text-4xl font-serif font-black text-[#1A1A1A] dark:text-white">{(costsHistory.reduce((acc, curr) => acc + curr.tokens, 0) / 1000).toFixed(1)}k <span className="text-xs font-sans opacity-40 font-medium">tokens</span></div></div>
                   <div className="group relative bg-white dark:bg-[#1A1A1A]/40 border border-lux-border/30 dark:border-white/5 p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] backdrop-blur-md overflow-hidden hover:scale-105 transition-all duration-500"><div className="flex items-center gap-4 mb-6"><div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl shadow-sm animate-pulse"><ShieldCheck size={24} /></div><span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#8C8C8C] dark:text-gray-400">SLA Compliance</span></div><div className="text-2xl font-black text-emerald-500 uppercase tracking-tighter italic">ACTIVE CONTROL</div></div>
                   <div className="group relative bg-[#D4AF37] p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(212,175,55,0.2)] overflow-hidden hover:scale-105 transition-all duration-500 border border-white/20"><div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" /><div className="flex items-center gap-4 mb-6 relative z-10"><div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-sm"><TrendingUp size={24} /></div><span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/80">Eficiência (1k)</span></div><div className="text-4xl font-serif font-black text-[#1A1A1A] relative z-10 tracking-tight">$ 0.042</div></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="bg-white border border-[#F1E9DB] p-8 rounded-[3rem] shadow-sm h-[450px]"><div className="flex items-center justify-between mb-8"><div><h3 className="text-lg font-black text-[#1A1A1A]">Evolução de Consumo</h3><p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-[0.1em]">Gastos diários em USD</p></div></div><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={costsHistory}><defs><linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/><stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1E9DB" opacity={0.5} /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#8C8C8C'}} /><YAxis hide /><Tooltip contentStyle={{backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff'}} itemStyle={{color: '#D4AF37', fontWeight: 900, fontSize: '12px'}} /><Area type="monotone" dataKey="cost_usd" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" /></AreaChart></ResponsiveContainer></div></div>
                   <div className="bg-white border border-[#F1E9DB] p-8 rounded-[3rem] shadow-sm h-[450px]"><h3 className="text-lg font-black text-[#1A1A1A] mb-2">Custos por Domínio</h3><p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-[0.1em] mb-8">Consumo acumulado por projeto</p><div className="space-y-6 overflow-y-auto max-h-[300px] custom-scrollbar pr-4">{(costsSummary?.by_project || []).map((proj: any) => (<div key={proj.project_id} className="flex flex-col gap-2 group"><div className="flex items-center justify-between font-black text-[11px] uppercase tracking-tighter"><span className="text-[#1A1A1A]">{proj.name}</span><span className="text-[#D4AF37]">$ {proj.total_cost_usd.toFixed(2)}</span></div><div className="w-full h-1.5 bg-[#F9F9F9] rounded-full overflow-hidden"><div className="h-full bg-[#1A1A1A] rounded-full transition-all duration-1000 group-hover:bg-[#D4AF37]" style={{ width: `${Math.min((proj.total_cost_usd / (costsHistory.reduce((acc, curr) => acc + curr.cost_usd, 0) || 1) * 100), 100)}%` }} /></div></div>))}</div></div>
                </div>
                <section className="bg-[#1A1A1A] text-white p-12 rounded-[5rem] shadow-2xl relative overflow-hidden group"><div className="flex flex-col lg:flex-row gap-16 relative z-10"><div className="lg:w-1/3"><div className="p-4 bg-white/10 w-fit rounded-3xl mb-8"><Coins size={32} className="text-[#D4AF37]" /></div><h2 className="text-4xl font-serif font-black tracking-tight mb-4">Simulador de<br/><span className="text-[#D4AF37]">Multimodelo</span></h2><p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">Descubra quanto seu consumo atual custaria se os dashboards fossem materializados em outros provedores da LLM.</p></div><div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">{[ { id: "AMAZON_NOVA_PRO", name: "Amazon Nova Pro", in: 0.8, out: 3.2, recommended: true }, { id: "CLAUDE_3_5", name: "Claude 3.5 Sonnet", in: 3.0, out: 15.0 }, { id: "LLAMA_3_3", name: "Meta Llama 3.3 (70B)", in: 0.72, out: 0.72 }, { id: "CLAUDE_3_HAIKU", name: "Claude 3 Haiku", in: 0.25, out: 1.25 } ].map((m) => { const totalTokens = costsHistory.reduce((acc, curr) => acc + curr.tokens, 0); const estCost = (totalTokens * 0.7 / 1000000 * m.in) + (totalTokens * 0.3 / 1000000 * m.out); return ( <div key={m.id} className={`p-8 rounded-[2.5rem] border-2 transition-all group/card ${m.recommended ? "bg-[#D4AF37] border-white/20 text-[#1A1A1A]" : "bg-white/5 border-white/5 hover:border-white/20"}`}><h4 className="text-lg font-black tracking-tight mb-2 uppercase">{m.name}</h4><div className="text-4xl font-serif font-black mb-8">$ {estCost.toFixed(2)}</div><div className="grid grid-cols-2 gap-4"><div className={`p-4 rounded-2xl ${m.recommended ? "bg-[#1A1A1A]/10" : "bg-white/5"}`}><div className="text-xs font-black uppercase opacity-60">Input</div><div className="text-lg font-black">$ {m.in}</div></div><div className={`p-4 rounded-2xl ${m.recommended ? "bg-[#1A1A1A]/10" : "bg-white/5"}`}><div className="text-xs font-black uppercase opacity-60">Output</div><div className="text-lg font-black">$ {m.out}</div></div></div></div> ); })}</div></div></section>
                <section className="bg-red-50/50 border-2 border-dashed border-red-100 p-12 rounded-[5rem] flex flex-col md:flex-row items-center justify-between gap-10"><div className="max-w-2xl text-center md:text-left"><h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] mb-4">Higiene de Dados & Manutenção</h2><p className="text-sm text-[#8C8C8C] leading-relaxed">A <span className="text-red-600 font-black uppercase tracking-widest text-[10px]">Limpeza Profunda</span> remove datasets obsoletos e rastros de execução, resetando o cache analítico sem afetar usuários ou prompts centrais.</p></div><button onClick={fetchPurgeStats} disabled={cleaning || !canEdit} className="group flex flex-col items-center gap-4 bg-white p-10 rounded-[4rem] border border-red-100 hover:border-red-500 hover:shadow-2xl transition-all disabled:opacity-50"><div className={`p-6 rounded-full ${cleaning ? 'bg-gray-100 animate-spin' : 'bg-red-500 text-white shadow-xl shadow-red-500/20 group-hover:scale-110'} transition-all`}><Trash2 size={32} /></div><span className="text-[10px] font-black uppercase tracking-widest text-red-600">Purgar Cache Analítico</span></button></section>
                {showPurgeModal && purgeStats && (<div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in"><div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl border border-red-100 animate-in zoom-in-95"><div className="flex items-center gap-4 mb-8 text-red-600"><div className="p-4 bg-red-50 rounded-2xl"><Trash2 size={32} /></div><div><h3 className="text-2xl font-black tracking-tight">Confirmar Faxina</h3><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Operação Irreversível</p></div></div><div className="space-y-6 mb-10"><p className="text-sm text-gray-500 leading-relaxed">A análise técnica identificou os seguintes volumes para descarte imediato:</p><div className="grid grid-cols-2 gap-4"><div className="bg-[#F9F9F9] p-6 rounded-2xl"><span className="text-[9px] font-black uppercase text-[#8C8C8C] block mb-1">Datasets</span><span className="text-2xl font-black text-[#1A1A1A]">{purgeStats.datasets_to_delete}</span></div><div className="bg-[#F9F9F9] p-6 rounded-2xl"><span className="text-[9px] font-black uppercase text-[#8C8C8C] block mb-1">Logs de Trace</span><span className="text-2xl font-black text-[#1A1A1A]">{purgeStats.traces_to_delete}</span></div></div>{purgeStats.period_start && (<div className="p-4 bg-red-50/50 rounded-xl border border-red-100 text-[10px] font-black text-red-600 uppercase tracking-widest text-center">Período: {purgeStats.period_start} até {purgeStats.period_end}</div>)}<p className="text-[11px] font-medium text-gray-400 italic">Nota: Projetos, Usuários e Prompts Mestres não sofrerão alteração.</p></div><div className="flex items-center gap-4"><button onClick={() => setShowPurgeModal(false)} className="flex-1 py-5 bg-gray-50 text-gray-400 font-black text-[10px] uppercase rounded-2xl hover:bg-gray-100 transition-all">Abortar</button><button onClick={handlePurgeCache} className="flex-[2] py-5 bg-red-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-red-700 hover:scale-[1.02] transition-all shadow-xl shadow-red-500/20">Confirmar Exclusão Total</button></div></div></div>)}
              </div>
            ) : null}
        </div>
      </div>
    </div>
  );
}
