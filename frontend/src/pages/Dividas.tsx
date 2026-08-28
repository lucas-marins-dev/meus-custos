import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Calendar, CheckCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, MetricCard, Modal, PageHeader } from '../components/ui/Ui';
import { api } from '../services/api';
import { Divida, StatusDivida } from '../types';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/format';

const statusLabel: Record<StatusDivida, string> = {
  PENDENTE: 'Pendente',
  PARCIAL: 'Parcial',
  QUITADA: 'Quitada',
};

const statusTone: Record<StatusDivida, string> = {
  PENDENTE: 'status-pill--negative',
  PARCIAL: 'status-pill--warning',
  QUITADA: 'status-pill--positive',
};

export const Dividas: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [credor, setCredor] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [valorPago, setValorPago] = useState('0');
  const [dataVencimento, setDataVencimento] = useState('');

  const {
    data: dividas = [],
    isLoading,
    isError,
    error,
  } = useQuery<Divida[]>({
    queryKey: ['dividas'],
    queryFn: async () => {
      const res = await api.get('/dividas');
      return res.data;
    },
  });

  const criarMutation = useMutation({
    mutationFn: async () => {
      await api.post('/dividas', {
        credor,
        valorTotal: parseFloat(valorTotal),
        valorPago: parseFloat(valorPago || '0'),
        dataVencimento: dataVencimento || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metricas'] });
      setModalAberto(false);
      setCredor('');
      setValorTotal('');
      setValorPago('0');
    },
  });

  const removerMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dividas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metricas'] });
    },
  });

  const totalDividas = dividas.reduce((acc, curr) => acc + Number(curr.valorTotal), 0);
  const totalPago = dividas.reduce((acc, curr) => acc + Number(curr.valorPago), 0);
  const totalSobrepago = dividas.reduce(
    (acc, curr) => acc + Math.max(Number(curr.valorPago) - Number(curr.valorTotal), 0),
    0,
  );
  const totalQuitadas = dividas
    .filter((divida) => divida.status === 'QUITADA')
    .reduce((acc, curr) => acc + Number(curr.valorTotal), 0);
  const saldoDevedor = dividas.reduce(
    (acc, curr) => acc + Math.max(Number(curr.valorTotal) - Number(curr.valorPago), 0),
    0,
  );

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
        title="Dívidas"
        subtitle="Débitos, empréstimos e parcelamentos com acompanhamento de pagamentos"
        action={
          <button type="button" className="primary-button" onClick={abrirModal}>
            <Plus aria-hidden="true" />
            Registrar dívida
          </button>
        }
      />

      {!isLoading && !isError ? (
        <section className="metrics-grid" aria-label="Resumo das dívidas">
          <MetricCard
            label="Total contratado"
            value={formatCurrency(totalDividas)}
            note={`${dividas.length} ${dividas.length === 1 ? 'compromisso registrado' : 'compromissos registrados'}`}
            icon={<Building2 aria-hidden="true" />}
            tone="warning"
          />
          <MetricCard
            label="Valor já pago"
            value={formatCurrency(totalPago)}
            note={
              totalSobrepago > 0
                ? `Inclui ${formatCurrency(totalSobrepago)} pago além do contratado`
                : `Quitado por completo: ${formatCurrency(totalQuitadas)}`
            }
            icon={<CheckCircle aria-hidden="true" />}
            tone="positive"
          />
          <MetricCard
            label="Saldo devedor"
            value={formatCurrency(saldoDevedor)}
            note="Valor restante dos compromissos"
            icon={<Clock aria-hidden="true" />}
            tone="negative"
          />
        </section>
      ) : null}

      {removerMutation.isError ? (
        <ErrorState
          compact
          label={getApiErrorMessage(removerMutation.error, 'Não foi possível excluir a dívida.')}
        />
      ) : null}

      {isLoading ? (
        <section className="panel">
          <LoadingState label="Carregando dívidas..." />
        </section>
      ) : isError ? (
        <section className="panel">
          <ErrorState label={getApiErrorMessage(error, 'Não foi possível carregar as dívidas.')} />
        </section>
      ) : dividas.length === 0 ? (
        <section className="panel">
          <EmptyState label="Nenhuma dívida cadastrada." icon={<Building2 aria-hidden="true" />} />
        </section>
      ) : (
        <section className="debt-list" aria-label="Dívidas cadastradas">
          {dividas.map((divida) => {
            const total = Number(divida.valorTotal);
            const pago = Number(divida.valorPago);
            const restante = Math.max(total - pago, 0);
            const progresso = total > 0 ? Math.min(Math.max((pago / total) * 100, 0), 100) : 0;

            return (
              <article className="panel debt-card" key={divida.id}>
                <div className="debt-card__header">
                  <div className="debt-card__identity">
                    <span className="debt-card__icon">
                      <Building2 aria-hidden="true" />
                    </span>
                    <div>
                      <h2>{divida.credor}</h2>
                      <p>
                        <Calendar aria-hidden="true" />
                        Vencimento: {formatDate(divida.dataVencimento)}
                      </p>
                    </div>
                  </div>

                  <div className="debt-card__actions">
                    <span className={`status-pill ${statusTone[divida.status]}`}>
                      {statusLabel[divida.status]}
                    </span>
                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      onClick={() => removerMutation.mutate(divida.id)}
                      disabled={removerMutation.isPending}
                      aria-label={`Excluir dívida com ${divida.credor}`}
                      title="Excluir dívida"
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="debt-card__values">
                  <div>
                    <span>Valor total</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                  <div>
                    <span>Valor pago</span>
                    <strong className="positive-value">{formatCurrency(pago)}</strong>
                  </div>
                  <div>
                    <span>Saldo restante</span>
                    <strong>{formatCurrency(restante)}</strong>
                  </div>
                </div>

                <div className="debt-progress">
                  <div className="debt-progress__label">
                    <span>Progresso do pagamento</span>
                    <strong>{Math.round(progresso)}%</strong>
                  </div>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    aria-label={`Progresso da dívida com ${divida.credor}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progresso)}
                  >
                    <span style={{ width: `${progresso}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modalAberto ? (
        <Modal title="Registrar nova dívida" onClose={fecharModal}>
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
                label={getApiErrorMessage(criarMutation.error, 'Não foi possível salvar a dívida.')}
              />
            ) : null}

            <div className="form-field">
              <label htmlFor="divida-credor">Credor ou instituição</label>
              <input
                id="divida-credor"
                type="text"
                required
                value={credor}
                onChange={(event) => setCredor(event.target.value)}
                placeholder="Ex.: Banco ou financeira"
              />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="divida-total">Valor total</label>
                <input
                  id="divida-total"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={valorTotal}
                  onChange={(event) => setValorTotal(event.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="form-field">
                <label htmlFor="divida-pago">Valor já pago</label>
                <input
                  id="divida-pago"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorPago}
                  onChange={(event) => setValorPago(event.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="divida-vencimento">Data de vencimento (opcional)</label>
              <input
                id="divida-vencimento"
                type="date"
                value={dataVencimento}
                onChange={(event) => setDataVencimento(event.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={fecharModal}>
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={criarMutation.isPending}>
                {criarMutation.isPending ? 'Salvando...' : 'Salvar dívida'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};
