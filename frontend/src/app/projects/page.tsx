"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderKanban, Plus, Clock, Search, Workflow, Loader2, Database, Trash2, User, Layers, FileText, AlertTriangle, X, Grid, List, ZoomIn, ZoomOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getBackendJsonHeaders } from "@/lib/backendAuth";
import { useAuth } from "@/contexts/AuthContext";
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [zoomLevel, setZoomLevel] = useState(1);
  const { getRole, user } = useAuth();

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

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectToDelete.id}/`, {
        method: "DELETE",
        headers: getBackendJsonHeaders()
      });

      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        setProjectToDelete(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Erro ao excluir projeto. Verifique suas permissões.");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Falha técnica ao tentar excluir o projeto.");
    } finally {
      setIsDeleting(false);
    }
  };

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
          <h1 className="text-3xl font-serif font-black text-lux-text tracking-tight transition-colors">Portfólio de Relatórios Corporativos</h1>
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

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-[#FDF9F0] p-1 rounded-xl border border-[#D4AF37]/20">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#1A1A1A] text-[#D4AF37] shadow-md' : 'text-[#8C8C8C] hover:text-[#1A1A1A]'}`}
              title="Visualização em Grid"
            >
              <Grid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#1A1A1A] text-[#D4AF37] shadow-md' : 'text-[#8C8C8C] hover:text-[#1A1A1A]'}`}
              title="Visualização em Lista"
            >
              <List size={16} />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4 px-6 py-2 bg-[#FDF9F0] rounded-2xl border border-[#D4AF37]/20">
             <ZoomOut size={14} className="text-[#8C8C8C]" />
             <input 
               type="range" 
               min="0.7" 
               max="1.3" 
               step="0.05"
               value={zoomLevel}
               onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
               className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A1A1A]"
             />
             <ZoomIn size={14} className="text-[#8C8C8C]" />
             <div className="ml-2 px-2 py-1 bg-white border border-[#F1E9DB] rounded-lg text-[9px] font-black text-[#1A1A1A] min-w-[45px] text-center">
               {Math.round(zoomLevel * 100)}%
             </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-lux-muted">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-black text-[10px] uppercase tracking-widest">Carregando catálogo de projetos...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white border border-[#F1E9DB] p-20 text-center rounded-[3rem] shadow-sm">
          <FolderKanban className="mx-auto text-[#D4AF37]/30 mb-6" size={64} />
          <h3 className="text-xl font-black text-[#1A1A1A] mb-2 uppercase tracking-tighter">Nenhum projeto encontrado</h3>
          <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest mb-8">Comece criando o primeiro projeto de inteligência do seu domínio.</p>
          {!isVisualizador && (
            <Link href="/projects/new" className="px-8 py-4 bg-[#1A1A1A] text-white font-black text-[10px] uppercase rounded-2xl hover:scale-105 transition-all shadow-xl">
              Criar Novo Projeto →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-16">
          {domainOrder.map((domain) => (
            <section key={domain} className="space-y-8">
              <div className="flex items-center gap-5 group/section">
                <div className="w-1.5 h-8 bg-gradient-to-b from-[#D4AF37] to-transparent rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all group-hover/section:shadow-[0_0_20px_rgba(212,175,55,0.5)]" />
                <h2 className="text-xl font-serif font-black text-[#1A1A1A] tracking-[0.25em] uppercase transition-all group-hover/section:translate-x-1">
                  {domain}
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D4AF37]/40 to-transparent" />
                <span className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-[0.2em] bg-white/40 px-4 py-1.5 rounded-full border border-[#D4AF37]/20 shadow-sm backdrop-blur-sm">
                  {groupedProjects[domain].length} {groupedProjects[domain].length === 1 ? 'Relatório' : 'Relatórios'}
                </span>
              </div>

              <div 
                className={viewMode === 'grid' ? "grid gap-8" : "bg-white border border-[#F1E9DB] rounded-[3rem] overflow-hidden divide-y divide-[#F1E9DB] shadow-sm"}
                style={viewMode === 'grid' ? { gridTemplateColumns: `repeat(auto-fill, minmax(calc(320px * ${zoomLevel}), 1fr))` } : {}}
              >
                {groupedProjects[domain].map((p) => {
                  const isBlueprint = p.status === "BLUEPRINT";
                  const canAccess = !isVisualizador || isBlueprint;
                  const targetHref = isBlueprint 
                    ? `/dashboard/generate?project_id=${p.id}` 
                    : (isVisualizador ? "#" : `/projects/${p.id}/sources`);

                  if (viewMode === 'list') {
                    return (
                      <ProjectListItem 
                        key={p.id} 
                        project={p} 
                        targetHref={targetHref} 
                        canAccess={canAccess} 
                        currentRole={currentRole} 
                        userId={user?.id}
                        onDelete={(proj: any) => setProjectToDelete(proj)}
                        zoomLevel={zoomLevel}
                      />
                    );
                  }

                  return (
                    <Link href={targetHref} key={p.id} className={!canAccess ? "cursor-not-allowed opacity-60 grayscale scale-95" : ""}>
                      <motion.div 
                        whileHover={{ y: -10, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`bg-white border border-[#F1E9DB] rounded-[3rem] hover:border-[#D4AF37] hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden flex flex-col`}
                        style={{ 
                          padding: `calc(2rem * ${zoomLevel})`,
                          fontSize: `calc(1rem * ${zoomLevel})` 
                        }}
                      >
                        <div className="flex justify-between items-start mb-8">
                          <div className={`p-4 rounded-2xl ${isBlueprint ? 'bg-[#1A1A1A] text-[#D4AF37]' : 'bg-[#F9F9F9] text-[#8C8C8C]'} shadow-sm group-hover:scale-110 transition-transform`}>
                            <FolderKanban size={Math.round(28 * zoomLevel)} />
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-3">
                              {isBlueprint ? (
                                <span className="text-[9px] font-black px-4 py-2 rounded-full bg-blue-600 text-white border border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)] uppercase tracking-widest">
                                  CERTIFIED BLUEPRINT
                                </span>
                              ) : (
                                <span className="text-[9px] font-black px-4 py-2 rounded-full border border-[#D4AF37]/30 bg-[#FDF9F0] text-[#D4AF37] uppercase tracking-widest">
                                  RASCUNHO MESH
                                </span>
                              )}

                              {(currentRole === "ADMIN" || p.created_by === user?.id) && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setProjectToDelete(p);
                                  }}
                                  className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  title="Excluir Ativo"
                                >
                                  <Trash2 size={Math.round(18 * zoomLevel)} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <h3 className="text-2xl font-black text-[#1A1A1A] mb-2 font-serif tracking-tighter group-hover:text-[#D4AF37] transition-colors leading-tight">
                            {p.name}
                          </h3>
                          <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FDF9F0] border border-[#D4AF37]/30 rounded-lg">
                               <Layers size={Math.round(10 * zoomLevel)} className="text-[#D4AF37]" />
                               <span className="font-black text-[#D4AF37] uppercase tracking-[0.1em]" style={{ fontSize: `calc(0.6rem * ${zoomLevel})` }}>
                                 {p.domain_name} {p.subdomain_name ? `• ${p.subdomain_name}` : ""}
                               </span>
                             </div>
                          </div>
                        </div>

                        <div className="space-y-4 mb-8 bg-[#F9F9F9]/50 p-6 rounded-3xl border border-[#F1E9DB]/50 group-hover:bg-white transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[#F1E9DB]">
                                 <User size={Math.round(14 * zoomLevel)} className="text-[#D4AF37]" />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[8px] font-black uppercase tracking-widest text-[#8C8C8C] mb-0.5">Responsável (Owner)</p>
                                 <p className="font-black text-[11px] text-[#1A1A1A] truncate">{p.created_by_name || "Sistema"}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[#F1E9DB]">
                                 <Database size={Math.round(14 * zoomLevel)} className="text-[#D4AF37]" />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[8px] font-black uppercase tracking-widest text-[#8C8C8C] mb-0.5">Origem dos Dados</p>
                                 <p className="font-black text-[11px] text-[#1A1A1A] truncate">
                                    {p.datasets_list && p.datasets_list.length > 0 ? p.datasets_list[0].name : "Aguardando Ingestão"}
                                 </p>
                              </div>
                           </div>
                        </div>
                        
                        <div className="mt-auto pt-6 border-t border-[#F1E9DB] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Workflow size={Math.round(14 * zoomLevel)} className="text-[#D4AF37]" />
                            <span className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">
                              {p.pending_datasets_count === 0 ? "Data-Ready" : `${p.pending_datasets_count} Pendente(s)`}
                            </span>
                          </div>
                          <span className="text-[#1A1A1A] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[10px] font-black uppercase tracking-widest">
                            {isBlueprint ? "Analisar Dashboard →" : "Configurar Ativo →"}
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

      {/* Modal de Confirmação de Exclusão Premium */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProjectToDelete(null)}
            className="absolute inset-0 bg-lux-text/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.25)] border border-[#F1E9DB] overflow-hidden"
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1A1A1A] font-serif">Excluir Relatório</h3>
                    <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Confirmação de Governança</p>
                  </div>
                </div>
                <button onClick={() => setProjectToDelete(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100">
                  <p className="text-sm text-[#1A1A1A] font-medium leading-relaxed">
                    Você está prestes a excluir o relatório <span className="font-black">"{projectToDelete.name}"</span>. 
                    Esta ação é irreversível no catálogo de ativos mesh.
                  </p>
                </div>

                {projectToDelete.datasets_list && projectToDelete.datasets_list.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest flex items-center gap-2">
                      <Database size={12} /> Fontes de Dados Atreladas:
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {projectToDelete.datasets_list.map((ds: any) => (
                        <div key={ds.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-[#CBB26A]/30 transition-all">
                          <div className="flex items-center gap-3">
                            <FileText size={14} className="text-gray-400 group-hover:text-[#CBB26A]" />
                            <span className="text-xs font-bold text-gray-700">{ds.name}</span>
                          </div>
                          <span className="text-[9px] font-black uppercase text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">{ds.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-10">
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 py-5 bg-[#F9F9F9] text-[#8C8C8C] font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="flex-1 py-5 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-700 hover:scale-[1.02] transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function ProjectListItem({ project, targetHref, canAccess, currentRole, userId, onDelete, zoomLevel }: any) {
  const isBlueprint = project.status === "BLUEPRINT";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4, backgroundColor: "rgba(203, 178, 106, 0.05)" }}
      className={`glass-panel !p-4 flex items-center gap-6 group border-l-4 ${isBlueprint ? 'border-l-blue-500' : 'border-l-lux-border/20'} hover:border-l-[#CBB26A] transition-all`}
      style={{ fontSize: `calc(1rem * ${zoomLevel})` }}
    >
      <Link href={targetHref} className={`flex-1 flex items-center gap-6 ${!canAccess ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <div className="w-10 h-10 rounded-lg bg-lux-bg border border-lux-border/20 flex items-center justify-center text-lux-text group-hover:bg-[#CBB26A] group-hover:text-lux-bg transition-colors shrink-0">
          <FolderKanban size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-lux-text truncate font-serif group-hover:text-[#CBB26A] transition-colors">
              {project.name}
            </h3>
            {isBlueprint && (
              <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 border border-blue-200 uppercase tracking-widest">
                Certified
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-[9px] text-lux-muted font-black uppercase tracking-wider">
              <Layers size={8} className="text-[#CBB26A]" />
              {project.subdomain_name || project.domain_name}
            </div>
            <span className="text-lux-border/30">|</span>
            <div className="flex items-center gap-1 text-[9px] text-lux-muted font-bold">
              <User size={8} className="text-[#CBB26A]" />
              {project.created_by_name || "Sistema"}
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-lux-muted" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none">Fonte principal</span>
              <span className="text-[11px] font-bold text-lux-text truncate max-w-[120px]">
                {project.datasets_list && project.datasets_list.length > 0 ? project.datasets_list[0].name : "Nenhuma"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Workflow size={14} className="text-lux-muted" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none">Status</span>
              <span className="text-[11px] font-bold text-lux-text">
                {project.pending_datasets_count === 0 ? "Pronto" : `${project.pending_datasets_count} pendentes`}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        {(currentRole === "ADMIN" || project.created_by === userId) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(project);
            }}
            className="p-2 text-lux-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={16} />
          </button>
        )}
        <Link href={targetHref} className="p-2 text-lux-muted group-hover:text-[#CBB26A] transition-all">
          <ChevronRight size={20} />
        </Link>
      </div>
    </motion.div>
  );
}
