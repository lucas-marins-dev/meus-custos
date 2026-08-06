import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Despesa, TipoDespesa } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, CreditCard, Store } from 'lucide-react';

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

  const { data: despesas = [], isLoading } = useQuery<Despesa[]>({
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
  const totalPagas = despesas.filter((d) => d.paga).reduce((acc, curr) => acc + Number(curr.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Gestão de Despesas & Gastos</h2>
          <p className="text-sm text-slate-400 mt-1">Acompanhe gastos ocasionais e recorrentes com locais e categorias</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Nova Despesa
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total de Despesas Cadastradas</span>
            <p className="text-2xl font-extrabold text-red-400">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Já Pago</span>
            <p className="text-2xl font-extrabold text-teal-400">
              R$ {totalPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabela de Despesas */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando despesas...</div>
        ) : despesas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma despesa cadastrada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Local / Estabelecimento</th>
                  <th className="px-6 py-4">Tipo & Categoria</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {despesas.map((despesa) => (
                  <tr key={despesa.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePagoMutation.mutate({ id: despesa.id, statusAtual: despesa.paga })}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          despesa.paga
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {despesa.paga ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                        {despesa.paga ? 'Paga' : 'Pendente'}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{despesa.descricao}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-500" />
                        {despesa.local}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          despesa.tipo === 'MENSAL' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {despesa.tipo}
                        </span>
                        <span className="text-slate-400 text-xs">{despesa.categoria}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(despesa.dataVencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-400">
                      R$ {Number(despesa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => removerMutation.mutate(despesa.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Adicionar Despesa */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Adicionar Nova Despesa</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                criarMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Compras de mercado, Conta de Luz..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Vencimento</label>
                  <input
                    type="date"
                    required
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Local / Estabelecimento</label>
                <input
                  type="text"
                  required
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex: Carrefour, Posto Shell, Farmácia..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipo</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoDespesa)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="OCASIONAL">Ocasional</option>
                    <option value="MENSAL">Mensal Recorrente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="paga-check"
                  checked={paga}
                  onChange={(e) => setPaga(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="paga-check" className="text-xs text-slate-300 font-medium">
                  Já foi paga?
                </label>
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
