"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderKanban, Plus, Clock, Search, Workflow, Loader2, Database } from "lucide-react";
import Link from "next/link";
import { getBackendJsonHeaders } from "@/lib/backendAuth";
import { useAuth } from "@/contexts/AuthContext";
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const { getRole } = useAuth();

  const currentRole = getRole();
  const isVisualizador = currentRole === "VIEWER";

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/v1/projects/", {
          headers: getBackendJsonHeaders()
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        setProjects(list);
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchDomains = async () => {
      try {
        const res = await fetch("/api/v1/projects/domains/", {
          headers: getBackendJsonHeaders()
        });
        const data = await res.json();
        setDomains(Array.isArray(data) ? data : (data.results || []));
      } catch (error) {
        console.error("Erro ao carregar domínios:", error);
      }
    };

    fetchProjects();
    fetchDomains();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.status === "BLUEPRINT" && 
    (p.blueprint_widgets && p.blueprint_widgets.length > 0) &&
    (selectedDomain === "all" || p.domain === selectedDomain) &&
    (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.domain_name && p.domain_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const groupedProjects = filteredProjects.reduce((acc: Record<string, any[]>, p) => {
    const domain = p.domain_name || "Geral";
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(p);
    return acc;
  }, {});

  const domainOrder = Object.keys(groupedProjects).sort((a,b) => {
    if (a === "Geral") return 1;
    if (b === "Geral") return -1;
    return a.localeCompare(b);
  });

  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-serif font-black text-lux-text tracking-tight transition-colors">Portfólio de Dados Corporativos</h1>
          <p className="text-lux-muted text-sm mt-1">Selecione um domínio do catálogo para iniciar sua análise executiva.</p>
        </div>
        {!isVisualizador && (
          <Link href="/projects/new" className="flex items-center gap-2 bg-lux-text text-lux-bg px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-transform">
            <Plus size={18} /> Cadastrar Um Projeto Novo
          </Link>
        )}
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-lux-muted/70" size={18} />
          <input 
            type="text" 
            placeholder="Buscar projetos..." 
            className="glass-input !pl-16 h-12 w-full text-lg shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative w-full md:w-64">
          <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-lux-muted/70" size={18} />
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="glass-input !pl-16 h-12 w-full text-md shadow-sm appearance-none cursor-pointer"
          >
            <option value="all">Todos os Domínios</option>
            {domains.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-lux-muted">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-medium">Carregando catálogo de projetos...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-panel p-20 text-center border-dashed border-2">
          <FolderKanban className="mx-auto text-lux-muted/30 mb-6" size={64} />
          <h3 className="text-xl font-bold text-lux-text mb-2">Nenhum projeto encontrado</h3>
          <p className="text-lux-muted mb-8">Comece criando o primeiro projeto de inteligência do seu domínio.</p>
          {!isVisualizador && (
            <Link href="/projects/new" className="text-lux-text font-bold border-b-2 border-lux-text pb-1 hover:opacity-70 transition-opacity">
              Criar Novo Projeto →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-16">
          {domainOrder.map((domain) => (
            <section key={domain} className="space-y-8">
              <div className="flex items-center gap-5 group/section">
                <div className="w-1.5 h-8 bg-gradient-to-b from-[#CBB26A] to-transparent rounded-full shadow-[0_0_15px_rgba(203,178,106,0.3)] transition-all group-hover/section:shadow-[0_0_20px_rgba(203,178,106,0.5)]" />
                <h2 className="text-xl font-serif font-black text-[#1A1A1A] tracking-[0.25em] uppercase transition-all group-hover/section:translate-x-1">
                  {domain}
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#CBB26A]/40 to-transparent" />
                <span className="text-[10px] font-black text-lux-muted uppercase tracking-[0.2em] bg-white/40 dark:bg-lux-bg/40 px-4 py-1.5 rounded-full border border-[#CBB26A]/20 shadow-sm backdrop-blur-sm">
                  {groupedProjects[domain].length} {groupedProjects[domain].length === 1 ? 'Data Asset' : 'Data Assets'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedProjects[domain].map((p) => {
                  const isBlueprint = p.status === "BLUEPRINT";
                  
                  // Visualizadores só acessam Blueprints (Relatórios prontos)
                  const canAccess = !isVisualizador || isBlueprint;
                  
                  const targetHref = isBlueprint 
                    ? `/dashboard/generate?project_id=${p.id}` 
                    : (isVisualizador ? "#" : `/projects/${p.id}/sources`);

                  return (
                    <Link href={targetHref} key={p.id} className={!canAccess ? "cursor-not-allowed opacity-60 grayscale scale-95" : ""}>
                      <motion.div 
                        whileHover={{ y: -6, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`glass-panel p-8 cursor-pointer border-l-4 border-lux-border/20 hover:border-[#CBB26A] hover:shadow-xl transition-all h-full flex flex-col group bg-lux-bg/40`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-xl bg-lux-bg/80 border border-lux-border/40 flex items-center justify-center text-lux-text shadow-sm group-hover:bg-[#CBB26A] group-hover:text-lux-bg transition-colors">
                            <FolderKanban size={24} />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {isBlueprint ? (
                              <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-blue-600 text-white border border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.3)] uppercase tracking-widest animate-in fade-in zoom-in">
                                Certified Blueprint
                              </span>
                            ) : (
                              <span className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#CBB26A]/30 bg-[#CBB26A]/5 text-[#CBB26A]">
                                Rascunho
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-lux-text mb-2 font-serif group-hover:text-[#CBB26A] transition-colors">{p.name}</h3>
                        
                        <div className="mt-auto border-t border-lux-border/40 pt-5 flex items-center justify-between">
                          <span className="text-sm text-lux-muted font-medium flex items-center gap-2">
                            <Workflow size={16} /> {p.pending_datasets_count === 0 ? "Pronto" : `${p.pending_datasets_count || 0} pendentes`}
                          </span>
                          <span className="text-lux-text opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold tracking-wide">
                            {isBlueprint ? "Analisar →" : "Configurar →"}
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
}
