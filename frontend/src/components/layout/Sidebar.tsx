"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Database,
  Shuffle,
  Workflow,
  Settings,
  ChevronRight,
  BarChart3,
  ShieldCheck,
  Cpu,
  Globe,
  Compass,
  Activity,
  Sparkles,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import HelpModal from "./HelpModal";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Itens de dominio suspensos para manter a interface limpa

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, getRole, logout } = useAuth();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const currentRole = getRole();
  const isAdmin = user?.is_super_admin || currentRole === "ADMIN" || currentRole === "OWNER";
  const isCriador = currentRole === "ANALYST";
  const isVisualizador = currentRole === "VIEWER";

  const menuItems = [
    { name: "1. Governanca Corporativa", icon: <ShieldCheck size={18} />, path: `/projects/${params.id}` },
    { name: "2. Fontes de Dados AWS", icon: <Database size={18} />, path: `/projects/${params.id}/sources` },
    { name: "3. Agente BI Generativo", icon: <Sparkles size={18} />, path: `/dashboard/generate?project_id=${params.id}` },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[320px] bg-lux-bg/95 backdrop-blur-2xl z-[70] shadow-[10px_0_40px_rgba(0,0,0,0.1)] border-r border-lux-border/30 p-8 flex flex-col transition-colors duration-500"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lux-text text-lux-bg flex items-center justify-center shadow-lg">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-lux-text leading-none">Navegacao do Projeto</h2>
                  <span className="text-[10px] uppercase font-bold text-lux-muted tracking-widest">Fluxo guiado</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-lux-border/20 rounded-full text-lux-muted transition-colors">
                <X size={20} />
              </button>
            </div>

            {params.id && !isVisualizador && (
              <div className="mb-10">
                <p className="text-[10px] uppercase font-bold text-lux-muted mb-4 tracking-[0.2em] px-2 flex items-center gap-2">
                  <Compass size={12} /> Etapas do projeto
                </p>
                <div className="space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={onClose}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                        pathname === item.path
                          ? "bg-lux-text text-lux-bg shadow-xl scale-105"
                          : "text-lux-muted hover:bg-lux-border/20 hover:text-lux-text"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-sm font-semibold tracking-tight">{item.name}</span>
                      </div>
                      <ChevronRight size={14} className={`transition-transform group-hover:translate-x-1 ${pathname === item.path ? "opacity-100" : "opacity-0"}`} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-10">
              <p className="text-[10px] uppercase font-bold text-lux-muted mb-4 tracking-[0.2em] px-2 flex items-center gap-2">
                <Globe size={12} /> Ativos de Dados
              </p>
              <Link
                href="/catalog"
                onClick={onClose}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  pathname === "/catalog"
                    ? "bg-[#1A1A1A] text-white shadow-xl"
                    : "text-lux-muted hover:bg-lux-border/20 hover:text-lux-text"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={18} />
                  <span className="text-sm font-semibold tracking-tight">Catálogo de Dados</span>
                </div>
                <div className="px-2 py-0.5 bg-[#D4AF37] text-[8px] font-black text-white rounded-md uppercase tracking-tighter">Mesh</div>
              </Link>
            </div>

            {params.id && isVisualizador && (
              <div className="mb-10">
                 <Link
                    href={`/dashboard/generate?project_id=${params.id}`}
                    onClick={onClose}
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                      pathname?.includes("/dashboard/generate")
                        ? "bg-lux-text text-lux-bg shadow-xl scale-105"
                        : "text-lux-muted hover:bg-lux-border/20 hover:text-lux-text"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} />
                      <span className="text-sm font-semibold tracking-tight">Análise e Relatórios BI</span>
                    </div>
                  </Link>
              </div>
            )}


            <div className="pt-6 border-t border-lux-border/20">
              <div className="mb-4">
                <p className="text-[10px] uppercase font-bold text-lux-muted mb-4 tracking-[0.2em] px-2 flex items-center gap-2">
                  <Settings size={12} /> Administração
                </p>
                {(isAdmin || isCriador) && (
                  <Link 
                    href="/admin/prompts"
                    onClick={onClose}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                      pathname === "/admin/prompts"
                        ? "bg-[#D4AF37] text-white shadow-lg"
                        : "text-lux-muted hover:bg-[#FDF9F0] hover:text-[#D4AF37]"
                    }`}
                  >
                    <Cpu size={18} />
                    <span className="text-sm font-bold tracking-tight">Governança</span>
                  </Link>
                )}
                <button 
                  onClick={() => setIsHelpOpen(true)}
                  className="w-full mt-2 flex items-center gap-3 p-4 rounded-2xl transition-all text-lux-muted hover:bg-[#FDF9F0] hover:text-[#D4AF37]"
                >
                  <BookOpen size={18} />
                  <span className="text-sm font-bold tracking-tight text-left">Ajuda de Arquitetura RAG</span>
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-lux-bg/40 border border-lux-border/20 rounded-3xl mb-4 group-hover:border-lux-text/20 transition-all">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 animate-pulse">
                  <Activity size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-lux-text uppercase tracking-tighter">Status Cloud</p>
                  <p className="text-[9px] text-lux-muted opacity-70">AWS Pipeline Stable</p>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-red-500 hover:bg-red-50 hover:text-red-600 font-bold"
              >
                <LogOut size={18} />
                <span className="text-sm tracking-tight text-left">Encerrar Sessão</span>
              </button>
            </div>
          </motion.div>
          <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </>
      )}
    </AnimatePresence>
  );
}
