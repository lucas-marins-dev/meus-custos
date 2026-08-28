import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Pencil,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
} from '../components/ui/Ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { getApiErrorMessage } from '../utils/format';

interface UpdateUserPayload {
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  senha?: string;
}

export const UsuariosAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<UserRole>('USER');

  const [usuarioEditando, setUsuarioEditando] = useState<User | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('USER');
  const [editAtivo, setEditAtivo] = useState(true);

  const [usuarioExcluir, setUsuarioExcluir] = useState<User | null>(null);

  const {
    data: usuarios = [],
    isLoading,
    isError,
    error,
  } = useQuery<User[]>({
    queryKey: ['usuarios-admin'],
    queryFn: async () => {
      const response = await api.get('/usuarios');
      return response.data;
    },
  });

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
    },
  });

  const editarMutation = useMutation({
    mutationFn: async () => {
      if (!usuarioEditando) return;

      const payload: UpdateUserPayload = {
        nome: editNome,
        email: editEmail,
        role: editRole,
        ativo: editAtivo,
      };

      if (editSenha.trim()) payload.senha = editSenha.trim();
      await api.put(`/usuarios/${usuarioEditando.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      setUsuarioEditando(null);
      setEditSenha('');
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

  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/usuarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      setUsuarioExcluir(null);
    },
  });

  const abrirModalCadastro = () => {
    criarMutation.reset();
    setModalCadastroAberto(true);
  };

  const fecharModalCadastro = () => {
    criarMutation.reset();
    setModalCadastroAberto(false);
  };

  const abrirModalEditar = (usuario: User) => {
    editarMutation.reset();
    setUsuarioEditando(usuario);
    setEditNome(usuario.nome);
    setEditEmail(usuario.email);
    setEditRole(usuario.role);
    setEditAtivo(usuario.ativo);
    setEditSenha('');
  };

  const fecharModalEditar = () => {
    editarMutation.reset();
    setUsuarioEditando(null);
    setEditSenha('');
  };

  const abrirModalExcluir = (usuario: User) => {
    excluirMutation.reset();
    setUsuarioExcluir(usuario);
  };

  const fecharModalExcluir = () => {
    excluirMutation.reset();
    setUsuarioExcluir(null);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Gestão de usuários"
        subtitle="Cadastre, edite, altere permissões ou remova usuários do sistema"
        action={
          <button type="button" className="primary-button" onClick={abrirModalCadastro}>
            <UserPlus aria-hidden="true" />
            Cadastrar usuário
          </button>
        }
      />

      <section className="panel data-panel" aria-labelledby="usuarios-title">
        <div className="panel-heading">
          <div>
            <h2 id="usuarios-title">Usuários do sistema</h2>
            <p>Painel master para gerenciamento de contas e permissões</p>
          </div>
        </div>

        {toggleStatusMutation.isError ? (
          <ErrorState
            compact
            label={getApiErrorMessage(
              toggleStatusMutation.error,
              'Não foi possível alterar o status do usuário.',
            )}
          />
        ) : null}

        {isLoading ? (
          <LoadingState label="Carregando usuários..." />
        ) : isError ? (
          <ErrorState
            label={getApiErrorMessage(error, 'Não foi possível carregar os usuários.')}
          />
        ) : usuarios.length === 0 ? (
          <EmptyState
            label="Nenhum usuário cadastrado."
            icon={<Users aria-hidden="true" />}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Status de acesso</th>
                  <th className="align-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => {
                  const eProprioUsuario = currentUser?.id === usuario.id;

                  return (
                    <tr key={usuario.id}>
                      <td>
                        <div className="table-tags">
                          <strong>{usuario.nome}</strong>
                          {eProprioUsuario ? <span className="tag">Você</span> : null}
                        </div>
                      </td>
                      <td>{usuario.email}</td>
                      <td><span className="tag">{usuario.role}</span></td>
                      <td>
                        <span
                          className={`status-pill ${
                            usuario.ativo ? 'status-pill--positive' : 'status-pill--negative'
                          }`}
                        >
                          {usuario.ativo ? <UserCheck aria-hidden="true" /> : <UserX aria-hidden="true" />}
                          {usuario.ativo ? 'Conta ativa' : 'Acesso desativado'}
                        </span>
                      </td>
                      <td className="align-center">
                        <div className="table-tags">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => abrirModalEditar(usuario)}
                            aria-label={`Editar usuário ${usuario.nome}`}
                            title="Editar usuário"
                          >
                            <Pencil aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            className="icon-button"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: usuario.id,
                                statusAtual: usuario.ativo,
                              })
                            }
                            disabled={eProprioUsuario || toggleStatusMutation.isPending}
                            aria-label={
                              eProprioUsuario
                                ? 'Não é possível alterar o status da própria conta'
                                : `${usuario.ativo ? 'Desativar' : 'Ativar'} usuário ${usuario.nome}`
                            }
                            title={
                              eProprioUsuario
                                ? 'Você não pode alterar o status da própria conta'
                                : usuario.ativo
                                  ? 'Desativar usuário'
                                  : 'Ativar usuário'
                            }
                          >
                            {usuario.ativo ? <UserX aria-hidden="true" /> : <UserCheck aria-hidden="true" />}
                          </button>

                          <button
                            type="button"
                            className="icon-button icon-button--danger"
                            onClick={() => abrirModalExcluir(usuario)}
                            disabled={eProprioUsuario}
                            aria-label={
                              eProprioUsuario
                                ? 'Não é possível excluir a própria conta'
                                : `Excluir usuário ${usuario.nome}`
                            }
                            title={
                              eProprioUsuario
                                ? 'Você não pode excluir sua própria conta'
                                : 'Excluir usuário'
                            }
                          >
                            <Trash2 aria-hidden="true" />
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
      </section>

      {modalCadastroAberto ? (
        <Modal
          title="Cadastrar novo usuário"
          eyebrow="Painel master"
          onClose={fecharModalCadastro}
          labelledBy="create-user-title"
        >
          <form
            className="modal-form"
            onSubmit={(event) => {
              event.preventDefault();
              criarMutation.mutate();
            }}
          >
            {criarMutation.isError ? (
              <ErrorState
                compact
                label={getApiErrorMessage(
                  criarMutation.error,
                  'Não foi possível cadastrar o usuário.',
                )}
              />
            ) : null}

            <div className="form-field">
              <label htmlFor="usuario-nome">Nome completo</label>
              <input
                id="usuario-nome"
                type="text"
                required
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex.: Fulano de Tal"
              />
            </div>

            <div className="form-field">
              <label htmlFor="usuario-email">E-mail</label>
              <input
                id="usuario-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@email.com"
              />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="usuario-senha">Senha inicial</label>
                <input
                  id="usuario-senha"
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                />
              </div>

              <div className="form-field">
                <label htmlFor="usuario-role">Nível de acesso</label>
                <select
                  id="usuario-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                >
                  <option value="USER">Usuário padrão (USER)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={fecharModalCadastro}>
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={criarMutation.isPending}>
                {criarMutation.isPending ? 'Cadastrando...' : 'Cadastrar usuário'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {usuarioEditando ? (
        <Modal
          title="Editar usuário"
          eyebrow="Gestão de acesso"
          onClose={fecharModalEditar}
          labelledBy="edit-user-title"
        >
          <form
            className="modal-form"
            onSubmit={(event) => {
              event.preventDefault();
              editarMutation.mutate();
            }}
          >
            {editarMutation.isError ? (
              <ErrorState
                compact
                label={getApiErrorMessage(
                  editarMutation.error,
                  'Não foi possível editar o usuário.',
                )}
              />
            ) : null}

            <div className="form-field">
              <label htmlFor="edit-usuario-nome">Nome completo</label>
              <input
                id="edit-usuario-nome"
                type="text"
                required
                value={editNome}
                onChange={(event) => setEditNome(event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="edit-usuario-email">E-mail</label>
              <input
                id="edit-usuario-email"
                type="email"
                required
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="edit-usuario-senha">Nova senha (opcional)</label>
              <input
                id="edit-usuario-senha"
                type="password"
                minLength={6}
                value={editSenha}
                onChange={(event) => setEditSenha(event.target.value)}
                placeholder="Deixe em branco para não alterar"
              />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="edit-usuario-role">Nível de acesso</label>
                <select
                  id="edit-usuario-role"
                  value={editRole}
                  onChange={(event) => setEditRole(event.target.value as UserRole)}
                >
                  <option value="USER">Usuário (USER)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="edit-usuario-status">Status de acesso</label>
                <select
                  id="edit-usuario-status"
                  value={editAtivo ? 'true' : 'false'}
                  onChange={(event) => setEditAtivo(event.target.value === 'true')}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Desativado</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={fecharModalEditar}>
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={editarMutation.isPending}>
                {editarMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {usuarioExcluir ? (
        <Modal
          title="Excluir usuário?"
          eyebrow="Ação irreversível"
          onClose={fecharModalExcluir}
          labelledBy="delete-user-title"
          className="destructive-modal"
        >
          <div className="modal-form">
            <div className="destructive-confirmation">
              <AlertTriangle aria-hidden="true" />
              <p>
                Tem certeza que deseja excluir <strong>{usuarioExcluir.nome}</strong>{' '}
                ({usuarioExcluir.email})? Todos os dados financeiros e o histórico de conversa
                desta conta também serão removidos.
              </p>
            </div>

            {excluirMutation.isError ? (
              <ErrorState
                compact
                label={getApiErrorMessage(
                  excluirMutation.error,
                  'Não foi possível excluir o usuário.',
                )}
              />
            ) : null}

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={fecharModalExcluir}>
                Cancelar
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => excluirMutation.mutate(usuarioExcluir.id)}
                disabled={excluirMutation.isPending}
              >
                <Trash2 aria-hidden="true" />
                {excluirMutation.isPending ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};
