import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { DashboardMetricas } from '../types';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Store,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export const Dashboard: React.FC = () => {
  const { data: metricas, isLoading, isError } = useQuery<DashboardMetricas>({
    queryKey: ['dashboard-metricas'],
    queryFn: async () => {
      const res = await api.get('/dashboard/metricas');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !metricas) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
        Não foi possível carregar as métricas do Dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Visão Geral & Dashboard</h2>
        <p className="text-sm text-slate-400 mt-1">Acompanhe seu saldo, maiores gastos e previsão financeira mensal</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Saldo Atual */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Atual</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            R$ {metricas.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-400 mt-2 block">Baseado em receitas até hoje</span>
        </div>

        {/* Card 2: Saldo Previsto no Fim do Mês */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Previsão Fim do Mês</span>
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold ${metricas.saldoPrevistoFimMes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            R$ {metricas.saldoPrevistoFimMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-400 mt-2 block">Receitas - Despesas do mês</span>
        </div>

        {/* Card 3: Maior Gasto */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Maior Gasto Registrado</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          {metricas.maiorGasto ? (
            <div>
              <p className="text-2xl font-extrabold text-amber-400">
                R$ {metricas.maiorGasto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-300 truncate font-medium mt-1">
                {metricas.maiorGasto.descricao} ({metricas.maiorGasto.local})
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum gasto registrado</p>
          )}
        </div>

        {/* Card 4: Local com Mais Gastos */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Local Mais Caro</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
          </div>
          {metricas.localMaisGastos ? (
            <div>
              <p className="text-xl font-bold text-white truncate">
                {metricas.localMaisGastos.local}
              </p>
              <p className="text-xs text-purple-400 font-semibold mt-1">
                Acumulado: R$ {metricas.localMaisGastos.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum local mapeado</p>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Linha: Evolução Diária */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Evolução do Mês (Entradas x Saídas)</h3>
              <p className="text-xs text-slate-400">Comparativo por data de lançamento</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {metricas.evolucaoDiaria.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricas.evolucaoDiaria}>
                  <XAxis dataKey="data" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} name="Receita (R$)" />
                  <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={3} name="Despesa (R$)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Cadastre receitas e despesas com datas para visualizar o gráfico.
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Rosca: Gastos por Categoria */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
          <h3 className="text-lg font-bold text-white mb-2">Gastos por Categoria</h3>
          <p className="text-xs text-slate-400 mb-4">Distribuição percentual dos custos</p>

          <div className="h-64 w-full flex items-center justify-center">
            {metricas.gastosPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metricas.gastosPorCategoria}
                    dataKey="total"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {metricas.gastosPorCategoria.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm">Sem categorias cadastradas</div>
            )}
          </div>

          <div className="space-y-2 mt-2">
            {metricas.gastosPorCategoria.map((cat, idx) => (
              <div key={cat.categoria} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-300 font-medium">{cat.categoria}</span>
                </div>
                <span className="font-bold text-slate-200">
                  R$ {cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
