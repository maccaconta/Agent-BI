"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, ArrowRight, Mail, Key, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const attemptLogin = async (): Promise<Response> => {
      return fetch("/api/v1/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    };

    try {
      let response = await attemptLogin();

      // Retry automático: 401 às vezes é o worker do gunicorn ainda aquecendo
      if (response.status === 401) {
        await new Promise(r => setTimeout(r, 900));
        response = await attemptLogin();
      }

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Erro não-JSON recebido:", text);
        throw new Error("Erro interno do servidor. Favor verificar os logs do sistema.");
      }

      if (!response.ok) {
        const errorMessage = data.detail || (data.non_field_errors && data.non_field_errors[0]) || "Falha na autenticação. Verifique suas credenciais.";
        throw new Error(errorMessage);
      }

      // data contém { access, refresh, user: { ... } }
      login(data.access, data.refresh, data.user);
      
    } catch (err: any) {
      console.error("Login catch:", err);
      setError(err.message || "Ocorreu um erro inesperado ao tentar logar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lux-bg flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Decoração Background */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-lux-card/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-lux-text/5 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="glass-panel p-10 md:p-12 border-lux-border/30 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)]">
            
            {/* Branding */}
            <div className="mb-10 flex flex-col items-center">
               <img src="/logos/ntt-data-black.png" alt="NTT DATA" className="h-8 mb-6 object-contain" />
               <h1 className="text-2xl font-serif font-black text-lux-text tracking-tight uppercase">Portal de Acesso</h1>
               <div className="h-0.5 w-8 bg-lux-accent mt-2" />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-lux-muted tracking-widest ml-1">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-lux-muted/40" size={18} />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/50 border border-lux-border/20 rounded-2xl focus:ring-2 focus:ring-lux-text/5 focus:border-lux-text/20 transition-all outline-none text-sm text-lux-text"
                      placeholder="seu.nome@nttdata.com"
                    />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-lux-muted tracking-widest ml-1">Senha</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-lux-muted/40" size={18} />
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/50 border border-lux-border/20 rounded-2xl focus:ring-2 focus:ring-lux-text/5 focus:border-lux-text/20 transition-all outline-none text-sm text-lux-text"
                      placeholder="••••••••"
                    />
                  </div>
               </div>

               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-lux-text text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
               >
                 {loading ? "Autenticando..." : "Entrar no Agent-BI"}
                 {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
               </button>
            </form>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-lux-border/10 flex flex-col items-center gap-4">
               <div className="flex items-center gap-6 opacity-40">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">JWT Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">AES-256 Cloud</span>
                  </div>
               </div>
               <img src="/logos/aws-partner.png" alt="AWS" className="h-4 opacity-50 filter grayscale" />
            </div>
        </div>
      </motion.div>
    </div>
  );
}
