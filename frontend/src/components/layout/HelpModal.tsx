import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, BrainCircuit, DatabaseZap } from "lucide-react";

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
          <div className="p-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-8">
              <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <DatabaseZap className="text-[#D4AF37]" size={24} />
                  <h3 className="text-lg font-black text-gray-900 uppercase">Processamento e Ingestão de Dados</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  O Agent-BI utiliza uma arquitetura híbrida de execução. Quando uma nova fonte de dados de 1 Milhão de linhas de clientes é conectada, o sistema <strong>NUNCA envia todas as linhas</strong> para a Nuvem ou para a Inteligência Artificial (AWS Bedrock). Enviar grandes volumes esgotaria os limites de processamento da IA e causaria esquecimento cognitivo (Lost in the Middle).
                </p>
                <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Fluxo de Extração Segura</h4>
                  <ul className="text-sm text-gray-600 space-y-3">
                    <li className="flex items-start gap-2">
                       <span className="text-[#D4AF37] font-bold">1.</span>
                       <span><strong>Estatística Local Segura:</strong> O sistema realiza o cálculo intensivo (extremos, volumetria) na própria infraestrutura do banco de dados relacional e motor analítico sem envolver a IA.</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-[#D4AF37] font-bold">2.</span>
                       <span><strong>O Ponto Exato de Amostragem (Apenas 5-10 linhas):</strong> Para que os modelos (Claude/Nova) entendam a regra de negócio do formato das colunas, enviamos apenas de 5 a 10 linhas como amostra contextual. Esse é o "ponto de ouro" da inteligência artificial: estatisticamente o bastante para distinguir metadados, mas enxuto para evitar ruído e dispersão.</span>
                    </li>
                    <li className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-200/50">
                       <span className="text-[#D4AF37] font-bold">3.</span>
                       <span><strong>Payload Otimizado & AWS Bedrock Pricing:</strong> Nosso motor consolida as amostras em prompts com média de ~15.000 caracteres (3.000 a 4.000 tokens de input). Modelos high-end suportam até 300k tokens, mas enviar payloads gigantes provoca o fenômeno de "Lost in the Middle" (onde a IA ignora regras centrais). Manter prompts enxutos de 4k tokens garante foco total da IA na escrita de SQL preciso, latência milissegundos, e um custo irrisório pela tabela de preços do AWS Bedrock, mitigando riscos de estouro de billing e permitindo o escalonamento para múltiplos agentes de Data Science.</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <BrainCircuit className="text-[#D4AF37]" size={24} />
                  <h3 className="text-lg font-black text-gray-900 uppercase">Engenharia Autônoma de Relatórios</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Trabalhamos com o modelo "Data Planner / Executor". Com seus <strong>Metadados, Identificadores Semânticos e 5 a 10 Linhas de Amostra</strong>, a LLM redige instantaneamente Diagnósticos Estratégicos C-Level precisos. A IA atua orquestrando e programando os códigos de extração de dados (SQL ou Python Pandas), que são devolvidos à máquina e rodam localmente para prover 100% de precisão sobre a Big Data real da sua empresa. Nenhuma linha de dado privado extra é transferida. É a união entre a cognição semântica e a segurança/perfomance computacional on-premise.
                </p>
              </section>

              <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="text-[#D4AF37]" size={24} />
                  <h3 className="text-lg font-black text-gray-900 uppercase">Orquestração Isolada de Pipelines (Micro-Batching)</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  O painel orquestra a geração de suas visualizações analíticas particionando as chamadas à inteligência artificial por métrica ou componente de forma assíncrona. Por exemplo, caso um layout componha 7 gráficos (Widgets), o Agent-BI executa 7 pipelines de Text-to-SQL distintos em vez de agrupá-los em um único grande bloco ao provedor da nuvem.
                </p>
                <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Fundamentos Técnicos da Abordagem Particionada</h4>
                  <ul className="text-sm text-gray-600 space-y-3">
                     <li className="flex items-start gap-2">
                       <span className="text-[#D4AF37] font-bold">1.</span>
                       <span><strong>Resiliência e Isolação de Falhas (Fault Tolerance):</strong> Em uma requisição monolítica contendo todas as variáveis e esquemas, uma única regressão ou alucinação semântica ao gerar o 4º gráfico poderia interromper ou invalidar a estrutura do relatorio inteiro (JSON Schema corrompido). Na arquitetura isolada, uma falha na injeção SQL afeta apenas o widget correspondente, garantindo alta disponibilidade da interface principal com os componentes remanescentes intactos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-[#D4AF37] font-bold">2.</span>
                       <span><strong>Telecomunicação Segura de Payload:</strong> A geração técnica de estruturas robustas com 7 SQLs e JSONs compostos consome largamente limites de respostas longas em APIs (frequentemente fixadas em máximos de 4096 output tokens nas principais fundações). A fragmentação neutraliza gargalos e falhas sistêmicas por truncamento da resposta do servidor modelo.</span>
                    </li>
                    <li className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-200/50">
                       <span className="text-[#D4AF37] font-bold">3.</span>
                       <span><strong>Hiper-Especialização Cognitiva:</strong> Ao estreitar a lente inferencial a deduzir a lógica exata de uma única dimensão (ex: 'Atrasos vs Segmento'), as probabilidades de o modelo cruzar incorretamente lógicas distintas entre relatórios diferentes caem substancialmente. O mecanismo atinge níveis cirúrgicos em arquitetura de dados sem misturar restrições das cláusulas WHERE de lógicas complexas.</span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
