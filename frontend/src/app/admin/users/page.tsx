"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  RefreshCw, 
  ShieldCheck, 
  Coins, 
  Search,
  Activity,
  DollarSign,
  UserPlus,
  Trash2,
  X,
  UserCheck,
  ArrowRight
} from "lucide-react";

const BACKEND_URL = "";

interface UserQuota {
  user_id: string;
  email: string;
  role: string;
  max_limit: number;
  consumed_tokens: number;
  max_logins: number;
  total_logins: number;
  cost_usd: number;
  percent_used: number;
}

export default function AdminUsersPage() {
  const [usersQuotas, setUsersQuotas] = useState<UserQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", role: "VIEWER" });
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
      }
    } catch (err) {
      setError("Erro ao carregar colaboradores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersQuotas();
  }, []);

  const handleUpdateUser = async (user: UserQuota) => {
    try {
      setSavingId(user.user_id);
      const resLimit = await fetch(`${BACKEND_URL}/api/v1/governance/costs/update_limit/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: user.user_id, limit: user.max_limit, login_limit: user.max_logins })
      });
      const resRole = await fetch(`${BACKEND_URL}/api/v1/governance/costs/update_user_role/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: user.user_id, role: user.role })
      });
      if (resLimit.ok && resRole.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError("Erro ao persistir dados.");
    } finally {
      setSavingId(null);
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
        setNewUser({ email: "", role: "VIEWER" });
        fetchUsersQuotas();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Revogar acesso de: ${email}?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/governance/costs/delete_user/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) fetchUsersQuotas();
    } catch (err) {}
  };

  const filteredUsers = usersQuotas.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full max-w-full px-4 py-6 space-y-6 animate-in fade-in duration-700 overflow-hidden">
      {/* Header Compacto */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-[#D4AF37] rounded-full" />
          <h1 className="text-3xl font-black tracking-tighter text-[#1A1A1A] font-serif">Gestão de Usuários</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={14} />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-[#F1E9DB] rounded-full text-[11px] font-bold w-[200px] focus:border-[#1A1A1A] outline-none shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
          >
            <UserPlus size={14} />
            Novo
          </button>
        </div>
      </div>

      {/* Tabela Ultra Compacta */}
      <div className="bg-white rounded-3xl border border-[#F1E9DB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#FDF9F0]/30 border-b border-[#F1E9DB]">
                <th className="px-4 py-4 text-[9px] font-black text-[#8C8C8C] uppercase tracking-widest">Identidade</th>
                <th className="px-4 py-4 text-[9px] font-black text-[#8C8C8C] uppercase tracking-widest">Perfil</th>
                <th className="px-4 py-4 text-[9px] font-black text-[#8C8C8C] uppercase tracking-widest">Limites (Tokens / Logins)</th>
                <th className="px-4 py-4 text-[9px] font-black text-[#8C8C8C] uppercase tracking-widest text-right">Consumo</th>
                <th className="px-4 py-4 text-[9px] font-black text-[#8C8C8C] uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E9DB]">
              {filteredUsers.map((u, idx) => (
                <tr key={u.user_id} className="hover:bg-[#FDF9F0]/10 transition-all duration-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-[#D4AF37] font-black text-[10px] shadow-sm">
                        {u.email.substring(0,2).toUpperCase()}
                      </div>
                      <div className="max-w-[180px] truncate">
                        <div className="font-black text-xs text-[#1A1A1A] truncate">{u.email}</div>
                        <div className="text-[8px] text-emerald-600 font-black uppercase tracking-tighter">Ativo</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <select 
                      value={u.role}
                      onChange={(e) => {
                        const newList = [...usersQuotas];
                        newList[idx].role = e.target.value;
                        setUsersQuotas(newList);
                      }}
                      className="w-full max-w-[140px] bg-white border border-[#F1E9DB] p-2 rounded-xl text-[9px] font-black uppercase outline-none focus:border-[#D4AF37]"
                    >
                      <option value="ADMIN">Administrador</option>
                      <option value="ANALYST">Criador</option>
                      <option value="VIEWER">Leitor</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-[#F9F9F9] px-3 py-1.5 rounded-xl border border-transparent hover:border-[#F1E9DB]">
                        <Coins size={12} className="text-[#D4AF37]" />
                        <input 
                          type="number" 
                          value={u.max_limit}
                          onChange={(e) => {
                            const newList = [...usersQuotas];
                            newList[idx].max_limit = parseInt(e.target.value);
                            setUsersQuotas(newList);
                          }}
                          className="w-14 bg-transparent text-[10px] font-black text-[#1A1A1A] outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-[#F9F9F9] px-3 py-1.5 rounded-xl border border-transparent hover:border-[#F1E9DB]">
                        <Activity size={12} className="text-[#8C8C8C]" />
                        <input 
                          type="number" 
                          value={u.max_logins}
                          onChange={(e) => {
                            const newList = [...usersQuotas];
                            newList[idx].max_logins = parseInt(e.target.value);
                            setUsersQuotas(newList);
                          }}
                          className="w-10 bg-transparent text-[10px] font-black text-[#1A1A1A] outline-none"
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="text-[11px] font-black text-[#1A1A1A] tracking-tighter">
                        {u.consumed_tokens.toLocaleString()} <span className="text-[8px] text-[#8C8C8C]">TK</span>
                      </div>
                      <div className="text-[9px] font-bold text-[#D4AF37]">
                        {u.total_logins} <span className="text-[7px] text-[#8C8C8C]">LOG</span>
                      </div>
                      <div className="w-16 h-1 bg-[#F1E9DB] rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-[#1A1A1A]" style={{ width: `${Math.min(u.percent_used, 100)}%` }} />
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateUser(u)}
                        disabled={savingId === u.user_id}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-xl text-[9px] font-black uppercase hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={savingId === u.user_id ? "animate-spin" : ""} />
                        {savingId === u.user_id ? "..." : "Salvar"}
                      </button>
                      <button onClick={() => handleDeleteUser(u.user_id, u.email)} className="p-2 text-[#8C8C8C] hover:text-red-500 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success/Error Alertas */}
      {(success || error) && (
        <div className={`fixed bottom-6 right-6 z-[200] p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-4 ${success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {success ? <ShieldCheck size={16} /> : <Activity size={16} />}
          </div>
          <div className="text-xs font-bold">{success ? "Alterações salvas!" : error}</div>
        </div>
      )}

      {/* Modal Adicionar */}
      {showAddModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#1A1A1A]/40 backdrop-blur-md animate-in fade-in">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl relative">
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-[#8C8C8C] hover:text-black transition-all">
                 <X size={24} />
              </button>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-[#FDF9F0] text-[#D4AF37] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={24} />
                </div>
                <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tighter">Novo Colaborador</h3>
              </div>
              <div className="space-y-6">
                 <input 
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="E-mail corporativo"
                    className="w-full p-4 bg-[#F9F9F9] border border-[#F1E9DB] rounded-2xl text-[11px] font-black outline-none focus:border-[#1A1A1A]"
                 />
                 <div className="grid grid-cols-3 gap-2">
                    {['ADMIN', 'ANALYST', 'VIEWER'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setNewUser({...newUser, role})}
                        className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border ${newUser.role === role ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-[#8C8C8C] border-[#F1E9DB]'}`}
                      >
                        {role === 'ADMIN' ? 'Admin' : role === 'ANALYST' ? 'Criador' : 'Leitor'}
                      </button>
                    ))}
                 </div>
                 <button onClick={handleCreateUser} disabled={addingUser || !newUser.email} className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                   {addingUser ? "Processando..." : "Enviar Convite"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
