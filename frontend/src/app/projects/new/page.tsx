"use client";

import { motion } from "framer-motion";
import { Building2, ArrowLeft, Target, Briefcase, FileText, ShieldCheck, Zap, Sparkles, Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectHeaderStandard } from "@/components/project/ProjectHeaderStandard";
import { ProjectPhases } from "@/components/project/ProjectPhases";
import { AnimatePresence } from "framer-motion";
import { getBackendJsonHeaders } from "@/lib/backendAuth";

const DRAFT_KEY = "agent_bi_project_draft";

type ProjectDraft = {
  projectId: string;
  dashboard: string;
  dataDomain: string;
  domain_id?: string | null;
  domainDataOwner: string;
  confidentiality: string;
  crawlFrequency: string;
  objective: string;
  specialist_prompt_id?: string | null;
};

export default function NewProjectWorkspace() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectDraft>({
    projectId: "",
    dashboard: "",
    dataDomain: "",
    domain_id: null,
    domainDataOwner: "",
    confidentiality: "",
    crawlFrequency: "",
    objective: "",
    specialist_prompt_id: null,
  });

  const [specialists, setSpecialists] = useState<any[]>([]);
  const [fetchingSpecialists, setFetchingSpecialists] = useState(false);
  const [domains, setDomains] = useState<any[]>([]);
  const [fetchingDomains, setFetchingDomains] = useState(false);
  const [showAgentPrompt, setShowAgentPrompt] = useState(false);
  
  const isFormValid = !!(
    form.dashboard.trim() && 
    form.dataDomain.trim() &&
    form.domain_id && 
    form.domainDataOwner.trim() && 
    form.confidentiality && 
    form.specialist_prompt_id
  );

  useEffect(() => {
    // SEMPRE LIMPAR ao entrar na tela de novo projeto para evitar confusão com rascunhos anteriores
    // solicitado pelo usuário: "os campos deveriam estar vazios"
    sessionStorage.removeItem(DRAFT_KEY);
    
    // Default Owner
    let loggedUser = "Usuário Corporativo";
    try {
      const stored = localStorage.getItem("agent_bi_user") || sessionStorage.getItem("agent_bi_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        loggedUser = parsed.name || parsed.email || loggedUser;
      }
    } catch(e) {}

    setForm(f => ({ ...f, domainDataOwner: "marcelo.maccaferri@nttdata.com" }));
  }, []);

  useEffect(() => {
    async function fetchSpecs() {
      try {
        setFetchingSpecialists(true);
        // Usando headers de tenant padronizados
        const res = await fetch("/api/v1/governance/prompt-templates/?t=" + Date.now(), {
          headers: getBackendJsonHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          const results = Array.isArray(data) ? data : (data.results || []);
          // Filtro flexível para especialistas
          setSpecialists(results.filter((s: any) => 
            s.category?.toUpperCase().includes("SPECIALIST") || s.category?.includes("Especialista")
          ));
        }
      } catch (err) {
        console.error("Erro ao buscar especialistas:", err);
      } finally {
        setFetchingSpecialists(false);
      }
    }

    async function fetchDomains() {
      try {
        setFetchingDomains(true);
        const res = await fetch("/api/v1/projects/domains/?t=" + Date.now(), {
          headers: getBackendJsonHeaders()
        });
        
        console.log("📡 [DOMAINS FETCH] Status:", res.status);
        
        if (res.ok) {
          const data = await res.json();
          const results = Array.isArray(data) ? data : (data.results || []);
          console.log("✅ [DOMAINS FETCH] Sucesso! Itens:", results.length);
          setDomains(results);
        } else {
          const text = await res.text();
          console.error("❌ [DOMAINS FETCH] Erro:", res.status, text.substring(0, 200));
        }
      } catch (err) {
        console.error("Erro ao buscar domínios:", err);
      } finally {
        setFetchingDomains(false);
      }
    }

    fetchSpecs();
    fetchDomains();
  }, []);

  const persistDraft = (draft: ProjectDraft) => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    sessionStorage.setItem("agent_bi_current_project_id", draft.projectId);
  };

  const updateField = <K extends keyof ProjectDraft>(field: K, value: ProjectDraft[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid) {
      setSubmitError("Por favor, preencha todos os campos obrigatórios da governança antes de prosseguir.");
      return;
    }
    console.log("🔵 Iniciando persistencia do projeto no backend...");
    setLoading(true);
    setSubmitError(null);

    try {
      const isUpdate = !!form.projectId;
      const url = isUpdate 
        ? `/api/v1/projects/${form.projectId}/`
        : "/api/v1/projects/";
      
      const response = await fetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: getBackendJsonHeaders(),
        body: JSON.stringify({
          dashboard: form.dashboard,
          dataDomain: form.dataDomain,
          domainDataOwner: form.domainDataOwner,
          confidentiality: form.confidentiality,
          crawlFrequency: form.crawlFrequency,
          objective: form.objective,
          specialist_prompt_id: form.specialist_prompt_id || null,
          domain_id: form.domain_id || null,
        }),
      });

      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail =
          (typeof responseBody?.detail === "string" && responseBody.detail) ||
          "Falha ao salvar projeto no backend.";
        throw new Error(detail);
      }

      const backendProjectId = (responseBody?.id || form.projectId) as string | undefined;
      if (!backendProjectId) {
        throw new Error("Backend não retornou o UUID do projeto.");
      }

      const draftWithId = { ...form, projectId: backendProjectId };
      persistDraft(draftWithId);
      sessionStorage.setItem("agent_bi_last_project_create_response", JSON.stringify(responseBody, null, 2));
      router.push(`/projects/${backendProjectId}/sources`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erro inesperado ao salvar projeto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="max-w-[1600px] mx-auto pt-6 pb-10 px-4">
      <ProjectHeaderStandard 
        projectId={"PRJ-TEMP"} 
        step={1} 
        title="Governança Corporativa"
        prevHref="/projects" 
        prevLabel="Cancelar" 
        nextLabel="Avançar para Ingestão AWS"
        onNext={() => isFormValid && handleSave()}
        nextDisabled={loading || !isFormValid}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start mt-6">
        {/* Painel de Configuracao (Esq) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="mb-4">
            <p className="text-lux-muted dark:text-lux-muted/80 leading-relaxed text-md font-light italic">
              Defina as diretrizes estratégicas e a Persona Especialista para este projeto. Estas definições orientam a inteligência estratégica e garantem o isolamento seguro do domínio no ambiente AWS.
            </p>
          </div>

          <form onSubmit={handleSave} className="glass-panel p-8 bg-white/50 dark:bg-white/5 border-lux-border/30 dark:border-lux-border/50 shadow-2xl relative overflow-hidden transition-all hover:border-lux-border/80 rounded-[3rem]">
            <div className="space-y-6 relative z-10 flex flex-col">
          {submitError ? (
            <div className="rounded-xl border border-red-400/40 bg-red-100/70 px-4 py-3 text-sm font-semibold text-red-900">
              {submitError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-lux-text mb-2 flex items-center gap-2">
                <FileText size={14} className="text-lux-muted" /> Dashboard
              </label>
              <input
                required
                type="text"
                value={form.dashboard}
                onChange={(e) => updateField("dashboard", e.target.value)}
                placeholder="Nome do dashboard..."
                className="glass-input w-full p-3 text-sm border border-lux-border/60 bg-lux-card/50 hover:bg-lux-bg transition-colors shadow-inner"
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-xs font-bold text-lux-text mb-2 flex items-center gap-2">
                <Briefcase size={14} className="text-lux-muted" /> Dominio de Dados
              </label>
              <select
                required
                value={form.domain_id || ""}
                onChange={(e) => {
                   const d = domains.find(dom => dom.id === e.target.value);
                   setForm(prev => ({ 
                     ...prev, 
                     domain_id: e.target.value || null,
                     dataDomain: d ? d.name : "" 
                   }));
                }}
                className="glass-input w-full p-3 text-sm border border-lux-border/60 bg-lux-card/50 text-lux-text hover:bg-lux-bg transition-colors shadow-inner cursor-pointer appearance-none"
              >
                <option value="">{fetchingDomains ? "Buscando domínios..." : "Selecione o Área de Negócio..."}</option>
                {domains.length > 0 ? domains.map(d => (
                   <option key={d.id} value={d.id}>{d.name}</option>
                )) : (
                  <>
                    <option value="Mesa de Operacoes">Mesa de Operacoes</option>
                    <option value="Tesouraria Global">Tesouraria Global</option>
                  </>
                )}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="text-xs font-bold text-lux-text mb-2 flex items-center gap-2">
                <Building2 size={14} className="text-lux-muted" /> Domain Data Owner
              </label>
              <input
                required
                type="text"
                value={form.domainDataOwner}
                onChange={(e) => updateField("domainDataOwner", e.target.value)}
                placeholder="Ex: Gestor do dominio financeiro"
                className="glass-input w-full p-3 text-[11px] font-medium border border-lux-border/60 bg-lux-card/50 hover:bg-lux-bg transition-colors shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-lux-card/40 border border-lux-border/40 rounded-2xl relative shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-lux-accent/40 rounded-l-2xl" />

            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-lux-muted mb-2 flex items-center gap-2">
                Confidencialidade Corporativa
              </label>
              <select
                required
                value={form.confidentiality}
                onChange={(e) => updateField("confidentiality", e.target.value)}
                className="glass-input w-full p-2.5 font-bold text-xs border border-lux-border/60 bg-lux-bg text-lux-text hover:bg-lux-card transition-colors cursor-pointer appearance-none"
              >
                <option value="">Selecione...</option>
                <option>Uso Interno Geral</option>
                <option>Restrito Depto</option>
                <option>Confidencial</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-lux-muted flex items-center gap-2">
                Persona Cognitiva / Especialista de Dominio
              </label>
              <select
                required
                value={form.specialist_prompt_id || ""}
                onChange={(e) => updateField("specialist_prompt_id", e.target.value || null)}
                className="glass-input w-full p-2.5 font-bold text-xs border border-lux-border/60 bg-lux-bg text-lux-text hover:bg-lux-card transition-colors cursor-pointer appearance-none"
              >
                <option value="">Selecione o Especialista (Persona)...</option>
                {specialists.map(spec => (
                  <option key={spec.id} value={spec.id}>{spec.name}</option>
                ))}
              </select>
              
              {form.specialist_prompt_id && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-white border border-lux-border/30 rounded-2xl shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                      <ShieldCheck size={16} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest leading-none">Persona Corporativa</p>
                      <p className="text-xs text-lux-text font-bold">Capacidades do Especialista</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-xs text-lux-text/80 leading-relaxed font-medium italic">
                      {(() => {
                          const desc = specialists.find(s => s.id === form.specialist_prompt_id)?.description || "";
                          return (desc.toLowerCase() === "nan" || !desc) ? "Especialista analítico de domínio com foco em governança de dados e insights executivos." : desc;
                      })()}
                    </p>
                    
                    <div className="pt-4 border-t border-lux-border/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] text-lux-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <Zap size={10} /> Base de Conhecimento do Agente
                        </p>
                        <button type="button" onClick={() => setShowAgentPrompt(!showAgentPrompt)} className="text-[9px] text-lux-accent font-bold uppercase hover:underline transition-all">
                          {showAgentPrompt ? "- Recolher Prompt" : "+ Ver Prompt Raiz Exposto"}
                        </button>
                      </div>
                      
                      <AnimatePresence>
                        {showAgentPrompt && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="relative group/preview overflow-hidden bg-slate-50/50 rounded-xl border border-lux-border/10"
                          >
                              <div className="max-h-40 overflow-y-auto p-3 text-[11px] text-lux-text/70 font-mono leading-relaxed scrollbar-thin scrollbar-thumb-lux-border/20 scrollbar-track-transparent">
                                  {(() => {
                                      const content = specialists.find(s => s.id === form.specialist_prompt_id)?.content || "";
                                      if (content.toLowerCase() === "nan" || !content) return "Carregando instruções nativas...";
                                      return content;
                                  })()}
                              </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[9px] text-lux-muted/60 uppercase font-bold tracking-tighter">
                    <span>Verified Agent Identity</span>
                    <span>Auto-Generated Prompt Sync</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>


          </div>
        </form>
      </div>

      {/* Painel de Resumo (Dir) */}
      <div className="xl:col-span-4 h-full">
        <div className="bg-white/60 dark:bg-lux-card/40 border border-lux-border/20 dark:border-lux-border/40 p-8 h-full shadow-2xl flex flex-col rounded-[3.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <ShieldCheck size={120} />
          </div>

          <div className="flex items-center justify-between gap-3 mb-8 relative z-10">
            <h3 className="text-[10px] uppercase font-black text-lux-text dark:text-lux-accent tracking-[0.25em] flex items-center gap-3">
              <Target size={16} /> Resumo do Dominio
            </h3>
            <div className="p-2 bg-lux-accent/10 rounded-xl">
               <Sparkles className="text-lux-accent" size={16} />
            </div>
          </div>

          <div className="space-y-6 flex-1 relative z-10">
            <div className="p-5 bg-white dark:bg-white/5 border border-lux-border/20 dark:border-lux-border/60 rounded-[1.75rem] shadow-sm relative border-l-4 border-l-lux-accent">
               <p className="text-[9px] text-lux-muted font-bold uppercase tracking-widest mb-1">Impacto Analítico</p>
               <p className="text-sm font-black text-lux-text dark:text-lux-accent">
                 {form.dataDomain || "Selecione uma Área..."}
               </p>
               <div className="mt-4 pt-4 border-t border-lux-border/10">
                  <p className="text-[10px] leading-relaxed text-lux-muted italic">
                    Ao definir a área de negócio e a persona, o Agent-BI prepara o catálogo semântico da AWS Glue e ajusta os pesos cognitivos do LLM Bedrock.
                  </p>
               </div>
            </div>

            {form.specialist_prompt_id && (
              <div className="p-5 bg-lux-accent/5 border border-lux-accent/20 rounded-[1.75rem] shadow-sm relative border-l-4 border-l-lux-accent">
                <p className="text-[9px] text-lux-accent font-bold uppercase tracking-widest mb-1">Persona Cognitiva</p>
                <p className="text-sm font-black text-lux-text">
                  {specialists.find(s => s.id === form.specialist_prompt_id)?.name}
                </p>
                <div className="mt-3">
                  <p className="text-[10px] leading-relaxed text-lux-muted italic line-clamp-3">
                    {specialists.find(s => s.id === form.specialist_prompt_id)?.description || "Especialista analítico focado em governança."}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 bg-lux-accent/5 rounded-2xl border border-lux-border/10">
                  <p className="text-[8px] font-black uppercase text-lux-muted tracking-tighter">Segurança</p>
                  <p className="text-[11px] font-bold text-lux-text mt-1">{form.confidentiality || "Pendente"}</p>
               </div>
               <div className="p-4 bg-lux-accent/5 rounded-2xl border border-lux-border/10">
                  <p className="text-[8px] font-black uppercase text-lux-muted tracking-tighter">Frequência</p>
                  <p className="text-[11px] font-bold text-lux-text mt-1">{form.crawlFrequency || "Manual"}</p>
               </div>
            </div>

            <div className="p-4 bg-lux-accent/5 rounded-2xl border border-lux-border/10 flex items-center gap-3">
               <Info size={16} className="text-lux-accent" />
               <p className="text-[10px] text-lux-muted leading-relaxed font-medium">
                 Este rascunho é persistido localmente e na nuvem para garantir a rastreabilidade do projeto.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );
}
