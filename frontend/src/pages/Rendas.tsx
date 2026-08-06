import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Renda } from '../types';
import { Plus, Trash2, Calendar, DollarSign, Tag, TrendingUp } from 'lucide-react';

export const Rendas: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataRecebimento, setDataRecebimento] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState('Salário');

  const { data: rendas = [], isLoading } = useQuery<Renda[]>({
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Gestão de Receitas (Rendas)</h2>
          <p className="text-sm text-slate-400 mt-1">Registre e acompanhe suas entradas financeiras por data de recebimento</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Nova Receita
        </button>
      </div>

      {/* Card de Resumo */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total de Entradas</span>
            <p className="text-2xl font-extrabold text-emerald-400">
              R$ {totalRendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Receitas */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando receitas...</div>
        ) : rendas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma receita registrada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Data Recebimento</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rendas.map((renda) => (
                  <tr key={renda.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 font-semibold text-white">{renda.descricao}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700">
                        {renda.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(renda.dataRecebimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      R$ {Number(renda.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => removerMutation.mutate(renda.id)}
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

      {/* Modal para Adicionar Receita */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Adicionar Nova Receita</h3>

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
                  placeholder="Ex: Salário Mensal, Venda de item..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

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
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Data de Recebimento</label>
                <input
                  type="date"
                  required
                  value={dataRecebimento}
                  onChange={(e) => setDataRecebimento(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                >
                  <option value="Salário">Salário</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Investimentos">Investimentos</option>
                  <option value="Presente">Presente</option>
                  <option value="Outros">Outros</option>
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
