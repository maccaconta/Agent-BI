"use client";

import React, { useState } from "react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Database, 
  Layers,
  Cloud,
  Share2,
  CheckCircle2,
  LayoutGrid,
  Search,
  Monitor,
  Terminal,
  BrainCircuit,
  Zap,
  Globe,
  ArrowRightLeft,
  Workflow
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Pantone Gold: #D4AF37
  const gold = "#D4AF37";

  const slides = [
    {
      title: "Agent-BI",
      subtitle: "A Fronteira da Cognição Corporativa",
      icon: <BrainCircuit style={{ color: gold }} size={40} />,
      isIntro: true,
      content: (
        <div className="flex flex-col items-center justify-center text-center space-y-10 py-10">
           <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="relative"
           >
              <div className="absolute inset-0 bg-[#D4AF37]/20 blur-[80px] rounded-full" />
              <div className="relative w-32 h-32 bg-black rounded-[2.5rem] flex items-center justify-center shadow-2xl border-2 border-[#D4AF37]/30">
                 <Zap style={{ color: gold }} size={56} />
              </div>
           </motion.div>
           
           <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl font-black text-black tracking-tighter leading-tight">
                 Transformando Dados em <span style={{ color: gold }}>Conhecimento Vivo</span>
              </h1>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-[0.4em] pt-4">
                 Democratização de Dados - GenIA - Orquestração de Agentes
              </p>
           </div>

           <div className="grid grid-cols-3 gap-12 pt-10">
              <div className="flex flex-col items-center gap-2">
                 <span className="text-2xl font-black text-black">90%</span>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time-to-Insight</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <span className="text-2xl font-black text-black">100%</span>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Soberania E2EE</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <span className="text-2xl font-black text-black">∞</span>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escalabilidade Mesh</span>
              </div>
           </div>
        </div>
      )
    },
    {
      title: "Ecossistema Analítico & Stack",
      subtitle: "Orquestração de Alta Performance em Background",
      icon: <Cloud style={{ color: gold }} size={32} />,
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100">
                 <h4 className="text-[10px] font-black text-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Workflow style={{ color: gold }} size={14} /> Processamento Assíncrono
                 </h4>
                 <p className="text-xs text-gray-600 leading-relaxed mb-6">
                    O Agent-BI utiliza uma camada robusta de **Background Workers** para garantir que a interface nunca trave. Enquanto você navega, processos pesados ocorrem em paralelo:
                 </p>
                 <div className="space-y-3">
                    {[
                      { l: "Ingestão via Celery", d: "Workers distribuídos para processamento de arquivos massivos." },
                      { l: "Broker de Mensagens Redis", d: "Sincronização em tempo real entre frontend e análise." },
                      { l: "Profiling Automático", d: "Descoberta de tipos e anomalias em background." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 p-3 bg-white rounded-2xl border border-gray-100">
                         <div className="w-1 h-auto bg-[#D4AF37] rounded-full" />
                         <div>
                            <span className="text-[11px] font-black text-black block">{item.l}</span>
                            <span className="text-[9px] text-gray-500 uppercase">{item.d}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white border-2 border-black rounded-[2rem] shadow-sm">
                     <span className="text-[9px] font-black text-gray-400 block uppercase mb-2">Cognition Engine</span>
                     <span className="text-xs font-bold text-black block">Amazon Bedrock</span>
                     <p className="text-[9px] text-gray-500 mt-1">Hospedagem segura de modelos Nova Pro.</p>
                  </div>
                  <div className="p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-[2rem]">
                     <span className="text-[9px] font-black text-[#D4AF37] block uppercase mb-2">Storage Layer</span>
                     <span className="text-xs font-bold text-black block">Amazon S3 Lakehouse</span>
                     <p className="text-[9px] text-gray-500 mt-1">Persistência em Parquet de alta performance.</p>
                  </div>
               </div>
               
               <div className="p-6 border border-gray-100 rounded-[2rem]">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Conectividade Híbrida</h4>
                  <div className="flex flex-wrap gap-2">
                     {["Snowflake", "Databricks", "BigQuery", "OpenShift", "RDS", "Redshift"].map((db, i) => (
                        <div key={i} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black text-black flex items-center gap-2 group hover:border-[#D4AF37] transition-all">
                           <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#D4AF37]" />
                           {db}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Fluxo de Vida do Dado",
      subtitle: "Da Ingestão Bruta ao Insight Cognitivo",
      icon: <ArrowRightLeft style={{ color: gold }} size={32} />,
      content: (
        <div className="space-y-8">
           <div className="relative p-12 bg-gray-50 rounded-[4rem] border border-gray-100 overflow-hidden">
              {/* Novo Diagrama: Life Cycle */}
              <div className="flex items-center justify-between gap-4">
                 {[
                   { n: "Ingestão", i: <Cloud size={20} />, d: "Upload & S3 Land" },
                   { n: "Orquestração", i: <Terminal size={20} />, d: "Celery Worker" },
                   { n: "Análise", i: <BrainCircuit size={20} />, d: "Agent Reason" },
                   { n: "Entrega", i: <Monitor size={20} />, d: "ECharts Viz" }
                 ].map((step, i, arr) => (
                    <React.Fragment key={i}>
                       <div className="flex flex-col items-center gap-4 flex-1">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-2 ${i === 2 ? 'bg-black text-white border-black shadow-2xl' : 'bg-white text-black border-gray-100'}`}>
                             {step.i}
                          </div>
                          <div className="text-center">
                             <span className="text-[11px] font-black text-black block uppercase tracking-tighter">{step.n}</span>
                             <span className="text-[9px] text-gray-400 font-bold">{step.d}</span>
                          </div>
                       </div>
                       {i < arr.length - 1 && (
                          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-[#D4AF37] to-gray-200 relative">
                             <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#D4AF37]" />
                          </div>
                       )}
                    </React.Fragment>
                 ))}
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-10">
              <div className="p-6 border-l-4 border-black space-y-2">
                 <h4 className="text-sm font-black text-black uppercase">Segurança & Sandbox</h4>
                 <p className="text-[11px] text-gray-500 leading-relaxed">
                    Todo código gerado pela camada de **Análise** é validado pelo **Agente Revisor** antes de ser executado em uma **Sandbox Isolada**, garantindo integridade total.
                 </p>
              </div>
              <div className="p-6 border-l-4 border-[#D4AF37] space-y-2">
                 <h4 className="text-sm font-black text-black uppercase">Inteligência Distribuída</h4>
                 <p className="text-[11px] text-gray-500 leading-relaxed">
                    O dado nunca deixa sua rede. Enviamos apenas os metadados (schema) para os modelos de linguagem em Bedrock, mantendo o conteúdo bruto protegido.
                 </p>
              </div>
           </div>
        </div>
      )
    },
    {
      title: "Arquitetura Multi-Camadas",
      subtitle: "Camadas Cognitivas e Funcionais",
      icon: <Layers style={{ color: gold }} size={32} />,
      content: (
        <div className="space-y-6">
           <div className="relative p-10 bg-gray-50 rounded-[3rem] border border-gray-100 overflow-hidden">
              <div className="flex flex-col items-center gap-4">
                 
                 {/* Layer 1: Frontend */}
                 <div className="w-full max-w-sm p-4 bg-white border-2 border-black rounded-2xl text-center shadow-lg relative group">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">Layer 01: Frontend Interface</div>
                    <Monitor size={16} className="mx-auto mb-2" />
                    <span className="text-[11px] font-black text-black">Next.js • ECharts • Tailwind Enterprise</span>
                 </div>

                 <ChevronRight className="rotate-90 text-gray-300" size={16} />

                 {/* Layer 2: Backend */}
                 <div className="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-2xl text-center shadow-sm relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-200 text-gray-600 text-[8px] font-black px-3 py-1 rounded-full uppercase">Layer 02: Backend Orquestration</div>
                    <Terminal size={16} className="mx-auto mb-2 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-600">Django Python • Celery Queue • Redis Hub</span>
                 </div>

                 <ChevronRight className="rotate-90 text-gray-300" size={16} />

                 {/* Layer 3: AI Agents - THE CORE */}
                 <div className="w-full max-w-lg p-6 bg-black text-white rounded-[2.5rem] shadow-2xl relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-[9px] font-black px-4 py-1 rounded-full uppercase shadow-lg">Layer 03: Multi-Agent System</div>
                    <div className="grid grid-cols-3 gap-3">
                       {[
                         { n: "Supervisor", d: "Maestro" },
                         { n: "NL2SQL", d: "Query Gen" },
                         { n: "Compliance", d: "Segurança" },
                         { n: "Especialistas", d: "Análise" },
                         { n: "Revisor", d: "Qualidade" },
                         { n: "Pandas", d: "Math" }
                       ].map((a, i) => (
                         <div key={i} className="p-2 border border-white/10 rounded-xl text-center bg-white/5">
                            <span className="text-[10px] font-black block" style={{ color: gold }}>{a.n}</span>
                            <span className="text-[8px] text-gray-400 uppercase">{a.d}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <ChevronRight className="rotate-90 text-gray-300" size={16} />

                 {/* Layer 4: Data Layer */}
                 <div className="w-full max-w-sm p-4 bg-[#D4AF37]/10 border-2 border-[#D4AF37] rounded-2xl text-center shadow-sm relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-[8px] font-black px-3 py-1 rounded-full uppercase">Layer 04: Analytical S3</div>
                    <Database size={16} className="mx-auto mb-2" style={{ color: gold }} />
                    <span className="text-[11px] font-black text-black">Parquet Lake • Glue Catalog • Athena</span>
                 </div>
              </div>
           </div>
        </div>
      )
    },
    {
      title: "Data Mesh & Governança",
      subtitle: "Gestão Federada e Soberania de Dados",
      icon: <Share2 style={{ color: gold }} size={32} />,
      content: (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 bg-gray-50 border border-gray-100 rounded-[3rem]">
                 <div className="flex items-center gap-3 mb-6">
                    <LayoutGrid style={{ color: gold }} size={24} />
                    <h4 className="text-lg font-black text-black uppercase tracking-tight">Domínios de Dados</h4>
                 </div>
                 <p className="text-xs text-gray-600 leading-relaxed">
                    A estrutura de **Data Mesh** permite que a responsabilidade pelos dados seja distribuída entre os domínios de negócio, tratando dados como produtos analíticos.
                 </p>
              </div>
              <div className="p-10 bg-gray-50 border border-gray-100 rounded-[3rem]">
                 <div className="flex items-center gap-3 mb-6">
                    <Search style={{ color: gold }} size={24} />
                    <h4 className="text-lg font-black text-black uppercase tracking-tight">Descoberta & Linhagem</h4>
                 </div>
                 <p className="text-xs text-gray-600 leading-relaxed">
                    Catálogo centralizado para busca semântica de ativos, garantindo que qualquer usuário autorizado possa encontrar e utilizar dados certificados.
                 </p>
              </div>
           </div>
           <div className="flex gap-4 items-center justify-center py-6">
              <CheckCircle2 style={{ color: gold }} size={20} />
              <span className="text-[11px] font-black text-black uppercase tracking-widest">Governança Integrada • Qualidade Certificada • Linhagem Clara</span>
           </div>
        </div>
      )
    },
    {
      title: "Funcionalidades & Inovação",
      subtitle: "Recursos Corporativos de Alta Performance",
      icon: <Zap style={{ color: gold }} size={32} />,
      content: (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { t: "Insights Automáticos", d: "Detecção proativa de anomalias e tendências de mercado." },
                { t: "Chat Analítico", d: "Conversação fluida com seus dados em linguagem natural." },
                { t: "Dashboards Dinâmicos", d: "Geração instantânea de visualizações ricas em ECharts." },
                { t: "Catálogo Mesh", d: "Navegação por ativos de dados organizados por domínios." },
                { t: "Shadowing IA", d: "Aprendizado contínuo sobre o comportamento analítico." },
                { t: "Segurança E2EE", d: "Criptografia ponta-a-ponta em todas as camadas." }
              ].map((func, i) => (
                <div key={i} className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                   <h5 className="text-[12px] font-black text-black uppercase mb-3" style={{ color: i % 2 === 0 ? gold : 'black' }}>{func.t}</h5>
                   <p className="text-[11px] text-gray-500 leading-tight">{func.d}</p>
                </div>
              ))}
           </div>
           <div className="mt-10 p-10 bg-black rounded-[4rem] text-center border-b-8 border-[#D4AF37] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-[100px] rounded-full" />
              <h4 className="text-2xl font-black text-white tracking-tighter mb-4 relative">Inovação Orientada a Resultados</h4>
              <p className="text-xs text-gray-400 max-w-2xl mx-auto mb-10 relative">
                 O Agent-BI redefine a interação homem-dado, transformando a complexidade técnica em clareza estratégica para toda a organização.
              </p>
              <button 
                onClick={onClose}
                className="px-16 py-5 bg-[#D4AF37] text-black rounded-2xl text-[13px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_20px_50px_rgba(212,175,55,0.4)] relative"
              >
                 Iniciar Experiência
              </button>
           </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-10 overflow-hidden font-sans">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative w-full max-w-[95vw] h-full md:h-[85vh] bg-white rounded-[5rem] shadow-[0_80px_150px_rgba(0,0,0,0.3)] flex flex-col md:flex-row overflow-hidden border border-gray-100"
          >
            {/* Sidebar Navigation */}
            <div className="w-full md:w-80 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-10 flex flex-col">
              <div className="mb-14 flex flex-col items-center">
                 <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center shadow-2xl mb-6 border-2 border-[#D4AF37]/20">
                    <Zap style={{ color: gold }} size={32} />
                 </div>
                 <div className="text-center">
                    <h3 className="text-2xl font-black text-black tracking-tighter leading-none mb-2">
                       AGENT-BI
                    </h3>
                    <div className="h-1 w-8 bg-[#D4AF37] rounded-full mx-auto" />
                 </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                {slides.map((slide, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-full p-5 rounded-[2rem] text-left transition-all flex items-center gap-4 border ${currentSlide === idx ? 'bg-white border-gray-200 shadow-2xl scale-[1.05] z-10' : 'hover:bg-black/5 border-transparent opacity-60'}`}
                  >
                    <div className={`text-[11px] font-black ${currentSlide === idx ? 'text-black' : 'text-gray-300'}`}>
                      0{idx + 1}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${currentSlide === idx ? 'text-black' : 'text-gray-400'}`}>
                      {slide.title.split(' ')[0]}
                    </span>
                    {currentSlide === idx && <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: gold }} />}
                  </button>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-gray-200 flex flex-col items-center">
                 <div className="flex items-center gap-2 mb-2">
                    <Globe size={14} className="text-gray-400" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enterprise Edition 4.0</span>
                 </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 md:p-16 flex flex-col relative overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.05),_transparent)]">
              <button 
                onClick={onClose}
                className="absolute top-10 right-10 p-5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all z-10"
              >
                <X size={28} />
              </button>

              <div className="flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-12"
                  >
                    {!slides[currentSlide].isIntro && (
                       <div className="space-y-3">
                          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full">
                             <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: gold }} />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: gold }}>{slides[currentSlide].subtitle}</span>
                          </div>
                          <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter leading-tight">
                             {slides[currentSlide].title}
                          </h2>
                       </div>
                    )}

                    <div className="w-full">
                       {slides[currentSlide].content}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Controls */}
              <div className="mt-auto pt-12 flex items-center justify-between">
                <div className="flex gap-4">
                  {slides.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-2 transition-all duration-700 rounded-full ${currentSlide === i ? 'w-16 shadow-[0_0_15px_rgba(212,175,55,0.5)]' : 'w-3 bg-gray-200'}`} 
                      style={{ backgroundColor: currentSlide === i ? gold : undefined }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-6">
                  <button 
                    onClick={handlePrev}
                    disabled={currentSlide === 0}
                    className="p-6 bg-gray-50 text-gray-400 rounded-3xl hover:bg-gray-200 disabled:opacity-10 transition-all border border-gray-100"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={currentSlide === slides.length - 1}
                    className="flex items-center gap-6 px-16 py-6 bg-black text-white rounded-[2.5rem] hover:scale-[1.05] transition-all shadow-[0_30px_60px_rgba(0,0,0,0.2)] group border-b-4 border-[#D4AF37]"
                  >
                    <span className="text-[12px] font-black uppercase tracking-widest">Próximo</span>
                    <ChevronRight size={22} style={{ color: gold }} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
