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
import { useEffect, useState } from "react";
import { getBackendJsonHeaders } from "@/lib/backendAuth";
import DataMeshExplorer from "@/components/catalog/DataMeshExplorer";

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
            />
          )}
        </div>
      </div>
    </div>
  );
}
