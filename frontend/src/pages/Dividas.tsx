import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Divida, StatusDivida } from '../types';
import { Plus, Trash2, Building2, CheckCircle, Clock } from 'lucide-react';

export const Dividas: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [credor, setCredor] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [valorPago, setValorPago] = useState('0');
  const [dataVencimento, setDataVencimento] = useState('');

  const { data: dividas = [], isLoading } = useQuery<Divida[]>({
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
  const totalQuitadas = dividas.filter((d) => d.status === 'QUITADA').reduce((acc, curr) => acc + Number(curr.valorTotal), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Controle de Dívidas</h2>
          <p className="text-sm text-slate-400 mt-1">Gerencie débitos, empréstimos e parcelamentos com acompanhamento de pagamentos</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Registrar Dívida
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Geral de Dívidas</span>
            <p className="text-2xl font-extrabold text-amber-400">
              R$ {totalDividas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Quitado</span>
            <p className="text-2xl font-extrabold text-emerald-400">
              R$ {totalQuitadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabela de Dívidas */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando dívidas...</div>
        ) : dividas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma dívida cadastrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Credor / Banco</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-right">Valor Pago</th>
                  <th className="px-6 py-4 text-right">Restante</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dividas.map((divida) => {
                  const restante = Number(divida.valorTotal) - Number(divida.valorPago);
                  return (
                    <tr key={divida.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-6 py-4 font-semibold text-white">{divida.credor}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          divida.status === 'QUITADA'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : divida.status === 'PARCIAL'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {divida.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-white">
                        R$ {Number(divida.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                        R$ {Number(divida.valorPago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-amber-400">
                        R$ {restante > 0 ? restante.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removerMutation.mutate(divida.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Registrar Dívida */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Registrar Nova Dívida</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                criarMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Credor / Instituição</label>
                <input
                  type="text"
                  required
                  value={credor}
                  onChange={(e) => setCredor(e.target.value)}
                  placeholder="Ex: Banco Itaú, Cartão Santander..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Já Pago (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Data de Vencimento (Opcional)</label>
                <input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
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
                  {criarMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
