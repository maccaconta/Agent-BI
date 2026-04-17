"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Database,
  Table,
  ArrowLeft,
  ArrowRight,
  Server,
  Trash,
  FileText,
  Plus,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { readProjectSources, writeProjectSources, type StoredProjectSource } from "@/lib/projectSources";
import { getBackendAuthHeaders } from "@/lib/backendAuth";
import { ProjectHeaderStandard } from "@/components/project/ProjectHeaderStandard";
import { AWSPipelineMap } from "@/components/project/AWSPipelineMap";

/**
 * SourcesPage
 * ──────────
 * Tela de Ingestão de Dados (AWS Ingestion).
 * Foco: Upload local rápido para análise imediata. 
 * Estilo: Clean Luxury (Bege, Dourado, Neutros).
 */
export default function SourcesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [sources, setSources] = useState<StoredProjectSource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSources(readProjectSources(projectId));
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [projectId]);

  // O cronômetro foi movido para a tela de Diagnóstico/Preview

  // Polling para acompanhar o processamento no backend (Sincronia Silenciosa)
  useEffect(() => {
    if (currentDatasetId && isAnalyzing) {
      const poll = async () => {
        try {
          const res = await fetch(`/api/v1/datasets/${currentDatasetId}/`, {
            headers: getBackendAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status === "READY" || data.status === "ERROR") {
              setIsAnalyzing(false);
              setCurrentDatasetId(null);
              // Atualiza a lista local
              setSources(readProjectSources(projectId));
            }
          }
        } catch (err) {
          console.error("Erro no polling do dataset:", err);
        }
      };

      pollingRef.current = setInterval(poll, 3000);
      poll();
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [currentDatasetId, isAnalyzing, projectId]);

  const saveSources = (items: StoredProjectSource[]) => {
    setSources(items);
    writeProjectSources(projectId, items);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (sources.find((s) => s.name === file.name)) {
      alert(`A fonte de dados "${file.name}" ja foi adicionada.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const isCsv = file.name.toLowerCase().endsWith(".csv");

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const binary = loadEvent.target?.result;
        let workbook;

        if (isCsv && typeof binary === "string") {
          workbook = XLSX.read(binary, { type: "string" });
        } else {
          workbook = XLSX.read(binary, { type: "binary" });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        const previewData = data.slice(0, 500);
        const sample = data.slice(0, 10);

        const newSource: StoredProjectSource = {
          id: `local-${Math.random().toString(36).slice(2, 11)}`,
          name: file.name,
          type: file.name.split(".").pop()?.toUpperCase() || "FILE",
          size: file.size,
          rows: data.length,
          columns,
          previewData,
          sample,
          selectedCols: columns,
          descriptions: {},
          status: "READY", // Status local inicial
        };

        const updated = [...sources, newSource];
        saveSources(updated);

        // --- NOVA ETAPA: SINCRONIZAÇÃO COM BACKEND (IA) ---
        setIsAnalyzing(true);
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("project_id", projectId);
          formData.append("name", newSource.name);

          const response = await fetch("/api/v1/datasets/upload/", {
            method: "POST",
            headers: {
              ...getBackendAuthHeaders(),
              // Note: FormData handles Content-Type boundary automatically
            },
            body: formData,
          });

          if (!response.ok) {
            console.error("Falha ao sincronizar dataset com o backend para análise de IA.");
          } else {
            const apiResult = await response.json();
            setCurrentDatasetId(apiResult.id);
            setIsAnalyzing(true);
            setProcessingStep("Iniciando Ingestão Turbo...");
            
            // Atualiza o ID local com o ID real do backend para sincronia futura
            const finalSources = updated.map(s => 
              s.id === newSource.id ? { ...s, id: apiResult.id, status: "PROCESSING" } : s
            );
            saveSources(finalSources);
          }
        } catch (backendErr) {
          console.error("Erro na chamada de sincronização IA:", backendErr);
          setIsAnalyzing(false);
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      } catch (err) {
        setUploading(false);
        setIsAnalyzing(false);
        alert("Erro ao ler o arquivo. Verifique se o formato esta correto (CSV/XLSX).");
      }
    };
    if (isCsv) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const removeSource = async (id: string) => {
    // Sincroniza com o backend se não for um ID temporário local
    if (!id.startsWith("local-")) {
      try {
        const res = await fetch(`/api/v1/datasets/${id}/`, {
          method: "DELETE",
          headers: getBackendAuthHeaders(),
        });
        if (!res.ok) {
          console.error("Falha ao excluir dataset no servidor.");
        }
      } catch (err) {
        console.error("Erro ao conectar com a API de exclusão:", err);
      }
    }
    saveSources(sources.filter((source) => source.id !== id));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="max-w-[1600px] mx-auto pt-6 pb-10 px-4">
      <ProjectHeaderStandard 
        projectId={projectId}
        step={2}
        title="Ingestão AWS"
        prevHref="/projects"
        prevLabel="Voltar para Projetos"
        nextHref={`/projects/${projectId}/sources/preview`}
        nextLabel="Seguir para Transformação"
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start mt-6">
        {/* Painel de Upload (Esq) */}
        <div className="xl:col-span-8 space-y-6">
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed border-lux-border/30 dark:border-lux-border/50 rounded-[3rem] px-8 py-14 flex flex-col items-center justify-center bg-white/50 dark:bg-white/5 hover:bg-white/80 hover:border-lux-accent transition-all min-h-[320px] shadow-sm overflow-hidden ${uploading ? "cursor-wait" : "cursor-pointer"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-lux-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="w-20 h-20 rounded-full bg-lux-text dark:bg-lux-accent text-white dark:text-black flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl">
              {uploading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                  <Zap size={32} />
                </motion.div>
              ) : (
                <UploadCloud size={32} />
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-black text-lux-text dark:text-lux-accent mb-2 text-center">Mapear Nova Fonte</h2>
            
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mb-4 bg-lux-accent/10 border border-lux-accent/20 px-4 py-2 rounded-full"
                >
                  <Sparkles size={14} className="text-lux-accent animate-pulse" />
                  <span className="text-[10px] font-black text-lux-accent uppercase tracking-[0.1em]">
                    ✨ Agent-BI está interpretando a semântica dos dados...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-lux-muted dark:text-lux-muted/80 text-center max-w-md mb-8 leading-relaxed text-md font-light italic">
              Selecione arquivos CSV ou Excel para iniciar a análise estatística local em tempo real.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv,.xlsx,.xls"
            />

            <button className="bg-lux-text dark:bg-lux-accent text-white dark:text-black px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-3">
              <Plus size={20} /> Browser de Arquivos
            </button>
          </div>

          <AWSPipelineMap />
        </div>

        {/* Painel de Inventário (Dir) */}
        <div className="xl:col-span-4 h-full">
          <div className="bg-white/60 dark:bg-lux-card/40 border border-lux-border/20 dark:border-lux-border/40 p-8 h-full shadow-2xl flex flex-col rounded-[3.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Database size={120} />
            </div>

            <div className="flex items-center justify-between gap-3 mb-8 relative z-10">
              <h3 className="text-[10px] uppercase font-black text-lux-text dark:text-lux-accent tracking-[0.25em] flex items-center gap-3">
                <Table size={16} /> Fontes Carregadas ({sources.length})
              </h3>
              <div className="p-2 bg-lux-accent/10 rounded-xl">
                 <Sparkles className="text-lux-accent" size={16} />
              </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px] max-h-[calc(100vh-28rem)] relative z-10">
              <AnimatePresence>
                {sources.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 text-lux-muted/40 italic">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-lux-border/30 flex items-center justify-center mb-4">
                       <FileText size={32} strokeWidth={1} />
                    </div>
                    <p className="text-sm font-light">Nenhum mapeamento iniciado</p>
                  </motion.div>
                ) : (
                  sources.map((source) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-5 bg-white dark:bg-white/5 border border-lux-border/20 dark:border-lux-border/60 rounded-[1.75rem] shadow-sm hover:shadow-xl transition-all group relative border-l-4 border-l-lux-accent"
                    >
                      <button
                        onClick={() => removeSource(source.id)}
                        className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white dark:bg-lux-card text-red-500 border border-lux-border/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:bg-red-500 hover:text-white"
                      >
                        <Trash size={18} />
                      </button>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-lux-bg dark:bg-lux-accent/10 flex items-center justify-center text-lux-text dark:text-lux-accent flex-shrink-0 shadow-inner">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-lux-text dark:text-lux-accent truncate">{source.name}</p>
                            <p className="text-[10px] text-lux-muted font-bold tracking-widest uppercase mt-1">
                              {source.rows.toLocaleString()} Registros
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-lux-border/10">
                          {source.status === "PROCESSING" ? (
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-lux-accent bg-lux-accent/5 dark:bg-lux-accent/10 px-3 py-1 rounded-full uppercase tracking-widest border border-lux-accent/20 animate-pulse">
                              <Sparkles size={12} /> IA Refinando...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-200/50">
                              <Clock size={12} /> Local / Pronto
                            </span>
                          )}
                          <span className="text-[10px] font-black text-lux-muted tracking-tighter">{formatBytes(source.size)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 pt-6 border-t border-lux-border/20 relative z-10">
                <div className="flex items-center gap-3 p-4 bg-lux-accent/5 rounded-2xl border border-lux-accent/10">
                   <Info size={16} className="text-lux-accent" />
                   <p className="text-[10px] text-lux-muted leading-relaxed font-medium">
                     Os dados estão em modo de **pré-visualização**. A consolidação definitiva na nuvem AWS ocorrerá na etapa final.
                   </p>
                </div>
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
