"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  primary_tenant_slug?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Tenta restaurar a sessão do localStorage
    const savedUser = localStorage.getItem("agent_bi_user");
    const accessToken = localStorage.getItem("agent_bi_access_token");

    if (savedUser && accessToken) {
      try {
        setUser(JSON.parse(savedUser));
        // Garante que o cookie esteja sincronizado para o middleware
        document.cookie = `agent_bi_access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
      } catch (e) {
        console.error("Erro ao restaurar sessão:", e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem("agent_bi_access_token", accessToken);
    localStorage.setItem("agent_bi_refresh_token", refreshToken);
    localStorage.setItem("agent_bi_user", JSON.stringify(userData));
    localStorage.setItem("agent_bi_tenant_slug", userData.primary_tenant_slug || "default");
    
    // Define o cookie para o middleware do Next.js
    document.cookie = `agent_bi_access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;

    setUser(userData);
    router.push("/projects"); // Redireciona para projetos após login
  };

  const logout = () => {
    localStorage.removeItem("agent_bi_access_token");
    localStorage.removeItem("agent_bi_refresh_token");
    localStorage.removeItem("agent_bi_user");
    localStorage.removeItem("agent_bi_tenant_slug");
    
    // Remove o cookie
    document.cookie = "agent_bi_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
