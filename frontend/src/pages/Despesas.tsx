import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, CreditCard, Plus, Store, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, MetricCard, Modal, PageHeader } from '../components/ui/Ui';
import { api } from '../services/api';
import { Despesa, TipoDespesa } from '../types';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/format';

export const Despesas: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [local, setLocal] = useState('');
  const [categoria, setCategoria] = useState('Alimentação');
  const [tipo, setTipo] = useState<TipoDespesa>('OCASIONAL');
  const [paga, setPaga] = useState(false);

  const {
    data: despesas = [],
    isLoading,
    isError,
    error,
  } = useQuery<Despesa[]>({
    queryKey: ['despesas'],
    queryFn: async () => {
      const res = await api.get('/despesas');
      return res.data;
    },
  });

  const criarMutation = useMutation({
    mutationFn: async () => {
      await api.post('/despesas', {
        descricao,
        valor: parseFloat(valor),
        dataVencimento,
        local,
        categoria,
        tipo,
        paga,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metricas'] });
      setModalAberto(false);
      setDescricao('');
      setValor('');
      setLocal('');
    },
  });

  const togglePagoMutation = useMutation({
    mutationFn: async ({ id, statusAtual }: { id: string; statusAtual: boolean }) => {
      await api.patch(`/despesas/${id}`, { paga: !statusAtual });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metricas'] });
    },
  });

  const removerMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/despesas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metricas'] });
    },
  });

  const totalDespesas = despesas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalPagas = despesas
    .filter((despesa) => despesa.paga)
    .reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalPendente = totalDespesas - totalPagas;

  const abrirModal = () => {
    criarMutation.reset();
    setModalAberto(true);
  };

  const fecharModal = () => {
    criarMutation.reset();
    setModalAberto(false);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Despesas (gastos)"
        subtitle="Gastos ocasionais e recorrentes por local e categoria"
        action={
          <button type="button" className="primary-button" onClick={abrirModal}>
            <Plus aria-hidden="true" />
            Nova despesa
          </button>
        }
      />

      {!isLoading && !isError ? (
        <section className="metrics-grid" aria-label="Resumo das despesas">
          <MetricCard
            label="Total cadastrado"
            value={formatCurrency(totalDespesas)}
            note={`${despesas.length} ${despesas.length === 1 ? 'despesa registrada' : 'despesas registradas'}`}
            icon={<CreditCard aria-hidden="true" />}
            tone="negative"
          />
          <MetricCard
            label="Total já pago"
            value={formatCurrency(totalPagas)}
            note={`${despesas.filter((despesa) => despesa.paga).length} pagamentos concluídos`}
            icon={<CheckCircle2 aria-hidden="true" />}
            tone="positive"
          />
          <MetricCard
            label="Total pendente"
            value={formatCurrency(totalPendente)}
            note="Valor das despesas ainda não pagas"
            icon={<Clock aria-hidden="true" />}
            tone="warning"
          />
        </section>
      ) : null}

      <section className="panel data-panel" aria-labelledby="despesas-title">
        <div className="panel-heading">
          <div>
            <h2 id="despesas-title">Despesas cadastradas</h2>
            <p>Ordenadas por data de vencimento</p>
          </div>
        </div>

        {togglePagoMutation.isError ? (
          <ErrorState
            compact
            label={getApiErrorMessage(togglePagoMutation.error, 'Não foi possível alterar o status da despesa.')}
          />
        ) : null}
        {removerMutation.isError ? (
          <ErrorState
            compact
            label={getApiErrorMessage(removerMutation.error, 'Não foi possível excluir a despesa.')}
          />
        ) : null}

        {isLoading ? (
          <LoadingState label="Carregando despesas..." />
        ) : isError ? (
          <ErrorState label={getApiErrorMessage(error, 'Não foi possível carregar as despesas.')} />
        ) : despesas.length === 0 ? (
          <EmptyState
            label="Nenhuma despesa cadastrada ainda."
            icon={<CreditCard aria-hidden="true" />}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Local</th>
                  <th>Tipo e categoria</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th className="align-right">Valor</th>
                  <th className="align-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map((despesa) => (
                  <tr key={despesa.id}>
                    <td>
                      <strong>{despesa.descricao}</strong>
                    </td>
                    <td>
                      <span className="table-detail">
                        <Store aria-hidden="true" />
                        {despesa.local}
                      </span>
                    </td>
                    <td>
                      <div className="table-tags">
                        <span className="tag">{despesa.tipo === 'MENSAL' ? 'Mensal' : 'Ocasional'}</span>
                        <span className="tag">{despesa.categoria}</span>
                      </div>
                    </td>
                    <td>{formatDate(despesa.dataVencimento)}</td>
                    <td>
                      <button
                        type="button"
                        className={`status-pill ${
                          despesa.paga ? 'status-pill--positive' : 'status-pill--warning'
                        }`}
                        onClick={() =>
                          togglePagoMutation.mutate({ id: despesa.id, statusAtual: despesa.paga })
                        }
                        disabled={togglePagoMutation.isPending}
                        aria-label={`Marcar ${despesa.descricao} como ${despesa.paga ? 'pendente' : 'paga'}`}
                      >
                        {despesa.paga ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />}
                        {despesa.paga ? 'Paga' : 'Pendente'}
                      </button>
                    </td>
                    <td className="amount amount--negative align-right">{formatCurrency(despesa.valor)}</td>
                    <td className="align-center">
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        onClick={() => removerMutation.mutate(despesa.id)}
                        disabled={removerMutation.isPending}
                        aria-label={`Excluir despesa ${despesa.descricao}`}
                        title="Excluir despesa"
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAberto ? (
        <Modal title="Adicionar nova despesa" onClose={fecharModal}>
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
                label={getApiErrorMessage(criarMutation.error, 'Não foi possível salvar a despesa.')}
              />
            ) : null}

            <div className="form-field">
              <label htmlFor="despesa-descricao">Descrição</label>
              <input
                id="despesa-descricao"
                type="text"
                required
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Ex.: Compras de mercado"
              />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="despesa-valor">Valor</label>
                <input
                  id="despesa-valor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={valor}
                  onChange={(event) => setValor(event.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="form-field">
                <label htmlFor="despesa-vencimento">Vencimento</label>
                <input
                  id="despesa-vencimento"
                  type="date"
                  required
                  value={dataVencimento}
                  onChange={(event) => setDataVencimento(event.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="despesa-local">Local ou estabelecimento</label>
              <input
                id="despesa-local"
                type="text"
                required
                value={local}
                onChange={(event) => setLocal(event.target.value)}
                placeholder="Ex.: Mercado, farmácia ou prestador"
              />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="despesa-tipo">Tipo</label>
                <select
                  id="despesa-tipo"
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value as TipoDespesa)}
                >
                  <option value="OCASIONAL">Ocasional</option>
                  <option value="MENSAL">Mensal recorrente</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="despesa-categoria">Categoria</label>
                <select
                  id="despesa-categoria"
                  value={categoria}
                  onChange={(event) => setCategoria(event.target.value)}
                >
                  <option value="Alimentação">Alimentação</option>
                  <option value="Moradia">Moradia</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Lazer">Lazer</option>
                  <option value="Educação">Educação</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="form-field form-field--checkbox">
              <label htmlFor="despesa-paga">
                <input
                  id="despesa-paga"
                  type="checkbox"
                  checked={paga}
                  onChange={(event) => setPaga(event.target.checked)}
                />
                <span>Esta despesa já foi paga</span>
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={fecharModal}>
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={criarMutation.isPending}>
                {criarMutation.isPending ? 'Salvando...' : 'Salvar despesa'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};
