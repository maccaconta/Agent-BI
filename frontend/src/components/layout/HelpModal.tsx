import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  BookOpen, 
  BrainCircuit, 
  DatabaseZap, 
  Shield, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Coins, 
  Layers,
  Globe,
  Activity,
  Lock,
  ShieldAlert,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Server,
  Network,
  Eye,
  ArrowRightLeft,
  Cpu,
  Fingerprint,
  Terminal,
  Unplug,
  Workflow
} from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: "vision",
      icon: <Sparkles size={24} />,
      title: "Manifesto Tecnológico",
      subtitle: "A Nova Era da Inteligência de Dados",
      content: (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
          <header className="space-y-6">
            <h3 className="text-5xl font-serif font-black text-gray-900 tracking-tight leading-tight">
              A Convergência entre <span className="text-[#D4AF37]">Raciocínio</span> e <span className="text-[#D4AF37]">Escala</span>
            </h3>
            <p className="text-lg text-gray-500 font-medium max-w-4xl leading-relaxed">
              O Agent-BI não é apenas um dashboard de IA; é um ecossistema de **Agentes Cognitivos** que operam sob um paradigma de **Soberania de Dados**. Ao contrário de arquiteturas RAG convencionais que "leem" dados, nós "pensamos" sobre a estrutura e executamos em código, garantindo 100% de precisão numérica.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Cpu />, title: "Dual-Engine", desc: "Orquestração híbrida entre LLM para semântica e DuckDB para execução vetorial.", color: "text-blue-600" },
              { icon: <ShieldCheck />, title: "Zero-Trust", desc: "Isolamento total de threads. Nenhum dado bruto jamais deixa seu perímetro de segurança.", color: "text-emerald-600" },
              { icon: <Workflow />, title: "Multi-Agent", desc: "Pipeline federado: Supervisor, Especialista SQL e Designer de UX operando em paralelo.", color: "text-[#D4AF37]" },
              { icon: <Terminal />, title: "Code-First", desc: "A IA gera código executável (Python/SQL) em vez de apenas prever texto narrativo.", color: "text-purple-600" }
            ].map((item, i) => (
              <div key={i} className="bg-white border border-[#EAE5D9] p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-xl transition-all">
                <div className={`w-12 h-12 bg-gray-50 ${item.color} rounded-2xl flex items-center justify-center`}>{item.icon}</div>
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "architecture",
      icon: <Network size={24} />,
      title: "Engenharia de Camadas",
      subtitle: "Arquitetura Robusta e Desacoplada",
      content: (
        <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-8">
               <div className="space-y-4">
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Stack Tecnológica</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Nossa fundação é construída sobre componentes de classe mundial, garantindo que o sistema seja resiliente a falhas e otimizado para latência ultra-baixa.
                  </p>
               </div>
               
               <div className="space-y-4">
                  {[
                    { label: "Interface", val: "Next.js 15 + Framer Motion" },
                    { label: "Backplane", val: "Django 5.1 (Python 3.12)" },
                    { label: "Cérebro IA", val: "AWS Bedrock (Claude 3.5)" },
                    { label: "Analytics", val: "DuckDB / Pandas Engine" },
                    { label: "Storage", val: "E2EE Datalake (S3 Isolated)" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-[#EAE5D9] rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.label}</span>
                      <span className="text-xs font-black text-gray-900">{item.val}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-8 bg-gray-900 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5"><Layers size={300} /></div>
               <div className="relative z-10 space-y-12">
                  <div className="text-center space-y-2">
                    <h5 className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.4em]">Visualização do Pipeline</h5>
                    <div className="text-white text-lg font-serif">Fluxo de Dados & Cognição</div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-6">
                      <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                        <div className="text-[10px] font-black text-[#D4AF37] uppercase mb-1">Camada de Consumo</div>
                        <div className="text-white text-xs font-bold">App Client (Port 3000)</div>
                      </div>
                      <ArrowRightLeft className="text-white/20" />
                      <div className="flex-1 p-6 bg-white/10 border border-white/20 rounded-3xl text-center shadow-lg">
                        <div className="text-[10px] font-black text-[#D4AF37] uppercase mb-1">Cérebro Operacional</div>
                        <div className="text-white text-xs font-bold">Django API (Port 8000)</div>
                      </div>
                    </div>

                    <div className="flex justify-center h-12">
                      <div className="w-[2px] bg-gradient-to-b from-[#D4AF37] to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                         <div className="flex items-center gap-3 mb-2">
                            <DatabaseZap size={16} className="text-emerald-400" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">S3 Data Lake</span>
                         </div>
                         <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Ambiente isolado para persistência de datasets criptografados.</p>
                       </div>
                       <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                         <div className="flex items-center gap-3 mb-2">
                            <BrainCircuit size={16} className="text-blue-400" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">AWS Bedrock</span>
                         </div>
                         <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Infraestrutura LLM privada sem treinamento com seus dados.</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "security",
      icon: <Shield size={24} />,
      title: "Segurança & Criptografia",
      subtitle: "Blindagem de Dados em Nível Militar",
      content: (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-6 lg:col-span-2">
               <h4 className="text-2xl font-serif font-black text-gray-900 tracking-tight leading-tight">
                 Proteção Determinística: <br/><span className="text-[#D4AF37]">A IA não é o seu maior risco.</span>
               </h4>
               <p className="text-sm text-gray-500 leading-relaxed">
                 Diferente de interfaces de chat simples, o Agent-BI implementa **Guardrails** em tempo de execução. Todo código gerado pela IA passa por um analisador léxico antes de tocar no banco de dados.
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="text-emerald-600" size={20} />
                      <h5 className="font-black text-sm uppercase text-gray-900 tracking-tight">Criptografia E2EE</h5>
                    </div>
                    <ul className="space-y-3">
                      {[
                        "AES-256 em repouso para todos os datasets.",
                        "Chaves KMS gerenciadas pelo cliente.",
                        "TLS 1.3 obrigatório em trânsito.",
                        "Tokens de sessão de curta duração (15 min)."
                      ].map((li, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-emerald-800/70">
                          <CheckCircle2 size={12} className="mt-0.5" /> {li}
                        </li>
                      ))}
                    </ul>
                 </div>
                 <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldAlert className="text-red-600" size={20} />
                      <h5 className="font-black text-sm uppercase text-gray-900 tracking-tight">Guardrails Anti-Injeção</h5>
                    </div>
                    <ul className="space-y-3">
                      {[
                        "Bloqueio de DML (UPDATE, DELETE, INSERT).",
                        "Prevenção de execução de shell/processos.",
                        "Whitelisting de funções analíticas permitidas.",
                        "Timeout de execução forçado (Hard Limit)."
                      ].map((li, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-red-800/70">
                          <X size={12} className="mt-0.5" /> {li}
                        </li>
                      ))}
                    </ul>
                 </div>
               </div>
            </div>

            <div className="bg-white border border-[#EAE5D9] p-8 rounded-[3rem] space-y-8 flex flex-col justify-center">
               <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-900 text-[#D4AF37] rounded-3xl flex items-center justify-center mx-auto shadow-xl"><Fingerprint size={32} /></div>
                  <h5 className="text-lg font-black uppercase text-gray-900 tracking-tighter">Identidade & Auditoria</h5>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Cada consulta gerada pela IA é marcada com um **Audit Trace** imutável, permitindo rastreabilidade total de quem perguntou, o que foi gerado e qual foi o custo.
                  </p>
               </div>
               <div className="pt-6 border-t border-[#F1E9DB] space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black text-gray-400 uppercase">Compliance</span>
                     <span className="text-[10px] font-black text-emerald-600">LGPD / GDPR Ready</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black text-gray-400 uppercase">Isolation</span>
                     <span className="text-[10px] font-black text-blue-600">Multi-Tenant VPC</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "datamesh",
      icon: <Layers size={24} />,
      title: "Data Mesh & Inovação",
      subtitle: "Governança Federada para Escala Global",
      content: (
        <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <header className="space-y-4">
                <h4 className="text-3xl font-serif font-black text-gray-900 tracking-tight leading-tight">
                  Sua empresa não é um monólito. <br/><span className="text-[#D4AF37]">Seus dados também não.</span>
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  Implementamos o conceito de **Data Mesh**, onde cada departamento (Domínio) gerencia seus próprios ativos de dados e especialistas de IA. Isso elimina o gargalo da TI centralizada.
                </p>
              </header>

              <div className="space-y-4">
                <div className="p-6 bg-[#FDF9F0] border border-[#F1E9DB] rounded-3xl flex items-center gap-6 group hover:shadow-lg transition-all">
                   <div className="p-4 bg-white rounded-2xl text-[#D4AF37] shadow-sm group-hover:scale-110 transition-transform"><Globe size={24}/></div>
                   <div>
                      <h5 className="text-xs font-black uppercase text-gray-900">Domínios Federados</h5>
                      <p className="text-[10px] text-gray-500 mt-1">Conhecimento especializado por área de negócio (Finanças, RH, Sales).</p>
                   </div>
                </div>
                <div className="p-6 bg-[#FDF9F0] border border-[#F1E9DB] rounded-3xl flex items-center gap-6 group hover:shadow-lg transition-all">
                   <div className="p-4 bg-white rounded-2xl text-[#D4AF37] shadow-sm group-hover:scale-110 transition-transform"><Unplug size={24}/></div>
                   <div>
                      <h5 className="text-xs font-black uppercase text-gray-900">Desacoplamento de Infra</h5>
                      <p className="text-[10px] text-gray-500 mt-1">Substitua sua fonte de dados sem quebrar seus dashboards inteligentes.</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-12 rounded-[4rem] text-white space-y-12 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5"><Activity size={200} /></div>
               <div className="space-y-6">
                  <h5 className="text-lg font-black uppercase text-[#D4AF37]">Economia de Tokens & Performance</h5>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Nossa tecnologia de **Compressão de Contexto Semântico** reduz a carga de tokens enviada para o Bedrock em até 60%, garantindo que insights complexos custem frações de centavos.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
                  <div className="space-y-1 text-center">
                    <div className="text-3xl font-black text-[#D4AF37]">98.2%</div>
                    <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Acurácia SQL</div>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="text-3xl font-black text-[#D4AF37]">Zero</div>
                    <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Data Leakage</div>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="text-3xl font-black text-[#D4AF37]">&lt; 5s</div>
                    <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Warm Start</div>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="text-3xl font-black text-[#D4AF37]">∞</div>
                    <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Escalabilidade</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const CheckCircle2 = ({ size, className }: { size?: number, className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className="relative w-full max-w-7xl h-[85vh] bg-[#FDFCF8] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col border border-[#EAE5D9]"
        >
          {/* Header Progress Bar */}
          <div className="absolute top-0 left-0 w-full flex h-2 gap-1.5 p-1.5 z-20">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-full transition-all duration-1000 ${i === currentSlide ? "bg-[#D4AF37]" : i < currentSlide ? "bg-gray-900" : "bg-gray-200"}`} 
              />
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 z-30 p-4 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-all group"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform" />
          </button>

          {/* Main Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Nav Sidebar - Now Wider and more technical */}
            <div className="w-80 border-r border-[#F1E9DB] p-12 bg-[#F9F7F0]/40 hidden lg:flex flex-col gap-10">
              <div className="space-y-2">
                <div className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Engine Specification</div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Guia Técnico</h2>
              </div>

              <div className="flex flex-col gap-3">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSlide(i)}
                    className={`
                      flex items-center gap-5 px-6 py-4 rounded-[2rem] transition-all text-left group
                      ${i === currentSlide 
                        ? "bg-white text-gray-900 shadow-xl translate-x-3 border border-[#F1E9DB]" 
                        : "text-gray-400 hover:text-[#D4AF37] hover:bg-white/50"}
                    `}
                  >
                    <div className={`${i === currentSlide ? "text-[#D4AF37]" : "text-gray-300 group-hover:text-[#D4AF37] transition-colors"}`}>{s.icon}</div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest">{s.title}</span>
                       <span className="text-[8px] font-bold opacity-40 uppercase tracking-tight">Slide {i + 1}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-auto space-y-6 pt-10 border-t border-[#F1E9DB]">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                       <ShieldCheck size={14} className="text-[#D4AF37]" /> Enterprise Verified
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                       <Lock size={14} className="text-emerald-500" /> End-to-End Encrypted
                    </div>
                 </div>
                 <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
                   Este guia detalha os aspectos fundamentais da arquitetura Agent-BI v2.5.
                 </p>
              </div>
            </div>

            {/* Content Display Area - More Spaced and Luxurious */}
            <div className="flex-1 p-16 relative flex flex-col bg-[#FDFCF8]">
               <div className="mb-14 animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="text-[12px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-4">{slides[currentSlide].subtitle}</div>
                  <h2 className="text-5xl font-serif font-black text-gray-900 tracking-tight leading-tight uppercase">{slides[currentSlide].title}</h2>
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                  {slides[currentSlide].content}
               </div>

               {/* Modern Sticky Controls at the bottom */}
               <div className="pt-10 mt-auto border-t border-[#F1E9DB] flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={currentSlide === 0}
                    className="flex items-center gap-3 px-8 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 disabled:opacity-0 transition-all group"
                  >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar
                  </button>

                  <div className="flex gap-3">
                    {slides.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-700 ${i === currentSlide ? "bg-[#D4AF37] w-12" : "bg-gray-200 w-3"}`}
                      />
                    ))}
                  </div>

                  {currentSlide < slides.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-4 px-12 py-5 bg-gray-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:shadow-2xl hover:scale-105 transition-all group"
                    >
                      Explorar Mais <ChevronRight size={20} className="group-translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="flex items-center gap-4 px-12 py-5 bg-[#D4AF37] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-110 transition-all"
                    >
                      Iniciar Dashboard <Sparkles size={20} />
                    </button>
                  )}
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
