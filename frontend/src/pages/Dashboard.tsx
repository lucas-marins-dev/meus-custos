import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  Store,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { DashboardMetricas, Despesa } from '../types';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
} from '../components/ui/Ui';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/format';

const CHART_COLORS = [
  'var(--primary)',
  'var(--red)',
  'var(--blue)',
  'var(--yellow)',
  'var(--purple)',
  '#f97316',
  '#06b6d4',
];

const formatChartDate = (value: string) => {
  const parts = value.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : value;
};

export const Dashboard: React.FC = () => {
  const {
    data: metricas,
    isLoading: metricasLoading,
    isError: metricasIsError,
    error: metricasError,
  } = useQuery<DashboardMetricas>({
    queryKey: ['dashboard-metricas'],
    queryFn: async () => {
      const response = await api.get('/dashboard/metricas');
      return response.data;
    },
  });

  const {
    data: despesas = [],
    isLoading: despesasLoading,
    isError: despesasIsError,
    error: despesasError,
  } = useQuery<Despesa[]>({
    queryKey: ['despesas'],
    queryFn: async () => {
      const response = await api.get('/despesas');
      return response.data;
    },
  });

  const despesasRecentes = [...despesas]
    .sort((a, b) =>
      (b.criadoEm || b.dataVencimento).localeCompare(a.criadoEm || a.dataVencimento),
    )
    .slice(0, 5);

  return (
    <div className="view-stack dashboard-view">
      <PageHeader
        title="Visão geral"
        subtitle="Acompanhe seu saldo, seus gastos e a previsão financeira do mês"
      />

      {metricasLoading ? (
        <LoadingState label="Carregando métricas do dashboard..." />
      ) : metricasIsError || !metricas ? (
        <ErrorState
          label={getApiErrorMessage(
            metricasError,
            'Não foi possível carregar as métricas do dashboard.',
          )}
        />
      ) : (
        <>
          <section className="stats-grid" aria-label="Resumo financeiro">
            <MetricCard
              label="Saldo atual"
              value={formatCurrency(metricas.saldoAtual)}
              note="Receitas recebidas menos despesas pagas"
              icon={<Wallet aria-hidden="true" />}
              tone={metricas.saldoAtual >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="Previsão fim do mês"
              value={formatCurrency(metricas.saldoPrevistoFimMes)}
              note="Receitas menos despesas previstas no mês"
              icon={<CalendarDays aria-hidden="true" />}
              tone={metricas.saldoPrevistoFimMes >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="Maior gasto"
              value={metricas.maiorGasto ? formatCurrency(metricas.maiorGasto.valor) : 'Sem dados'}
              note={
                metricas.maiorGasto
                  ? `${metricas.maiorGasto.descricao} · ${metricas.maiorGasto.local}`
                  : 'Cadastre uma despesa para acompanhar'
              }
              icon={<AlertTriangle aria-hidden="true" />}
              tone="warning"
            />
            <MetricCard
              label="Local mais caro"
              value={metricas.localMaisGastos?.local || 'Sem dados'}
              note={
                metricas.localMaisGastos
                  ? `Total de ${formatCurrency(metricas.localMaisGastos.totalGasto)}`
                  : 'Nenhum estabelecimento mapeado'
              }
              icon={<Store aria-hidden="true" />}
            />
          </section>

          <section className="charts-grid" aria-label="Gráficos financeiros">
            <article className="panel chart-panel">
              <h2>Evolução do mês (entradas × saídas)</h2>
              <p className="muted">Comparativo por data de lançamento</p>

              <div className="dashboard-chart dashboard-chart--bars" aria-label="Gráfico de entradas e saídas">
                {metricas.evolucaoDiaria.length === 0 ? (
                  <EmptyState
                    compact
                    label="Cadastre receitas e despesas com datas neste mês para visualizar o gráfico."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={metricas.evolucaoDiaria}
                      margin={{ top: 24, right: 8, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="data"
                        tickFormatter={formatChartDate}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted)', fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={58}
                        tick={{ fill: 'var(--muted)', fontSize: 11 }}
                        tickFormatter={(value) =>
                          new Intl.NumberFormat('pt-BR', {
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(Number(value))
                        }
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--surface-2)' }}
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          color: 'var(--text)',
                        }}
                        labelFormatter={(label) => formatDate(String(label))}
                        formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
                      />
                      <Bar
                        dataKey="receita"
                        name="Receitas"
                        fill="var(--primary)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={22}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="despesa"
                        name="Despesas"
                        fill="var(--red)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={22}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {metricas.evolucaoDiaria.length > 0 ? (
                <div className="chart-key" aria-label="Legenda do gráfico">
                  <span><i className="green" />Receitas</span>
                  <span><i className="red" />Despesas</span>
                </div>
              ) : null}
            </article>

            <article className="panel category-panel">
              <h2>Gastos por categoria</h2>
              <p className="muted">Distribuição dos custos registrados</p>

              {metricas.gastosPorCategoria.length === 0 ? (
                <EmptyState compact label="Nenhuma categoria de despesa cadastrada." />
              ) : (
                <>
                  <div className="dashboard-chart dashboard-chart--pie" aria-label="Gráfico de gastos por categoria">
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie
                          data={metricas.gastosPorCategoria}
                          dataKey="total"
                          nameKey="categoria"
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={88}
                          paddingAngle={3}
                          stroke="var(--surface)"
                          strokeWidth={2}
                          isAnimationActive={false}
                        >
                          {metricas.gastosPorCategoria.map((categoria, index) => (
                            <Cell
                              key={`${categoria.categoria}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            color: 'var(--text)',
                          }}
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <ul className="legend" aria-label="Legenda de gastos por categoria">
                    {metricas.gastosPorCategoria.map((categoria, index) => (
                      <li key={categoria.categoria}>
                        <span>
                          <i style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          {categoria.categoria}
                        </span>
                        <strong>{formatCurrency(categoria.total)}</strong>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </section>
        </>
      )}

      <article className="panel recent-panel">
        <h2>Lançamentos recentes</h2>
        <p className="muted">Últimas despesas registradas</p>

        {despesasLoading ? (
          <LoadingState compact label="Carregando lançamentos recentes..." />
        ) : despesasIsError ? (
          <ErrorState
            compact
            label={getApiErrorMessage(
              despesasError,
              'Não foi possível carregar os lançamentos recentes.',
            )}
          />
        ) : despesasRecentes.length === 0 ? (
          <EmptyState compact label="Nenhuma despesa cadastrada ainda." />
        ) : (
          <div className="recent-list">
            {despesasRecentes.map((despesa) => (
              <div className="recent-row" key={despesa.id}>
                <div>
                  <strong>{despesa.descricao}</strong>
                  <span>{despesa.local} · {formatDate(despesa.dataVencimento)}</span>
                </div>
                <span className="tag">{despesa.categoria}</span>
                <strong className="amount">{formatCurrency(despesa.valor)}</strong>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};
