"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Database, Shield } from "lucide-react";
import Link from "next/link";

const FloatingSymbols = () => {
  const symbols = ["Σ", "Δ", "σ", "f(x)", "0", "1", "α", "β", "Ω", "√", "λ", "μ", "π", "∫"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.6]">
      {/* Grupo Esquerdo */}
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.span
          key={`left-${i}`}
          initial={{ 
            left: `${Math.random() * 20}%`,
            y: "110vh",
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: "-10vh",
            opacity: [0, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: Math.random() * 30 + 30, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * -60
          }}
          className="absolute text-[#1A1A1A] font-serif text-2xl md:text-3xl"
        >
          {symbols[i % symbols.length]}
        </motion.span>
      ))}

      {/* Grupo Central — emerge do meio */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.span
          key={`center-${i}`}
          initial={{ 
            left: `${30 + Math.random() * 40}%`,
            y: "110vh",
            opacity: 0,
            scale: Math.random() * 0.4 + 0.3
          }}
          animate={{ 
            y: "-10vh",
            opacity: [0, 0.6, 0],
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: Math.random() * 40 + 40, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * -80
          }}
          className="absolute text-[#1A1A1A] font-serif text-sm md:text-base"
        >
          {symbols[i % symbols.length]}
        </motion.span>
      ))}
      
      {/* Grupo Direito */}
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.span
          key={`right-${i}`}
          initial={{ 
            right: `${Math.random() * 20}%`,
            y: "110vh",
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: "-10vh",
            opacity: [0, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: Math.random() * 30 + 30, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * -60
          }}
          className="absolute text-[#1A1A1A] font-serif text-2xl md:text-3xl"
        >
          {symbols[i % symbols.length]}
        </motion.span>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center px-4 py-4 md:px-24 md:py-14 relative overflow-hidden bg-white">


      <FloatingSymbols />

      {/* Ornamentos Dourados Superiores */}
      <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 200 200" className="w-full h-full text-[#D4AF37]">
          <path d="M0,0 L200,0 L200,200 Z" fill="currentColor" fillOpacity="0.1" />
          <path d="M20,20 L180,20 L180,180 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="180" cy="20" r="10" fill="currentColor" />
        </svg>
      </div>

      <motion.main 
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel w-full max-w-6xl z-10 p-6 md:p-10 text-center flex flex-col items-center justify-between h-full overflow-hidden bg-white/50 border-white/40"
      >
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="mb-4 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8C8C8C] mb-2">Strategic Innovation Partners</span>
          <div className="flex items-center gap-6 md:gap-10 px-10 py-4 rounded-[3rem] bg-white/90 border border-[#F1E9DB]/60 backdrop-blur-2xl shadow-[0_15px_35px_rgba(241,233,219,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex flex-col items-center hover:scale-105 transition-transform duration-300">
               <img src="/logos/ntt-data-black.png" alt="NTT DATA" className="h-5 md:h-7 w-auto object-contain" />
            </div>

            <div className="w-px h-6 bg-[#F1E9DB]" />

            <div className="flex flex-col items-center hover:scale-105 transition-transform duration-300">
               <img src="/logos/aws-partner.png" alt="AWS" className="h-4 md:h-6 w-auto object-contain" />
            </div>

            <div className="w-px h-6 bg-[#F1E9DB]" />

            <div className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
               <span className="text-[7px] font-black uppercase tracking-widest text-[#8C8C8C] hidden sm:block italic opacity-40">para</span>
               <img src="/logos/bwgi.png" alt="BWGI" className="h-6 md:h-8 w-auto object-contain" />
            </div>
          </div>
        </motion.div>

        <div className="mb-6">
          <h1 className="font-serif text-4xl md:text-7xl font-black tracking-tighter text-lux-text mb-4 relative inline-block">
            Agent BI
            <span className="absolute -top-3 -right-6 text-[8px] md:text-[9px] bg-[#1A1A1A] text-[#D4AF37] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-xl rotate-12 border border-[#D4AF37]/20">
              Protótipo
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-lux-muted max-w-4xl mx-auto font-light leading-snug">
            Uma iniciativa estratégica de <span className="text-[#1A1A1A] font-bold">inovação NTT DATA & AWS</span> desenvolvida exclusivamente para a excelência do ecossistema <span className="text-[#D4AF37] font-serif italic font-bold text-3xl align-middle mx-1">BWGI</span>.
          </p>
        </div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mb-8"
        >
          <Link href="/projects" className="group relative px-10 py-4 bg-[#1A1A1A] text-white rounded-full text-lg md:text-xl font-bold tracking-wide shadow-xl hover:shadow-[0_20px_40px_rgba(212,175,55,0.2)] transition-all overflow-hidden flex items-center gap-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            Iniciar Experiência <ArrowRight size={22} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-left bg-white/40 p-6 md:p-8 rounded-[3rem] border border-[#F1E9DB] backdrop-blur-md">
          <motion.div whileHover={{ y: -4 }} className="space-y-4">
            <div className="w-10 h-10 bg-[#1A1A1A] text-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg">
              <Database size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-black font-serif text-lux-text tracking-tight">Multi-Agentes GenIA</h3>
              <p className="text-lux-muted text-[10px] leading-tight font-medium">Plataforma de inteligência corporativa baseada na orquestração de múltiplos agentes de IA: consulta em linguagem natural (NL2SQL), compliance e design de BI.</p>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-white/20">
                <img src="/logos/AWS-Bedrock.png" alt="Bedrock" className="w-full h-full object-cover scale-110" />
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-300/30">
                <img src="/logos/amazon-nova.png" alt="Nova Pro" className="w-6 h-6 object-contain" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black font-serif text-lux-text tracking-tight">AWS Bedrock</h3>
              <p className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent mb-1">Amazon Nova Pro Model</p>
              <p className="text-lux-muted text-xs leading-tight font-medium">O motor de modelos de fundação mais avançado da AWS aplicado ao negócio.</p>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="space-y-4">
            <div className="w-10 h-10 bg-[#1A1A1A] text-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg">
              <Shield size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-black font-serif text-lux-text tracking-tight">Governança Tier-1</h3>
              <p className="text-lux-muted text-xs leading-tight font-medium">Controle institucional absoluto com trilhas de auditoria imutáveis e segurança nativa.</p>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
