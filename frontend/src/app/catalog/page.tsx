"use client";

import { motion } from "framer-motion";
import { 
  Database, 
  Search, 
  Filter, 
  ExternalLink, 
  ShieldCheck, 
  User, 
  Calendar,
  Lock,
  Tag,
  Download,
  Trash2,
  Share2,
  MoreVertical,
  ChevronRight,
  Shuffle,
  RefreshCw
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getBackendJsonHeaders } from "@/lib/backendAuth";
import DataMeshExplorer from "@/components/catalog/DataMeshExplorer";
import { Info, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";

type Dataset = {
  id: string;
  name: string;
  domain_name: string;
  domain_id?: string;
  subdomain_name: string;
  subdomain_id?: string;
  confidentiality: string;
  created_by_email: string;
  created_at: string;
  row_count: number;
  s3_original_filename: string;
  status: string;
  lineage_info: any;
  source_type: string;
  description: string;
  schema_json: any;
};

export default function DataCatalogPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [subdomains, setSubdomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [datasetToDelete, setDatasetToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        await Promise.all([
            fetchDatasets(),
            fetchDomains(),
            fetchSubdomains()
        ]);
        setLoading(false);
    };
    init();
  }, []);

  async function fetchDomains() {
    try {
      const res = await fetch("/api/v1/projects/domains/", { headers: getBackendJsonHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDomains(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) { console.error(err); }
  }

  async function fetchSubdomains() {
    try {
      const res = await fetch("/api/v1/projects/subdomains/", { headers: getBackendJsonHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSubdomains(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) { console.error(err); }
  }

  async function fetchDatasets() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/datasets/?t=" + Date.now(), {
        headers: getBackendJsonHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDatasets(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) {
      console.error("Erro ao buscar catálogo:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDataset() {
    if (!datasetToDelete) return;
    
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/v1/datasets/${datasetToDelete.id}/`, {
        method: "DELETE",
        headers: getBackendJsonHeaders()
      });

      if (res.ok) {
        setDatasets(prev => prev.filter(d => d.id !== datasetToDelete.id));
        setDatasetToDelete(null);
      } else {
        const data = await res.json();
        setError(data.detail || (Array.isArray(data) ? data[0] : "Não foi possível excluir este ativo devido a dependências corporativas."));
        setTimeout(() => setError(null), 6000);
        setDatasetToDelete(null);
      }
    } catch (err) {
      console.error("Erro ao excluir dataset:", err);
      setError("Falha na comunicação com o motor de governança.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  }



  return (
    <div className="min-h-screen bg-[#FDF9F0]/30 p-8">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header Elegante */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#1A1A1A] text-[#D4AF37] rounded-2xl shadow-xl">
                 <Database size={24} />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-[#1A1A1A] font-serif">Catálogo de Ativos Mesh</h1>
                <p className="text-[#8C8C8C] text-sm font-black uppercase tracking-widest mt-1 opacity-60">Exploração Hierárquica e Governança de Dados</p>
              </div>
            </div>
          </div>
        </header>

        {/* Data Mesh Explorer Hierárquico */}
        <div className="space-y-6">
          {loading ? (
             <div className="bg-white border border-[#F1E9DB] p-12 rounded-[4rem] flex flex-col items-center justify-center gap-6 min-h-[600px]">
                <RefreshCw size={48} className="text-[#D4AF37] animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8C8C8C]">Sincronizando Mesh Corporativo...</p>
             </div>
          ) : (
            <DataMeshExplorer 
                datasets={datasets.map(d => ({
                    id: d.id,
                    name: d.name || "Ativo sem Nome",
                    domain: (d.domain_id || d.domain_name) || "sem-dominio",
                    subdomain: (d.subdomain_id || d.subdomain_name) || "sem-area",
                    owner_email: d.created_by_email || "sistema@agentbi.local",
                    confidentiality: d.confidentiality || "CORPORATIVO",
                    row_count: d.row_count || 0,
                    created_at: d.created_at || new Date().toISOString(),
                    source_type: d.source_type || 'CSV',
                    lineage: typeof d.lineage_info === 'string' ? d.lineage_info : (d.lineage_info?.source || 'Origem Direta'),
                    description: d.description || '',
                    schema_json: d.schema_json || {}
                })) as any}
                domains={domains.length > 0 ? domains : [{ id: "sem-dominio", name: "Outros" }]}
                subdomains={subdomains}
                onSelect={(d) => console.log("Selected:", d)}
                onDelete={(d) => setDatasetToDelete(d)}
            />
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {datasetToDelete && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[#1A1A1A]/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black text-[#1A1A1A] tracking-tighter mb-2">Excluir Ativo Mesh?</h3>
                <p className="text-sm text-[#8C8C8C] font-bold mb-8 leading-relaxed">
                  Esta ação removerá o ativo <span className="text-[#1A1A1A]">"{datasetToDelete.name}"</span> do catálogo. 
                  Datasets com relatórios ou dashboards vinculados não podem ser removidos.
                </p>
                
                <div className="flex flex-col w-full gap-3">
                  <button 
                    disabled={isDeleting}
                    onClick={handleDeleteDataset}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                  >
                    {isDeleting ? "PROCESSANDO..." : "CONFIRMAR EXCLUSÃO"}
                  </button>
                  <button 
                    disabled={isDeleting}
                    onClick={() => setDatasetToDelete(null)}
                    className="w-full py-4 bg-[#F9F9F9] text-[#1A1A1A] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F1E9DB] transition-all"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast de Erro Premium */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[600] bg-white border border-[#F1E9DB] p-6 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex items-center gap-5 min-w-[450px]"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
               <Info size={24} />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">Restrição de Governança</p>
               <p className="text-sm font-bold text-[#1A1A1A] leading-tight">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-4 p-2 hover:bg-black/5 rounded-full transition-all">
               <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
