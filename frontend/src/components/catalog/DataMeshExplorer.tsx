"use client";

import React, { useState, useEffect } from "react";
import { 
  Database, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Search, 
  Globe, 
  Shield, 
  Calendar,
  User,
  MoreHorizontal,
  FolderOpen,
  Filter,
  ArrowRight,
  Info,
  Layers,
  Link,
  Table,
  X,
  Zap,
  CheckCircle2,
  FileCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Dataset {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  owner_email: string;
  confidentiality: string;
  row_count: number;
  created_at: string;
  source_type?: string;
  description?: string;
  lineage?: string;
  schema_json?: {
    columns: Array<{ name: string; type: string; nullable?: boolean }>;
  };
}

interface Domain {
  id: string;
  name: string;
}

interface Subdomain {
  id: string;
  name: string;
  domain: string;
}

interface DataMeshExplorerProps {
  datasets: Dataset[];
  domains: Domain[];
  subdomains: Subdomain[];
  onSelect?: (dataset: Dataset) => void;
  compact?: boolean;
}

export default function DataMeshExplorer({ 
  datasets, 
  domains, 
  subdomains, 
  onSelect,
  compact = false 
}: DataMeshExplorerProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});
  const [viewingDataset, setViewingDataset] = useState<Dataset | null>(null);

  const toggleDomain = (id: string) => {
    setExpandedDomains(prev => ({ ...prev, [id]: !prev[id] }));
    setSelectedDomain(id);
    setSelectedSubdomain(null);
  };

  const filteredSubdomains = subdomains.filter(s => s.domain === selectedDomain);
  
  const filteredDatasets = datasets.filter(d => {
    const itemName = d.name || "";
    const itemOwner = d.owner_email || "";
    const searchTerm = search.toLowerCase();

    const matchesSearch = itemName.toLowerCase().includes(searchTerm) || 
                         itemOwner.toLowerCase().includes(searchTerm);
    const matchesDomain = selectedDomain ? d.domain === selectedDomain : true;
    const matchesSubdomain = selectedSubdomain ? d.subdomain === selectedSubdomain : true;
    return matchesSearch && matchesDomain && matchesSubdomain;
  });

  return (
    <div className={`flex flex-col lg:flex-row bg-white border border-[#F1E9DB] rounded-[3rem] overflow-hidden shadow-sm ${compact ? 'h-[500px]' : 'min-h-[700px]'}`}>
      
      {/* Sidebar: Hierarquia Tree */}
      <aside className="w-full lg:w-80 border-r border-[#F1E9DB] bg-[#FDF9F0]/20 flex flex-col">
        <div className="p-8 border-b border-[#F1E9DB]">
          <button 
            onClick={() => onSelect?.(null as any)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-6 hover:translate-x-1 transition-transform group"
          >
            <ArrowRight className="rotate-180" size={12} />
            Fechar Catálogo
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#1A1A1A] text-[#D4AF37] rounded-xl"><Database size={16} /></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A]">Arquitetura Mesh</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C8C]" size={14} />
            <input 
              type="text" 
              placeholder="Explorar domínios..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#F1E9DB] rounded-xl text-[10px] font-bold focus:border-[#D4AF37] outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-2">
          <button 
            onClick={() => { setSelectedDomain(null); setSelectedSubdomain(null); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${!selectedDomain ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-[#8C8C8C] hover:bg-white'}`}
          >
            <Globe size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Todos os Ativos</span>
          </button>

          <div className="pt-4 pb-2 text-[9px] font-black text-[#D4AF37] uppercase tracking-widest px-3 opacity-60">Domínios Master</div>
          
          {domains.map(domain => (
            <div key={domain.id} className="space-y-1">
              <button 
                onClick={() => toggleDomain(domain.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedDomain === domain.id ? 'bg-white border border-[#F1E9DB] text-[#1A1A1A]' : 'text-[#8C8C8C] hover:bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${selectedDomain === domain.id ? 'bg-[#1A1A1A] text-[#D4AF37]' : 'bg-[#F9F9F9]'}`}>
                    <FolderOpen size={12} />
                  </div>
                  <span className="text-[10px] font-black uppercase truncate">{domain.name}</span>
                </div>
                {expandedDomains[domain.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              <AnimatePresence>
                {expandedDomains[domain.id] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-4 space-y-1"
                  >
                    {subdomains.filter(s => s.domain === domain.id).map(sub => (
                      <button 
                        key={sub.id}
                        onClick={() => setSelectedSubdomain(sub.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${selectedSubdomain === sub.id ? 'text-[#D4AF37] font-black' : 'text-[#8C8C8C] hover:text-[#1A1A1A]'}`}
                      >
                        <div className="w-1 h-1 rounded-full bg-current" />
                        <span className="text-[10px] uppercase truncate">{sub.name}</span>
                      </button>
                    ))}
                    {subdomains.filter(s => s.domain === domain.id).length === 0 && (
                        <div className="text-[8px] font-medium text-[#8C8C8C] italic p-2">Nenhuma área cadastrada</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Area: Grid de Ativos */}
      <main className="flex-1 flex flex-col bg-white">
        <header className="p-8 border-b border-[#F1E9DB] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {selectedDomain && (
                <span className="text-[9px] font-black uppercase text-[#8C8C8C]">
                  {domains.find(d => d.id === selectedDomain)?.name}
                </span>
              )}
              {selectedSubdomain && (
                <>
                  <ChevronRight size={10} className="text-[#8C8C8C]" />
                  <span className="text-[9px] font-black uppercase text-[#D4AF37]">
                    {subdomains.find(s => s.id === selectedSubdomain)?.name}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter">
              {selectedSubdomain ? subdomains.find(s => s.id === selectedSubdomain)?.name : selectedDomain ? domains.find(d => d.id === selectedDomain)?.name : "Catálogo Global"}
            </h2>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F9F9F9] rounded-2xl border border-[#F1E9DB]">
            <span className="text-[10px] font-black text-[#8C8C8C] uppercase">{filteredDatasets.length} Ativos</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {(!selectedDomain && !search) ? (
            <div className="space-y-12">
               {domains.map(domain => {
                 const domainDatasets = datasets.filter(d => d.domain === domain.id);
                 if (domainDatasets.length === 0) return null;
                 
                 return (
                   <section key={domain.id} className="space-y-6">
                      <div className="flex items-center gap-4 border-b border-[#F1E9DB] pb-4">
                        <div className="p-3 bg-[#FDF9F0] text-[#D4AF37] rounded-2xl"><FolderOpen size={18} /></div>
                        <div>
                          <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest">{domain.name}</h3>
                          <p className="text-[9px] font-bold text-[#8C8C8C] uppercase">DADOS GOVERNADOS POR DOMÍNIO</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {domainDatasets.map(dataset => (
                          <DatasetCard 
                            key={dataset.id} 
                            dataset={dataset} 
                            domains={domains} 
                            subdomains={subdomains}
                            onSelect={onSelect} 
                            onViewColumns={setViewingDataset} 
                          />
                        ))}
                      </div>
                   </section>
                 )
               })}
            </div>
          ) : (selectedDomain && !selectedSubdomain && !search) ? (
            <div className="space-y-12">
               {subdomains.filter(s => s.domain === selectedDomain).map(sub => {
                 const subDatasets = filteredDatasets.filter(d => d.subdomain === sub.id);
                 if (subDatasets.length === 0) return null;

                 return (
                    <section key={sub.id} className="space-y-6">
                       <div className="flex items-center gap-3 border-b border-[#F1E9DB] pb-4">
                         <div className="p-2 bg-[#F9F9F9] text-[#1A1A1A] rounded-xl"><Layers size={14} /></div>
                         <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest">{sub.name}</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         {subDatasets.map(dataset => (
                           <DatasetCard 
                             key={dataset.id} 
                             dataset={dataset} 
                             domains={domains} 
                             subdomains={subdomains}
                             onSelect={onSelect} 
                             onViewColumns={setViewingDataset} 
                           />
                         ))}
                       </div>
                    </section>
                 )
               })}
               {/* Datasets sem subdomínio específico mas no domínio selecionado */}
               {filteredDatasets.filter(d => !d.subdomain || !subdomains.find(s => s.id === d.subdomain)).length > 0 && (
                  <section className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-[#F1E9DB] pb-4">
                         <div className="p-2 bg-[#F9F9F9] text-[#8C8C8C] rounded-xl"><MoreHorizontal size={14} /></div>
                         <h3 className="text-xs font-black text-[#8C8C8C] uppercase tracking-widest">Outros Ativos do Domínio</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         {filteredDatasets.filter(d => !d.subdomain || !subdomains.find(s => s.id === d.subdomain)).map(dataset => (
                           <DatasetCard 
                             key={dataset.id} 
                             dataset={dataset} 
                             domains={domains} 
                             subdomains={subdomains}
                             onSelect={onSelect} 
                             onViewColumns={setViewingDataset} 
                           />
                         ))}
                       </div>
                  </section>
               )}
            </div>
          ) : filteredDatasets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDatasets.map(dataset => (
                <DatasetCard 
                  key={dataset.id} 
                  dataset={dataset} 
                  domains={domains} 
                  subdomains={subdomains}
                  onSelect={onSelect} 
                  onViewColumns={setViewingDataset} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-20">
              <FolderOpen size={64} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum ativo encontrado nesta categoria</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalhes das Colunas */}
      <AnimatePresence>
        {viewingDataset && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#1A1A1A]/40 backdrop-blur-md animate-in fade-in duration-300">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="w-full max-w-2xl bg-white rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-8">
                   <button onClick={() => setViewingDataset(null)} className="text-[#8C8C8C] hover:text-[#1A1A1A] transition-all">
                      <X size={24} />
                   </button>
                </div>

                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-[#FDF9F0] text-[#D4AF37] rounded-3xl shadow-sm"><Layers size={28} /></div>
                  <div>
                     <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tighter">{viewingDataset.name}</h3>
                     <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-[0.2em]">Dicionário de Dados e Metadados</p>
                  </div>
                </div>

                <div className="bg-[#FDF9F0]/30 rounded-[2.5rem] border border-[#F1E9DB] overflow-hidden">
                   <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-[#F1E9DB]/50">
                              <th className="px-6 py-4 text-[9px] font-black text-[#8C8C8C] uppercase tracking-widest">Coluna</th>
                              <th className="px-6 py-4 text-[9px] font-black text-[#8C8C8C] uppercase tracking-widest">Tipo de Dado</th>
                              <th className="px-6 py-4 text-[9px] font-black text-[#8C8C8C] uppercase tracking-widest text-right">Qualidade</th>
                           </tr>
                        </thead>
                        <tbody>
                           {(viewingDataset.schema_json?.columns || []).map((col, idx) => (
                             <tr key={idx} className="border-b border-[#F1E9DB]/30 hover:bg-white/50 transition-all">
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                      <FileCode size={14} className="text-[#D4AF37]" />
                                      <span className="text-[11px] font-bold text-[#1A1A1A]">{col.name}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black text-gray-500 uppercase">{col.type}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <CheckCircle2 size={14} className="text-emerald-500 ml-auto" />
                                </td>
                             </tr>
                           ))}
                           {(!viewingDataset.schema_json?.columns || viewingDataset.schema_json?.columns.length === 0) && (
                             <tr>
                                <td colSpan={3} className="py-20 text-center">
                                   <div className="flex flex-col items-center gap-4 opacity-30">
                                      <Database size={48} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Metadados não disponíveis para este ativo</span>
                                   </div>
                                </td>
                             </tr>
                           )}
                        </tbody>
                      </table>
                   </div>
                </div>

                <div className="mt-10 flex items-center justify-between text-[9px] font-black text-[#8C8C8C] uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                      <Info size={14} />
                      <span>Schema inferido automaticamente por IA</span>
                   </div>
                   <button 
                     onClick={() => setViewingDataset(null)}
                     className="px-8 py-3 bg-[#1A1A1A] text-white rounded-2xl hover:bg-[#D4AF37] transition-all"
                   >
                     Fechar
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DatasetCard({ dataset, domains, subdomains, onSelect, onViewColumns }: { 
  dataset: Dataset, 
  domains: Domain[], 
  subdomains: Subdomain[], 
  onSelect?: (d: Dataset) => void,
  onViewColumns: (d: Dataset) => void
}) {
  const domainName = domains.find(d => d.id === dataset.domain)?.name;
  const subdomainName = subdomains.find(s => s.id === dataset.subdomain)?.name;

  return (
    <motion.div 
      layout
      onClick={() => onSelect?.(dataset)}
      className="bg-white border border-[#F1E9DB] p-6 rounded-[2.5rem] hover:border-[#D4AF37] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
        <div className="p-2 bg-white rounded-xl shadow-sm"><Info size={14} className="text-[#D4AF37]" /></div>
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className="p-4 bg-[#F9F9F9] text-[#1A1A1A] rounded-2xl group-hover:bg-[#1A1A1A] group-hover:text-[#D4AF37] transition-all shadow-sm">
          <FileText size={24} />
        </div>
        <div className="min-w-0">
          <h4 className="font-black text-sm text-[#1A1A1A] truncate pr-4">{dataset.name}</h4>
          <div className="flex items-center gap-2 mt-1">
             <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
               dataset.confidentiality === 'ALTAMENTE RESTRITO' ? 'bg-red-100 text-red-600' :
               dataset.confidentiality === 'CONFIDENCIAL' ? 'bg-orange-100 text-orange-600' :
               'bg-emerald-100 text-emerald-600'
             }`}>
               {dataset.confidentiality}
             </div>
             {subdomainName && (
               <div className="px-2 py-0.5 rounded bg-[#FDF9F0] text-[#D4AF37] text-[8px] font-black uppercase border border-[#F1E9DB]">
                 {subdomainName}
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[10px] text-[#8C8C8C] line-clamp-2 leading-relaxed italic">
          {dataset.description || "Nenhum contexto estratégico inferido para este ativo."}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-[8px] font-black text-[#8C8C8C] uppercase tracking-widest">
          <Link size={10} className="text-[#D4AF37]" />
          <span className="truncate">Linhagem: {dataset.lineage || 'Origem Direta'}</span>
        </div>
        {(domainName || subdomainName) && (
          <div className="flex items-center gap-2 text-[8px] font-black text-[#1A1A1A] uppercase tracking-widest opacity-60">
            <Layers size={10} className="text-[#D4AF37]" />
            <span className="truncate">{domainName} {subdomainName ? `> ${subdomainName}` : ''}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 mb-6">
        <div className="flex items-center gap-2 text-[9px] font-bold text-[#8C8C8C]">
          <User size={12} className="text-[#D4AF37]" />
          <span className="truncate">{dataset.owner_email || "sistema@agentbi.ai"}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#F1E9DB] flex items-center justify-between">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewColumns(dataset);
          }}
          className="flex items-center gap-2 text-[10px] font-black text-[#1A1A1A] hover:text-[#D4AF37] transition-all"
        >
           <Table size={12} className="text-[#D4AF37]" />
           VER COLUNAS
        </button>
        <div className="flex items-center gap-2">
           <Zap size={10} className="text-[#D4AF37]" />
           <span className="text-[10px] font-black text-[#1A1A1A]">{dataset.row_count?.toLocaleString()} LINHAS</span>
        </div>
      </div>
    </motion.div>
  );
}
