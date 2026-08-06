import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { User } from '../types';
import { UserPlus, Shield, UserCheck, UserX } from 'lucide-react';

export const UsuariosAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');

  const { data: usuarios = [], isLoading } = useQuery<User[]>({
    queryKey: ['usuarios-admin'],
    queryFn: async () => {
      const res = await api.get('/usuarios');
      return res.data;
    },
  });

  const criarMutation = useMutation({
    mutationFn: async () => {
      await api.post('/usuarios', { nome, email, senha, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      setModalAberto(false);
      setNome('');
      setEmail('');
      setSenha('');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, statusAtual }: { id: string; statusAtual: boolean }) => {
      await api.patch(`/usuarios/${id}/status`, { ativo: !statusAtual });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Gestão de Usuários (Painel Master)</h2>
          <p className="text-sm text-slate-400 mt-1">Crie novas contas e gerencie o status de acesso no sistema</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition"
        >
          <UserPlus className="w-4 h-4" />
          Cadastrar Novo Usuário
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando usuários...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Papel (Role)</th>
                  <th className="px-6 py-4">Status de Acesso</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usuarios.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 font-semibold text-white">{usr.nome}</td>
                    <td className="px-6 py-4 text-slate-400">{usr.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        usr.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        usr.ativo
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {usr.ativo ? 'Conta Ativa' : 'Acesso Desativado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: usr.id, statusAtual: usr.ativo })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 mx-auto transition ${
                          usr.ativo
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {usr.ativo ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Ativar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar Usuário */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Cadastrar Usuário no Sistema</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                criarMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Fulano de Tal"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Senha Inicial</label>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Papel / Nível de Acesso</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                >
                  <option value="USER">Usuário Padrão (USER)</option>
                  <option value="ADMIN">Administrador Master (ADMIN)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarMutation.isPending}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl shadow-lg transition"
                >
                  {criarMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
