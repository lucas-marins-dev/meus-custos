import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { UserPlus, UserCheck, UserX, Pencil, Trash2, AlertTriangle, X } from 'lucide-react';

export const UsuariosAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Estados para Modal de Cadastro
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');

  // Estados para Modal de Edição
  const [usuarioEditando, setUsuarioEditando] = useState<User | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');
  const [editAtivo, setEditAtivo] = useState(true);

  // Estado para Modal de Exclusão
  const [usuarioExcluir, setUsuarioExcluir] = useState<User | null>(null);

  // Mensagem de Erro
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const { data: usuarios = [], isLoading } = useQuery<User[]>({
    queryKey: ['usuarios-admin'],
    queryFn: async () => {
      const res = await api.get('/usuarios');
      return res.data;
    },
  });

  // Mutation para Criar Usuário
  const criarMutation = useMutation({
    mutationFn: async () => {
      await api.post('/usuarios', { nome, email, senha, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      setModalCadastroAberto(false);
      setNome('');
      setEmail('');
      setSenha('');
      setErroMsg(null);
    },
    onError: (err: any) => {
      setErroMsg(err.response?.data?.message || 'Erro ao cadastrar usuário');
    },
  });

  // Mutation para Editar Usuário
  const editarMutation = useMutation({
    mutationFn: async () => {
      if (!usuarioEditando) return;
      const payload: any = {
        nome: editNome,
        email: editEmail,
        role: editRole,
        ativo: editAtivo,
      };
      if (editSenha.trim()) {
        payload.senha = editSenha.trim();
      }
      await api.put(`/usuarios/${usuarioEditando.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      setUsuarioEditando(null);
      setEditSenha('');
      setErroMsg(null);
    },
    onError: (err: any) => {
      setErroMsg(err.response?.data?.message || 'Erro ao editar usuário');
    },
  });

  // Mutation para Alternar Status (Ativo / Inativo)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, statusAtual }: { id: string; statusAtual: boolean }) => {
      await api.patch(`/usuarios/${id}/status`, { ativo: !statusAtual });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
    },
  });

  // Mutation para Excluir Usuário
  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/usuarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      setUsuarioExcluir(null);
      setErroMsg(null);
    },
    onError: (err: any) => {
      setErroMsg(err.response?.data?.message || 'Erro ao excluir usuário');
    },
  });

  const abrirModalEditar = (usr: User) => {
    setUsuarioEditando(usr);
    setEditNome(usr.nome);
    setEditEmail(usr.email);
    setEditRole(usr.role as 'USER' | 'ADMIN');
    setEditAtivo(usr.ativo);
    setEditSenha('');
    setErroMsg(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Gestão de Usuários (Painel Master)</h2>
          <p className="text-sm text-slate-400 mt-1">Cadastre, edite, altere permissões ou remova usuários do sistema</p>
        </div>
        <button
          onClick={() => {
            setModalCadastroAberto(true);
            setErroMsg(null);
          }}
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
                {usuarios.map((usr) => {
                  const eProprioUsuario = currentUser?.id === usr.id;
                  return (
                    <tr key={usr.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-6 py-4 font-semibold text-white">
                        {usr.nome}
                        {eProprioUsuario && (
                          <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Você
                          </span>
                        )}
                      </td>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Botão Editar */}
                          <button
                            onClick={() => abrirModalEditar(usr)}
                            title="Editar usuário"
                            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Botão Alternar Status */}
                          <button
                            onClick={() => toggleStatusMutation.mutate({ id: usr.id, statusAtual: usr.ativo })}
                            disabled={eProprioUsuario}
                            title={usr.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                            className={`p-2 rounded-xl transition ${
                              eProprioUsuario
                                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                                : usr.ativo
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {usr.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                          {/* Botão Excluir */}
                          <button
                            onClick={() => setUsuarioExcluir(usr)}
                            disabled={eProprioUsuario}
                            title={eProprioUsuario ? 'Você não pode excluir sua própria conta' : 'Excluir usuário'}
                            className={`p-2 rounded-xl transition ${
                              eProprioUsuario
                                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar Usuário */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setModalCadastroAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Cadastrar Novo Usuário</h3>

            {erroMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{erroMsg}</span>
              </div>
            )}

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
                  onClick={() => setModalCadastroAberto(false)}
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

      {/* Modal Editar Usuário */}
      {usuarioEditando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setUsuarioEditando(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Editar Usuário</h3>

            {erroMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{erroMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editarMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nova Senha (Opcional)</label>
                <input
                  type="password"
                  value={editSenha}
                  onChange={(e) => setEditSenha(e.target.value)}
                  placeholder="Deixe em branco para não alterar"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nível de Acesso</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'USER' | 'ADMIN')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="USER">Usuário (USER)</option>
                    <option value="ADMIN">Admin (ADMIN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status de Acesso</label>
                  <select
                    value={editAtivo ? 'true' : 'false'}
                    onChange={(e) => setEditAtivo(e.target.value === 'true')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Desativado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUsuarioEditando(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editarMutation.isPending}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl shadow-lg transition"
                >
                  {editarMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {usuarioExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Excluir Usuário?</h3>
            <p className="text-sm text-slate-300 mb-6">
              Tem certeza que deseja excluir o usuário <strong className="text-white">{usuarioExcluir.nome}</strong> ({usuarioExcluir.email})? Esta ação é irreversível e removerá todos os dados deste usuário.
            </p>

            {erroMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{erroMsg}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUsuarioExcluir(null)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => excluirMutation.mutate(usuarioExcluir.id)}
                disabled={excluirMutation.isPending}
                className="w-1/2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl shadow-lg transition"
              >
                {excluirMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
