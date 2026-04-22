"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User, Menu, Moon, Sun, LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-lux-bg/90 backdrop-blur-xl border-b border-lux-border/30 px-6 lg:px-10 py-4 flex items-center justify-between transition-colors duration-500 shadow-sm">
        <div className="flex items-center gap-6 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-lux-border/20 rounded-xl text-lux-text transition-all"
            title="Abrir menu"
          >
            <Menu size={26} />
          </button>

          <Link href="/projects" className="flex items-center gap-4 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-black text-xl text-lux-text tracking-tighter leading-none truncate">
                Agent BI
              </span>
              <span className="text-[10px] font-bold text-lux-accent uppercase tracking-widest mt-1 opacity-80 truncate">
                Protótipo GenIA para Analytics com AWS Bedrock
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/60 border border-lux-border/40 shadow-sm">
            <span className="text-[9px] uppercase font-black tracking-[0.25em] text-lux-muted whitespace-nowrap">
              Development Partners
            </span>
            <img src="/logos/ntt-data-black.png" alt="NTT DATA" className="h-8 w-auto object-contain" />
            <div className="w-px h-7 bg-lux-border/40 mx-2" />
            <img src="/logos/aws-partner.png" alt="AWS" className="h-6 w-auto object-contain opacity-90 mr-4" />
            
            <button 
              onClick={logout}
              className="px-4 py-2 text-lux-muted hover:text-red-500 hover:bg-red-50/30 rounded-xl transition-all flex items-center gap-2 group border border-transparent hover:border-red-200/50"
              title="Encerrar Sessão Segura"
            >
              <LogOut size={15} className="transition-transform group-hover:-translate-x-0.5 opacity-60 group-hover:opacity-100" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] hidden xl:block">Sair</span>
            </button>
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-lux-border/20 rounded-full text-lux-text transition-all"
            title="Alternar tema"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="w-11 h-11 rounded-full bg-lux-card border border-lux-border/60 flex items-center justify-center cursor-pointer hover:border-lux-text transition-all shadow-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-lux-text/5 group-hover:bg-transparent transition-colors" />
            <User size={22} className="text-lux-text relative z-10" />
          </div>
        </div>
      </nav>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
