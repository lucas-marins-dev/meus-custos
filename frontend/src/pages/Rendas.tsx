import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, DollarSign, Plus, Trash2, TrendingUp } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, MetricCard, Modal, PageHeader } from '../components/ui/Ui';
import { api } from '../services/api';
import { Renda } from '../types';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/format';

export const Rendas: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataRecebimento, setDataRecebimento] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState('Salário');

  const {
    data: rendas = [],
    isLoading,
    isError,
    error,
  } = useQuery<Renda[]>({
    queryKey: ['rendas'],
    queryFn: async () => {
      const res = await api.get('/rendas');
      return res.data;
    },
  });

  const criarMutation = useMutation({
    mutationFn: async () => {
      await api.post('/rendas', {
        descricao,
        valor: parseFloat(valor),
        dataRecebimento,
        categoria,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metricas'] });
      setModalAberto(false);
      setDescricao('');
      setValor('');
    },
  });

  const removerMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/rendas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metricas'] });
    },
  });

  const totalRendas = rendas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const mediaRendas = rendas.length > 0 ? totalRendas / rendas.length : 0;

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
        title="Receitas (rendas)"
        subtitle="Registre e acompanhe suas entradas por data de recebimento"
        action={
          <button type="button" className="primary-button" onClick={abrirModal}>
            <Plus aria-hidden="true" />
            Nova receita
          </button>
        }
      />

      {!isLoading && !isError ? (
        <section className="metrics-grid" aria-label="Resumo das receitas">
          <MetricCard
            label="Total de entradas"
            value={formatCurrency(totalRendas)}
            note={`${rendas.length} ${rendas.length === 1 ? 'lançamento registrado' : 'lançamentos registrados'}`}
            icon={<DollarSign aria-hidden="true" />}
            tone="positive"
          />
          <MetricCard
            label="Receitas registradas"
            value={String(rendas.length)}
            note="Entradas ordenadas por recebimento"
            icon={<TrendingUp aria-hidden="true" />}
          />
          <MetricCard
            label="Média por lançamento"
            value={formatCurrency(mediaRendas)}
            note="Valor médio das entradas cadastradas"
            icon={<Calendar aria-hidden="true" />}
          />
        </section>
      ) : null}

      <section className="panel data-panel" aria-labelledby="rendas-title">
        <div className="panel-heading">
          <div>
            <h2 id="rendas-title">Entradas registradas</h2>
            <p>Ordenadas por data de recebimento</p>
          </div>
        </div>

        {removerMutation.isError ? (
          <ErrorState
            compact
            label={getApiErrorMessage(removerMutation.error, 'Não foi possível excluir a receita.')}
          />
        ) : null}

        {isLoading ? (
          <LoadingState label="Carregando receitas..." />
        ) : isError ? (
          <ErrorState label={getApiErrorMessage(error, 'Não foi possível carregar as receitas.')} />
        ) : rendas.length === 0 ? (
          <EmptyState
            label="Nenhuma receita registrada ainda."
            icon={<TrendingUp aria-hidden="true" />}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data de recebimento</th>
                  <th className="align-right">Valor</th>
                  <th className="align-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rendas.map((renda) => (
                  <tr key={renda.id}>
                    <td>
                      <strong>{renda.descricao}</strong>
                    </td>
                    <td>
                      <span className="tag">{renda.categoria}</span>
                    </td>
                    <td>{formatDate(renda.dataRecebimento)}</td>
                    <td className="amount amount--positive align-right">{formatCurrency(renda.valor)}</td>
                    <td className="align-center">
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        onClick={() => removerMutation.mutate(renda.id)}
                        disabled={removerMutation.isPending}
                        aria-label={`Excluir receita ${renda.descricao}`}
                        title="Excluir receita"
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
        <Modal title="Adicionar nova receita" onClose={fecharModal}>
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
                label={getApiErrorMessage(criarMutation.error, 'Não foi possível salvar a receita.')}
              />
            ) : null}

            <div className="form-field">
              <label htmlFor="renda-descricao">Descrição</label>
              <input
                id="renda-descricao"
                type="text"
                required
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Ex.: Salário mensal"
              />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="renda-valor">Valor</label>
                <input
                  id="renda-valor"
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
                <label htmlFor="renda-data">Data de recebimento</label>
                <input
                  id="renda-data"
                  type="date"
                  required
                  value={dataRecebimento}
                  onChange={(event) => setDataRecebimento(event.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="renda-categoria">Categoria</label>
              <select
                id="renda-categoria"
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
              >
                <option value="Salário">Salário</option>
                <option value="Freelance">Freelance</option>
                <option value="Investimentos">Investimentos</option>
                <option value="Presente">Presente</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={fecharModal}>
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={criarMutation.isPending}>
                {criarMutation.isPending ? 'Salvando...' : 'Salvar receita'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};
