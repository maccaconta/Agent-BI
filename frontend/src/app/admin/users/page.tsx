"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  RefreshCw, 
  ShieldCheck, 
  Coins, 
  Search,
  ArrowUpDown,
  Filter,
  MoreVertical,
  Activity,
  DollarSign,
  UserPlus,
  Trash2,
  X,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Utilizar proxy relativo para evitar erros de CORS/401 em ambiente dev/prod
const BACKEND_URL = "";

interface UserQuota {
  user_id: string;
  email: string;
  role: string;
  is_super_admin: boolean;
  max_limit: number;
  consumed_tokens: number;
  max_logins: number;
  total_logins: number;
  cost_usd: number;
  percent_used: number;
}

export default function AdminUsersPage() {
  const { getRole } = useAuth();
  const [usersQuotas, setUsersQuotas] = useState<UserQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", role: "Visualizador" });
  const [addingUser, setAddingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("agent_bi_access_token") : null;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const fetchUsersQuotas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/users_quotas/`, { headers: getHeaders() });
      if (res.ok) {
        setUsersQuotas(await res.json());
      } else if (res.status === 401) {
        setError("Não autorizado. Verifique suas credenciais de administrador.");
      }
    } catch (err) {
      setError("Falha ao carregar dados de usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersQuotas();
  }, []);

  const updateQuotaLimit = async (userId: string, limit: number, loginLimit?: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/update_limit/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId, limit, login_limit: loginLimit })
      });
      if (res.ok) {
        fetchUsersQuotas();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setError("Falha ao atualizar limites");
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/update_user_role/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId, role })
      });
      if (res.ok) {
        fetchUsersQuotas();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setError("Falha ao atualizar perfil do usuário");
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email) return;
    try {
      setAddingUser(true);
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/invite_user/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewUser({ email: "", role: "Visualizador" });
        fetchUsersQuotas();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Falha ao convidar usuário");
      }
    } catch (err) {
      setError("Erro de rede ao convidar usuário");
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Deseja realmente revogar o acesso de ${email}?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/delete_user/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        fetchUsersQuotas();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setError("Falha ao remover usuário");
    }
  };

  const filteredUsers = usersQuotas.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header com KPIs Rápidos */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-[#1A1A1A] font-serif">Gestão de Usuários</h1>
          <p className="text-[#8C8C8C] mt-2 max-w-xl text-sm leading-relaxed tracking-tight border-l-2 border-[#D4AF37] pl-4">
            Acompanhe o consumo, defina quotas e gerencie níveis de acesso de todos os colaboradores do ecossistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            <UserPlus size={16} className="text-[#D4AF37]" />
            Adicionar Colaborador
          </button>

          <button 
            onClick={fetchUsersQuotas}
            className="p-3 bg-white border border-[#F1E9DB] rounded-xl hover:bg-[#F9F9F9] transition-all text-[#8C8C8C]"
            title="Sincronizar"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8C8C]" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white border border-[#F1E9DB] rounded-2xl text-xs font-bold w-[280px] focus:border-[#D4AF37] outline-none shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-4">
          <ShieldCheck size={16} /> Alteração aplicada com sucesso!
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-500 p-4 border border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in shake duration-500">
          <Activity size={16} /> {error}
        </div>
      )}

      {/* Tabela Premium de Usuários */}
      <div className="bg-white border border-[#F1E9DB] rounded-[3.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-[#F9F9F9] border-b border-[#F1E9DB]">
                <th className="w-[28%] px-6 py-8 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Colaborador</th>
                <th className="w-[17%] px-6 py-8 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Acesso</th>
                <th className="w-[25%] px-6 py-8 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Limites e Quotas</th>
                <th className="w-[20%] px-6 py-8 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest text-right">Métricas de Uso</th>
                <th className="w-[10%] px-6 py-8 text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                <tr key={u.user_id} className="border-b border-[#F1E9DB] hover:bg-[#FDF9F0]/30 transition-all group">
                  <td className="px-6 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#D4AF37] font-black text-xs shadow-lg">
                        {u.email.substring(0,2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm text-[#1A1A1A] truncate">{u.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[9px] text-[#8C8C8C] font-black uppercase">Ativo no Sistema</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-8">
                    <select 
                      defaultValue={u.is_super_admin ? "Administrador" : u.role === "ANALYST" ? "Criador" : "Visualizador"}
                      onChange={(e) => handleUpdateRole(u.user_id, e.target.value)}
                      className="w-full max-w-[180px] bg-white border-2 border-[#F1E9DB] p-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#D4AF37] shadow-sm transition-all"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Criador">Criador (Analista)</option>
                      <option value="Visualizador">Visualizador (Executivo)</option>
                    </select>
                  </td>
                  <td className="px-6 py-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 bg-[#F9F9F9] p-2 rounded-2xl border border-transparent hover:border-[#F1E9DB] transition-all">
                        <div className="flex items-center gap-2 pl-2">
                          <Coins size={12} className="text-[#8C8C8C]" />
                          <span className="text-[9px] font-black text-[#8C8C8C] uppercase">Tokens</span>
                        </div>
                        <input 
                          type="number" 
                          defaultValue={u.max_limit}
                          onBlur={(e) => updateQuotaLimit(u.user_id, parseInt(e.target.value))}
                          className="w-24 bg-white border border-[#F1E9DB] p-2 rounded-xl text-[10px] font-black text-center outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 bg-[#F9F9F9] p-2 rounded-2xl border border-transparent hover:border-[#F1E9DB] transition-all">
                        <div className="flex items-center gap-2 pl-2">
                          <Activity size={12} className="text-[#8C8C8C]" />
                          <span className="text-[9px] font-black text-[#8C8C8C] uppercase">Logins</span>
                        </div>
                        <input 
                          type="number" 
                          defaultValue={u.max_logins}
                          onBlur={(e) => updateQuotaLimit(u.user_id, u.max_limit, parseInt(e.target.value))}
                          className="w-24 bg-white border border-[#F1E9DB] p-2 rounded-xl text-[10px] font-black text-center outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-8 text-right">
                    <div className="space-y-2">
                      <div className="flex items-center justify-end gap-2 text-sm font-serif font-black text-[#1A1A1A]">
                        {u.consumed_tokens.toLocaleString()}
                        <span className="text-[9px] font-black text-[#8C8C8C] uppercase tracking-tighter">tkns</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 text-xs font-black text-[#D4AF37]">
                        {u.total_logins}
                        <span className="text-[8px] font-black text-[#8C8C8C] uppercase tracking-tighter">acessos</span>
                      </div>
                      <div className="text-[10px] font-black text-[#8C8C8C] mt-2 italic flex items-center justify-end gap-1">
                        <DollarSign size={10} /> {u.cost_usd.toFixed(2)} USD
                      </div>
                      
                      {/* Barra de Progresso Sugerida */}
                      <div className="w-full max-w-[120px] h-1.5 bg-[#F9F9F9] rounded-full overflow-hidden border border-[#F1E9DB] ml-auto mt-3">
                         <div 
                            className={`h-full transition-all duration-1000 ${u.percent_used > 90 ? "bg-red-500" : "bg-[#1A1A1A]"}`} 
                            style={{ width: `${Math.min(u.percent_used, 100)}%` }} 
                         />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-8 text-right">
                    <button 
                      onClick={() => handleDeleteUser(u.user_id, u.email)}
                      className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Revogar Acesso"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[#8C8C8C]">
                    {loading ? (
                      <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="animate-spin text-[#D4AF37]" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Carregando base de usuários...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <Users size={48} className="opacity-10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum colaborador encontrado</span>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Adicionar Usuário */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1A1A]/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <button onClick={() => setShowAddModal(false)} className="text-[#8C8C8C] hover:text-[#1A1A1A] transition-all">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[#FDF9F0] text-[#D4AF37] rounded-2xl"><UserPlus size={24} /></div>
                <div>
                   <h3 className="text-xl font-black text-[#1A1A1A]">Novo Colaborador</h3>
                   <p className="text-[10px] font-black text-[#8C8C8C] uppercase tracking-widest">Convide membros para o ecossistema</p>
                </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block mb-3">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="exemplo@empresa.com"
                      className="w-full p-4 bg-[#F9F9F9] border border-[#F1E9DB] rounded-2xl text-sm font-bold outline-none focus:border-[#D4AF37] transition-all"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block mb-3">Perfil de Acesso</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full p-4 bg-[#F9F9F9] border border-[#F1E9DB] rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#D4AF37] transition-all"
                    >
                       <option value="Administrador">Administrador</option>
                       <option value="Criador">Criador (Analista)</option>
                       <option value="Visualizador">Visualizador (Executivo)</option>
                    </select>
                 </div>

                 <button 
                   onClick={handleCreateUser}
                   disabled={addingUser || !newUser.email}
                   className="w-full py-5 bg-[#1A1A1A] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
                 >
                   {addingUser ? <RefreshCw size={16} className="animate-spin" /> : <UserCheck size={16} className="text-[#D4AF37]" />}
                   {addingUser ? "Processando..." : "Enviar Convite"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
