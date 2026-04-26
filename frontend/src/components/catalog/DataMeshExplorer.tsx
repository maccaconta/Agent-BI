"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  FileCode,
  Shuffle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  List,
  Trash2
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
  onDelete?: (dataset: Dataset) => void;
  compact?: boolean;
}

export default function DataMeshExplorer({ 
  datasets, 
  domains, 
  subdomains, 
  onSelect,
  onDelete,
  compact = false 
}: DataMeshExplorerProps) {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});
  const [viewingDataset, setViewingDataset] = useState<Dataset | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [collapsedDomains, setCollapsedDomains] = useState<Record<string, boolean>>({});

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
    <div 
      className={`flex flex-col lg:flex-row bg-white border border-[#F1E9DB] rounded-[3rem] overflow-hidden shadow-sm ${compact ? 'h-[500px]' : 'min-h-[700px]'}`}
      style={{ "--card-scale": zoomLevel } as any}
    >
      
      {/* Sidebar: Hierarquia Tree */}
      <aside className="w-full lg:w-80 border-r border-[#F1E9DB] bg-[#FDF9F0]/20 flex flex-col">
        <div className="p-8 border-b border-[#F1E9DB]">
          <button 
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-6 hover:translate-x-1 transition-transform group"
          >
            <ArrowRight className="rotate-180" size={12} />
            Voltar ao Portfólio
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
                    <Layers size={12} />
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
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${selectedSubdomain === sub.id ? 'bg-[#FDF9F0] border border-[#F1E9DB] text-[#D4AF37] font-black shadow-sm' : 'text-[#8C8C8C] hover:bg-white hover:text-[#1A1A1A]'}`}
                      >
                        <div className={`p-1 rounded-md ${selectedSubdomain === sub.id ? 'bg-[#D4AF37] text-white' : 'bg-transparent text-current'}`}>
                          <Shuffle size={10} />
                        </div>
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
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-[#FDF9F0] p-1 rounded-xl border border-[#D4AF37]/20">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#1A1A1A] text-[#D4AF37] shadow-md' : 'text-[#8C8C8C] hover:text-[#1A1A1A]'}`}
              >
                <Grid size={14} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#1A1A1A] text-[#D4AF37] shadow-md' : 'text-[#8C8C8C] hover:text-[#1A1A1A]'}`}
              >
                <List size={14} />
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
            <div className="flex items-center gap-2 px-4 py-2 bg-[#F9F9F9] rounded-2xl border border-[#F1E9DB]">
              <span className="text-[10px] font-black text-[#8C8C8C] uppercase">{filteredDatasets.length} Ativos</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {(!selectedDomain && !search) ? (
            <div className="space-y-12">
               {domains.map(domain => {
                  const domainDatasets = datasets.filter(d => d.domain === domain.id);
                  if (domainDatasets.length === 0) return null;
                  const isCollapsed = collapsedDomains[domain.id];
                  
                  return (
                    <section key={domain.id} className="space-y-4">
                       <button 
                         onClick={() => setCollapsedDomains(prev => ({ ...prev, [domain.id]: !prev[domain.id] }))}
                         className="w-full flex items-center justify-between gap-4 border-b border-[#F1E9DB] pb-4 group"
                       >
                         <div className="flex items-center gap-4">
                           <div className="p-3 bg-[#FDF9F0] text-[#D4AF37] rounded-2xl group-hover:bg-[#1A1A1A] transition-all"><FolderOpen size={18} /></div>
                           <div className="text-left">
                             <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest">{domain.name}</h3>
                             <p className="text-[9px] font-bold text-[#8C8C8C] uppercase">{domainDatasets.length} ATIVOS GOVERNADOS</p>
                           </div>
                         </div>
                         <div className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}>
                           <ChevronDown size={20} className="text-[#D4AF37]" />
                         </div>
                       </button>
                       
                       {!isCollapsed && (
                         viewMode === 'grid' ? (
                           <div 
                             className="grid gap-6 animate-in fade-in slide-in-from-top-4 duration-500 mt-6"
                             style={{ gridTemplateColumns: `repeat(auto-fill, minmax(calc(320px * ${zoomLevel}), 1fr))` }}
                           >
                             {domainDatasets.map(dataset => (
                               <DatasetCard 
                                 key={dataset.id} 
                                 dataset={dataset} 
                                 domains={domains} 
                                 subdomains={subdomains}
                                 onSelect={onSelect} 
                                 onDelete={onDelete}
                                 onViewColumns={setViewingDataset} 
                                 zoomLevel={zoomLevel}
                               />
                             ))}
                           </div>
                         ) : (
                           <div className="mt-6 bg-white border border-[#F1E9DB] rounded-[2rem] overflow-hidden divide-y divide-[#F1E9DB] animate-in fade-in slide-in-from-top-4 duration-500">
                             {domainDatasets.map(dataset => (
                               <DatasetListItem 
                                 key={dataset.id} 
                                 dataset={dataset} 
                                 domains={domains} 
                                 subdomains={subdomains}
                                 onSelect={onSelect} 
                                 onDelete={onDelete}
                                 onViewColumns={setViewingDataset} 
                                 zoomLevel={zoomLevel}
                               />
                             ))}
                           </div>
                         )
                       )}
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
                        {viewMode === 'grid' ? (
                          <div 
                            className="grid gap-6 animate-in fade-in duration-500"
                            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(calc(320px * ${zoomLevel}), 1fr))` }}
                          >
                            {subDatasets.map(dataset => (
                              <DatasetCard 
                                key={dataset.id} 
                                dataset={dataset} 
                                domains={domains} 
                                subdomains={subdomains}
                                onSelect={onSelect} 
                                onDelete={onDelete}
                                onViewColumns={setViewingDataset} 
                                zoomLevel={zoomLevel}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white border border-[#F1E9DB] rounded-[2rem] overflow-hidden divide-y divide-[#F1E9DB] animate-in fade-in duration-500">
                             {subDatasets.map(dataset => (
                               <DatasetListItem 
                                 key={dataset.id} 
                                 dataset={dataset} 
                                 domains={domains} 
                                 subdomains={subdomains}
                                 onSelect={onSelect} 
                                 onDelete={onDelete}
                                 onViewColumns={setViewingDataset} 
                                 zoomLevel={zoomLevel}
                               />
                             ))}
                           </div>
                        )}
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
                        {viewMode === 'grid' ? (
                          <div 
                            className="grid gap-6 animate-in fade-in duration-500"
                            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(calc(320px * ${zoomLevel}), 1fr))` }}
                          >
                            {filteredDatasets.filter(d => !d.subdomain || !subdomains.find(s => s.id === d.subdomain)).map(dataset => (
                              <DatasetCard 
                                key={dataset.id} 
                                dataset={dataset} 
                                domains={domains} 
                                subdomains={subdomains}
                                onSelect={onSelect} 
                                onDelete={onDelete}
                                onViewColumns={setViewingDataset} 
                                zoomLevel={zoomLevel}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white border border-[#F1E9DB] rounded-[2rem] overflow-hidden divide-y divide-[#F1E9DB] animate-in fade-in duration-500">
                             {filteredDatasets.filter(d => !d.subdomain || !subdomains.find(s => s.id === d.subdomain)).map(dataset => (
                               <DatasetListItem 
                                 key={dataset.id} 
                                 dataset={dataset} 
                                 domains={domains} 
                                 subdomains={subdomains}
                                 onSelect={onSelect} 
                                 onDelete={onDelete}
                                 onViewColumns={setViewingDataset} 
                                 zoomLevel={zoomLevel}
                               />
                             ))}
                           </div>
                        )}
                   </section>
                )}
            </div>
          ) : filteredDatasets.length > 0 ? (
             viewMode === 'grid' ? (
               <div 
                 className="grid gap-6 animate-in fade-in duration-500"
                 style={{ gridTemplateColumns: `repeat(auto-fill, minmax(calc(320px * ${zoomLevel}), 1fr))` }}
               >
                 {filteredDatasets.map(dataset => (
                   <DatasetCard 
                     key={dataset.id} 
                     dataset={dataset} 
                     domains={domains} 
                     subdomains={subdomains}
                     onSelect={onSelect} 
                     onDelete={onDelete}
                     onViewColumns={setViewingDataset} 
                     zoomLevel={zoomLevel}
                   />
                 ))}
               </div>
             ) : (
               <div className="bg-white border border-[#F1E9DB] rounded-[2rem] overflow-hidden divide-y divide-[#F1E9DB] animate-in fade-in duration-500">
                 {filteredDatasets.map(dataset => (
                   <DatasetListItem 
                     key={dataset.id} 
                     dataset={dataset} 
                     domains={domains} 
                     subdomains={subdomains}
                     onSelect={onSelect} 
                     onDelete={onDelete}
                     onViewColumns={setViewingDataset} 
                     zoomLevel={zoomLevel}
                   />
                 ))}
               </div>
             )
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

function DatasetCard({ dataset, domains, subdomains, onSelect, onDelete, onViewColumns, zoomLevel }: { 
  dataset: Dataset, 
  domains: Domain[], 
  subdomains: Subdomain[], 
  onSelect?: (d: Dataset) => void,
  onDelete?: (d: Dataset) => void,
  onViewColumns: (d: Dataset) => void,
  zoomLevel: number
}) {
  const domainName = domains.find(d => d.id === dataset.domain)?.name;
  const subdomainName = subdomains.find(s => s.id === dataset.subdomain)?.name;

  return (
    <motion.div 
      layout
      whileHover={{ scale: 1.02 }}
      onClick={() => onSelect?.(dataset)}
      className="bg-white border border-[#F1E9DB] rounded-[2.5rem] hover:border-[#D4AF37] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col"
      style={{ 
        padding: "calc(1.5rem * var(--card-scale))",
        fontSize: "calc(1rem * var(--card-scale))"
      } as any}
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2">
        <div className="p-2 bg-white rounded-xl shadow-sm border border-[#F1E9DB]">
          <Info size={Math.round(14 * zoomLevel)} className="text-[#D4AF37]" />
        </div>
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(dataset);
            }}
            className="p-2 bg-white rounded-xl shadow-sm border border-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={Math.round(14 * zoomLevel)} />
          </button>
        )}
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div 
          className="bg-[#F9F9F9] text-[#1A1A1A] rounded-2xl group-hover:bg-[#1A1A1A] group-hover:text-[#D4AF37] transition-all shadow-sm flex items-center justify-center"
          style={{ 
            width: "calc(3.5rem * var(--card-scale))", 
            height: "calc(3.5rem * var(--card-scale))" 
          } as any}
        >
          <FileText size={Math.round(24 * zoomLevel)} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 
            className="font-black text-[#1A1A1A] truncate pr-4"
            style={{ fontSize: "calc(0.875rem * var(--card-scale))" } as any}
          >
            {dataset.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
             <div 
               className={`px-2 py-0.5 rounded font-black uppercase`}
               style={{ 
                 fontSize: "calc(0.5rem * var(--card-scale))",
                 backgroundColor: dataset.confidentiality === 'ALTAMENTE RESTRITO' ? '#FEE2E2' : dataset.confidentiality === 'CONFIDENCIAL' ? '#FFEDD5' : '#D1FAE5',
                 color: dataset.confidentiality === 'ALTAMENTE RESTRITO' ? '#DC2626' : dataset.confidentiality === 'CONFIDENCIAL' ? '#EA580C' : '#059669'
               } as any}
             >
               {dataset.confidentiality}
             </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex-1">
        <p 
          className="text-[#8C8C8C] line-clamp-2 leading-relaxed italic"
          style={{ fontSize: "calc(0.625rem * var(--card-scale))" } as any}
        >
          {dataset.description || "Nenhum contexto estratégico inferido para este ativo."}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 font-black text-[#8C8C8C] uppercase tracking-widest">
          <Link size={Math.round(10 * zoomLevel)} className="text-[#D4AF37]" />
          <span className="truncate" style={{ fontSize: "calc(0.5rem * var(--card-scale))" } as any}>
            Linhagem: {dataset.lineage || 'Origem Direta'}
          </span>
        </div>
        {(domainName || subdomainName) && (
          <div className="flex items-center gap-2 flex-wrap">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FDF9F0] border border-[#D4AF37]/30 rounded-md">
               <Layers size={Math.round(10 * zoomLevel)} className="text-[#D4AF37]" />
               <span className="font-black text-[#D4AF37] uppercase tracking-widest" style={{ fontSize: "calc(0.5rem * var(--card-scale))" } as any}>
                 {subdomainName || domainName}
               </span>
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 mb-6">
        <div className="flex items-center gap-2 font-bold text-[#8C8C8C]">
          <User size={Math.round(12 * zoomLevel)} className="text-[#D4AF37]" />
          <span className="truncate" style={{ fontSize: "calc(0.56rem * var(--card-scale))" } as any}>
            {dataset.owner_email || "sistema@agentbi.ai"}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-[#F1E9DB] flex items-center justify-between">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewColumns(dataset);
          }}
          className="flex items-center gap-2 font-black text-[#1A1A1A] hover:text-[#D4AF37] transition-all"
          style={{ fontSize: "calc(0.625rem * var(--card-scale))" } as any}
        >
           <Table size={Math.round(12 * zoomLevel)} className="text-[#D4AF37]" />
           VER COLUNAS
        </button>
        <div className="flex items-center gap-2">
           <Zap size={Math.round(10 * zoomLevel)} className="text-[#D4AF37]" />
           <span className="font-black text-[#1A1A1A]" style={{ fontSize: "calc(0.625rem * var(--card-scale))" } as any}>
             {dataset.row_count?.toLocaleString()} LINHAS
           </span>
        </div>
      </div>
    </motion.div>
  );
}

function DatasetListItem({ dataset, domains, subdomains, onSelect, onDelete, onViewColumns, zoomLevel }: { 
  dataset: Dataset, 
  domains: Domain[], 
  subdomains: Subdomain[], 
  onSelect?: (d: Dataset) => void,
  onDelete?: (d: Dataset) => void,
  onViewColumns: (d: Dataset) => void,
  zoomLevel: number
}) {
  const domainName = domains.find(d => d.id === dataset.domain)?.name;
  const subdomainName = subdomains.find(s => s.id === dataset.subdomain)?.name;

  return (
    <motion.div 
      layout
      whileHover={{ x: 4, backgroundColor: "#FDF9F0" }}
      onClick={() => onSelect?.(dataset)}
      className="flex items-center gap-4 p-4 border-b border-[#F1E9DB] last:border-0 hover:border-[#D4AF37] transition-all cursor-pointer group"
      style={{ fontSize: "calc(1rem * var(--card-scale))" } as any}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="p-2 bg-[#F9F9F9] text-[#1A1A1A] rounded-lg group-hover:bg-[#1A1A1A] group-hover:text-[#D4AF37] transition-all">
          <FileText size={Math.round(18 * zoomLevel)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-black text-[#1A1A1A] truncate" style={{ fontSize: "calc(0.85rem * var(--card-scale))" } as any}>
              {dataset.name}
            </h4>
            <div 
               className={`px-1.5 py-0.5 rounded font-black uppercase`}
               style={{ 
                 fontSize: "calc(0.45rem * var(--card-scale))",
                 backgroundColor: dataset.confidentiality === 'ALTAMENTE RESTRITO' ? '#FEE2E2' : dataset.confidentiality === 'CONFIDENCIAL' ? '#FFEDD5' : '#D1FAE5',
                 color: dataset.confidentiality === 'ALTAMENTE RESTRITO' ? '#DC2626' : dataset.confidentiality === 'CONFIDENCIAL' ? '#EA580C' : '#059669'
               } as any}
             >
               {dataset.confidentiality}
             </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-[#8C8C8C]">
              <Layers size={Math.round(8 * zoomLevel)} className="text-[#D4AF37]" />
              <span className="font-black uppercase" style={{ fontSize: "calc(0.5rem * var(--card-scale))" } as any}>
                {subdomainName || domainName}
              </span>
            </div>
            <span className="text-[#F1E9DB]">|</span>
            <div className="flex items-center gap-1 text-[#8C8C8C]">
              <User size={Math.round(8 * zoomLevel)} className="text-[#D4AF37]" />
              <span className="font-bold" style={{ fontSize: "calc(0.5rem * var(--card-scale))" } as any}>
                {dataset.owner_email || "sistema@agentbi.ai"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6 px-4">
        <div className="flex flex-col items-end">
           <span className="text-[#1A1A1A] font-black" style={{ fontSize: "calc(0.7rem * var(--card-scale))" } as any}>
             {dataset.row_count?.toLocaleString()}
           </span>
           <span className="text-[#8C8C8C] font-black uppercase" style={{ fontSize: "calc(0.4rem * var(--card-scale))" } as any}>
             Linhas
           </span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewColumns(dataset);
          }}
          className="p-2 bg-[#F9F9F9] text-[#8C8C8C] rounded-lg hover:bg-[#D4AF37] hover:text-white transition-all shadow-sm"
        >
           <Table size={Math.round(14 * zoomLevel)} />
        </button>
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(dataset);
            }}
            className="p-2 bg-[#F9F9F9] text-red-300 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
          >
             <Trash2 size={Math.round(14 * zoomLevel)} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
