"use client";

import React from "react";
import { motion } from "framer-motion";
import { Database, Cloud, Zap, Cpu, Server, ShieldCheck, ChevronRight } from "lucide-react";

const PipelineNode = ({ icon: Icon, label, status, sublabel, alignment = "center", onClick, active }: any) => (
  <div 
    onClick={onClick}
    className={`flex flex-col items-${alignment} gap-3 relative group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <motion.div 
      whileHover={onClick ? { scale: 1.1, y: -10 } : { scale: 1.05, y: -5 }}
      whileTap={onClick ? { scale: 0.95 } : {}}
      className={`w-16 h-16 rounded-2xl bg-lux-card border transition-all relative shadow-2xl overflow-hidden ${onClick ? 'border-lux-accent/40 shadow-lux-accent/10 hover:border-lux-accent group-hover:shadow-lux-accent/20' : 'border-lux-border/30 group-hover:border-lux-accent/50'} ${active ? 'ring-4 ring-lux-accent/30 bg-[#1A1A1A] text-white' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-lux-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <Icon size={28} className={`relative z-10 ${active ? 'text-[#D4AF37]' : 'text-lux-text dark:text-lux-accent'}`} />
      
      {/* Indicador de Status */}
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
    </motion.div>
    
    <div className={`flex flex-col items-${alignment}`}>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${onClick ? 'group-hover:text-lux-accent' : 'text-lux-text'}`}>{label}</span>
      <span className="text-[8px] font-bold text-lux-muted uppercase opacity-60">{sublabel}</span>
    </div>
  </div>
);

const FlowParticles = () => (
  <div className="flex-1 h-px relative bg-lux-border/20 mx-2">
    <motion.div 
      initial={{ left: "-10%" }}
      animate={{ left: "110%" }}
      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      className="absolute top-1/2 -translate-y-1/2 w-8 h-[2px] bg-gradient-to-r from-transparent via-lux-accent to-transparent shadow-[0_0_10px_rgba(212,175,55,0.5)]"
    />
    <motion.div 
      initial={{ left: "-10%" }}
      animate={{ left: "110%" }}
      transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 1.5 }}
      className="absolute top-1/2 -translate-y-1/2 w-4 h-[2px] bg-gradient-to-r from-transparent via-lux-accent/30 to-transparent"
    />
  </div>
);

export function AWSPipelineMap({ onSourceClick, activeTab }: any) {
  return (
    <div className="bg-white/40 dark:bg-white/5 border border-lux-border/20 dark:border-lux-border/40 p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group/pipeline">
      {/* Background Decorative */}
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover/pipeline:opacity-[0.07] transition-opacity">
        <Server size={180} />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
        <div>
          <h3 className="text-[11px] uppercase font-black text-lux-muted tracking-[0.4em] flex items-center gap-3 mb-2">
            <Zap size={14} className="text-lux-accent" /> AWS Cloud Ingestion Architecture
          </h3>
          <p className="text-lux-text/60 text-sm font-medium italic">
            Visualização estratégica do pipeline de dados de alta escala (Roadmap S3 Native).
          </p>
        </div>

        <div className="flex items-center gap-4 bg-lux-accent/5 border border-lux-accent/20 px-4 py-2 rounded-2xl shadow-inner">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-lux-bg bg-lux-card flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-lux-accent/20 animate-pulse" />
              </div>
            ))}
          </div>
          <span className="text-[9px] font-black text-lux-accent uppercase tracking-widest">Orchestration Active</span>
        </div>
      </div>

      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2 relative">
        <PipelineNode 
          icon={Database} 
          label="Local Data" 
          sublabel="Staging Mode" 
          status="active" 
          onClick={onSourceClick}
          active={activeTab === 'sources'}
        />
        
        <FlowParticles />

        <PipelineNode 
          icon={Cloud} 
          label="S3 Bucket" 
          sublabel="Raw & Parquet" 
          status="pending" 
        />

        <FlowParticles />

        <PipelineNode 
          icon={Cpu} 
          label="AWS Glue" 
          sublabel="Data Catalog" 
          status="pending" 
        />

        <FlowParticles />

        <PipelineNode 
          icon={Zap} 
          label="Athena" 
          sublabel="Query Engine" 
          status="pending" 
        />
        
        <FlowParticles />

        <PipelineNode 
          icon={ShieldCheck} 
          label="Agent-BI" 
          sublabel="Semantic Layer" 
          status="active" 
        />
      </div>

      <div className="mt-12 pt-8 border-t border-lux-border/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-lux-muted uppercase tracking-widest">Active & Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[9px] font-bold text-lux-muted uppercase tracking-widest">Future Integration (S3)</span>
          </div>
        </div>

        <div className="px-5 py-2 rounded-full bg-lux-text text-lux-bg text-[9px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
          VPC Endpoints Secured <ShieldCheck size={12} className="text-lux-accent" />
        </div>
      </div>
    </div>
  );
}
