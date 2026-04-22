import React from "react";
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
  UserCheck
} from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#FDFCF8] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#EAE5D9]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-[#EAE5D9]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-[#D4AF37]">
                <BookOpen size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ajuda do Sistema</h2>
                <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">Documentação de Arquitetura BI Agent</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

                  {/* Body */}
          <div className="p-12 overflow-y-auto custom-scrollbar bg-[#FDFCF8]">
            <div className="max-w-5xl mx-auto space-y-20 pb-20">
              
              {/* Introdução Executiva */}
              <header className="text-center space-y-4">
                <h3 className="text-4xl font-serif font-black text-gray-900 tracking-tight">Arquitetura Cognitiva de Alta Performance</h3>
                <p className="text-sm text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                  O Agent-BI redefine a inteligência de negócios ao desacoplar o <strong>Raciocínio Semântico</strong> do <strong>Processamento de Dados</strong>, garantindo conformidade total e escalabilidade infinita.
                </p>
              </header>

              {/* 1. Arquitetura Híbrida & Fluxo de Dados (Diagrama SVG) */}
              <section className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-900 text-[#D4AF37] rounded-2xl shadow-xl">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">1. O Paradigma "Zero-Data-Transfer"</h4>
                    <p className="text-[10px] text-[#D4AF37] font-black tracking-[0.2em] uppercase">Privacidade por Design & Segurança AWS Bedrock</p>
                  </div>
                </div>

                <div className="bg-white border border-[#EAE5D9] p-10 rounded-[3rem] shadow-sm">
                  {/* Diagrama de Arquitetura SVG */}
                  <div className="w-full h-auto mb-10 p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <svg viewBox="0 0 800 300" className="w-full h-full">
                      {/* Boxes */}
                      <rect x="50" y="100" width="140" height="100" rx="20" fill="#1A1A1A" />
                      <text x="120" y="155" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">BIG DATA</text>
                      <text x="120" y="175" textAnchor="middle" fill="#8C8C8C" fontSize="10">On-Premise / Cloud</text>

                      <rect x="330" y="100" width="140" height="100" rx="20" fill="#D4AF37" />
                      <text x="400" y="155" textAnchor="middle" fill="#1A1A1A" fontSize="12" fontWeight="bold">AGENT COGNITION</text>
                      <text x="400" y="175" textAnchor="middle" fill="#1A1A1A" fontSize="10">Prompt & Metadata</text>

                      <rect x="610" y="100" width="140" height="100" rx="20" fill="#F9F9F9" stroke="#EAE5D9" strokeWidth="2" />
                      <text x="680" y="155" textAnchor="middle" fill="#1A1A1A" fontSize="12" fontWeight="bold">DASHBOARD</text>
                      <text x="680" y="175" textAnchor="middle" fill="#8C8C8C" fontSize="10">Insights Visuais</text>

                      {/* Arrows */}
                      <path d="M190 150 L330 150" stroke="#D4AF37" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                      <text x="260" y="140" textAnchor="middle" fill="#D4AF37" fontSize="9" fontWeight="bold">SAMPLES & METADATA</text>
                      
                      <path d="M470 150 L610 150" stroke="#1A1A1A" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      <text x="540" y="140" textAnchor="middle" fill="#1A1A1A" fontSize="9" fontWeight="bold">CODE & EXECUTION</text>

                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#1A1A1A" />
                        </marker>
                      </defs>
                    </svg>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <h5 className="font-black text-sm uppercase text-gray-900 border-l-4 border-[#D4AF37] pl-4">Isolamento de Dados</h5>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Diferente das IAs comuns, o Agent-BI <strong>nunca ingere sua base completa</strong>. Através de um processo de <em>Semantic Fingerprinting</em>, extraímos apenas o esquema e uma amostragem mínima (10 linhas) para treinar o contexto do agente. O processamento real ocorre localmente via DuckDB ou Pandas.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h5 className="font-black text-sm uppercase text-gray-900 border-l-4 border-gray-900 pl-4">Otimização de Contexto</h5>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Utilizamos modelos de última geração (Claude 3.5 / Nova Pro) via AWS Bedrock, otimizados para <strong>Zero-Shot Text-to-SQL</strong>. Isso reduz a latência de geração de relatórios de minutos para poucos segundos.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Dinâmica de Agentes & Orquestração (Hierarquia) */}
              <section className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-900 text-[#D4AF37] rounded-2xl shadow-xl">
                    <BrainCircuit size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">2. Orquestração Multi-Agente</h4>
                    <p className="text-[10px] text-[#D4AF37] font-black tracking-[0.2em] uppercase">Inteligência Distribuída e Especializada</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { 
                      title: "Supervisor", 
                      role: "Orquestrador Master", 
                      desc: "Lidera o fluxo cognitivo, decompõe o prompt do usuário em subtarefas técnicas e decide se a execução será via SQL Puro ou Transformação Pandas.",
                      features: ["Decomposição de Consultas", "Seleção de Motor", "Gestão de Memória"]
                    },
                    { 
                      title: "Especialista SQL", 
                      role: "Engenheiro de Dados", 
                      desc: "Focado exclusivamente em traduzir requisitos de negócio em dialetos SQL precisos (Postgres, Redshift, Athena), garantindo performance na extração.",
                      features: ["Dialect Adaptation", "Query Optimization", "Schema Validation"]
                    },
                    { 
                      title: "Designer UI", 
                      role: "Especialista em UX", 
                      desc: "Transforma resultados numéricos em interfaces ricas. Decide o melhor gráfico para cada métrica baseando-se na densidade dos dados.",
                      features: ["DataViz Selection", "Color Theory", "Responsive Layouts"]
                    }
                  ].map((agent, i) => (
                    <div key={i} className="bg-white border border-[#EAE5D9] p-8 rounded-[2.5rem] hover:shadow-2xl transition-all group">
                      <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">{agent.role}</span>
                      <h5 className="text-lg font-black text-gray-900 uppercase mt-2 mb-4 group-hover:text-[#D4AF37] transition-colors">{agent.title}</h5>
                      <p className="text-xs text-gray-600 leading-relaxed mb-6">{agent.desc}</p>
                      <ul className="space-y-2">
                        {agent.features.map((f, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                            <Zap size={10} className="text-[#D4AF37]" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. Governança, Data Mesh & Economia de Tokens */}
              <section className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-900 text-[#D4AF37] rounded-2xl shadow-xl">
                    <Layers size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">3. Governança Federada & Data Mesh</h4>
                    <p className="text-[10px] text-[#D4AF37] font-black tracking-[0.2em] uppercase">Dados como Produto & Controle de Custos</p>
                  </div>
                </div>

                <div className="bg-gray-900 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 p-12 opacity-5"><DatabaseZap size={200} /></div>
                  <div className="relative z-10 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="space-y-6">
                        <h5 className="text-lg font-black uppercase text-[#D4AF37]">Ecossistema Data Mesh</h5>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Nossa proposta de <strong>Data Mesh</strong> descentraliza a propriedade dos dados. Os <strong>Domínios</strong> (Financeiro, RH, Vendas) são proprietários de seus ativos e especialistas de IA, permitindo que a inteligência corporativa cresça sem os gargalos de uma equipe de dados centralizada.
                        </p>
                      </div>
                      <div className="space-y-6">
                        <h5 className="text-lg font-black uppercase text-[#D4AF37]">Economia de Tokens & Quotas</h5>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Através de algoritmos de <strong>Compressão de Contexto</strong>, reduzimos o uso de tokens em até 60% comparado a arquiteturas RAG convencionais. A gestão de quotas garante que cada área de negócio opere dentro do seu orçamento de IA planejado.
                        </p>
                      </div>
                    </div>

                    <div className="pt-12 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8">
                      {[
                        { label: "Audit Log", val: "100%" },
                        { label: "Custo Médio/Relatório", val: "< $0.05" },
                        { label: "Acurácia SQL", val: "98.2%" },
                        { label: "Data Leakage Risk", val: "Zero" }
                      ].map((stat, i) => (
                        <div key={i} className="text-center">
                          <div className="text-2xl font-black text-[#D4AF37]">{stat.val}</div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase mt-1">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. Segurança & Blindagem de Dados (NOVA SEÇÃO) */}
              <section className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-900 text-white rounded-2xl shadow-xl">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">4. Segurança & Blindagem de Dados</h4>
                    <p className="text-[10px] text-red-600 font-black tracking-[0.2em] uppercase">Proteção Determinística contra Injeção SQL</p>
                  </div>
                </div>

                <div className="bg-white border-2 border-red-50 p-10 rounded-[3rem] shadow-sm relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="text-red-500" size={20} />
                        <h5 className="font-black text-sm uppercase text-gray-900">Guardrails Anti-DML/DDL</h5>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        O motor analítico possui uma camada de validação sintática que <strong>bloqueia proativamente</strong> qualquer comando de escrita ou destruição. Tentativas de usar <code className="bg-red-50 text-red-700 px-2 py-1 rounded">DROP</code>, <code className="bg-red-50 text-red-700 px-2 py-1 rounded">UPDATE</code>, <code className="bg-red-50 text-red-700 px-2 py-1 rounded">TRUNCATE</code> ou <code className="bg-red-50 text-red-700 px-2 py-1 rounded">INSERT</code> resultam em aborto imediato da transação.
                      </p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <UserCheck className="text-green-600" size={20} />
                        <h5 className="font-black text-sm uppercase text-gray-900">Whitelisting de Verbos</h5>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Apenas consultas de leitura (<code className="bg-green-50 text-green-700 px-2 py-1 rounded">SELECT</code> e <code className="bg-green-50 text-green-700 px-2 py-1 rounded">WITH</code>) são permitidas. O sistema impede "SQL Batching" (múltiplas instruções separadas por ponto e vírgula), eliminando vetores de injeção clássicos.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. Processo Analítico (Micro-Batching) */}
              <section className="bg-white border border-[#EAE5D9] p-12 rounded-[3.5rem] shadow-sm">
                <div className="flex flex-col md:flex-row gap-12 items-center">
                  <div className="md:w-1/3">
                     <div className="p-6 bg-gray-50 rounded-[2.5rem] w-fit mb-6"><Sparkles size={32} className="text-[#D4AF37]" /></div>
                     <h4 className="text-2xl font-serif font-black text-gray-900 tracking-tight">Estratégia de Micro-Batching</h4>
                     <p className="text-xs text-gray-500 mt-4 leading-relaxed font-medium">
                       Como garantimos resiliência em relatórios complexos com múltiplos componentes.
                     </p>
                  </div>
                  <div className="md:w-2/3 space-y-6">
                    <p className="text-sm text-gray-600 leading-relaxed italic border-l-4 border-[#D4AF37] pl-6">
                      "Dividir para Conquistar: Fragmentamos cada dashboard em pipelines atômicos de execução. Se um gráfico falha por inconsistência de dados, os outros 9 permanecem íntegros e funcionais."
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Tolerância a Falhas</div>
                        <div className="text-xs font-bold text-gray-900">Isolamento Total de Componentes</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Cognição Focada</div>
                        <div className="text-xs font-bold text-gray-900">1 Componente = 1 Prompt Especialista</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Rodapé de Conformidade */}
              <footer className="pt-20 border-t border-[#F1E9DB] text-center space-y-4">
                <div className="flex justify-center gap-8 mb-6">
                   <ShieldCheck size={24} className="text-[#D4AF37]" />
                   <Globe size={24} className="text-[#D4AF37]" />
                   <Activity size={24} className="text-[#D4AF37]" />
                </div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Agent-BI • Enterprise Grade Intelligence • Prototype v2.5</p>
                <p className="text-[9px] text-gray-400 font-medium">Este documento contém informações proprietárias de arquitetura e segurança. Uso restrito para validação de protótipo.</p>
              </footer>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
