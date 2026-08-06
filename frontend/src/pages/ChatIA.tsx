import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ChatMessage } from '../types';
import { Bot, Send, User as UserIcon, Trash2, Clock, Sparkles } from 'lucide-react';

export const ChatIA: React.FC = () => {
  const queryClient = useQueryClient();
  const [mensagem, setMensagem] = useState('');
  const [tempoRestante, setTempoRestante] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: historico = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['ai-chat-historico'],
    queryFn: async () => {
      const res = await api.get('/ai-chat/historico');
      return res.data;
    },
  });

  const enviarMutation = useMutation({
    mutationFn: async (texto: string) => {
      const res = await api.post('/ai-chat/mensagem', { mensagem: texto });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-historico'] });
      setMensagem('');
      // Inicia o timer de 30 segundos no frontend
      setTempoRestante(data.proximaMensagemEmSegundos || 30);
    },
    onError: (err: any) => {
      if (err.response?.status === 429) {
        setTempoRestante(30);
      }
    },
  });

  const limparMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/ai-chat/historico');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-historico'] });
    },
  });

  // Efeito para contagem regressiva de 30 segundos do Timer
  useEffect(() => {
    if (tempoRestante <= 0) return;
    const interval = setInterval(() => {
      setTempoRestante((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [tempoRestante]);

  // Rolar automaticamente para o final da conversa
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historico, enviarMutation.isPending]);

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim() || tempoRestante > 0 || enviarMutation.isPending) return;
    enviarMutation.mutate(mensagem);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Header do Chat */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-lg shadow-emerald-950/50">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              Consultor Financeiro Gemini
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-xs text-slate-400">Inteligência Artificial alimentada pelos seus dados financeiros</p>
          </div>
        </div>

        <button
          onClick={() => limparMutation.mutate()}
          title="Limpar histórico de conversa"
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Área de Mensagens (Scrollable) */}
      <div className="flex-1 glass-panel p-6 rounded-2xl border border-slate-800 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8 text-slate-400">Carregando conversa...</div>
        ) : historico.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Bot className="w-12 h-12 text-emerald-500/40 mx-auto" />
            <p className="font-semibold text-slate-300">Olá! Sou seu assistente financeiro pessoal.</p>
            <p className="text-xs max-w-md mx-auto text-slate-500">
              Pergunte qualquer coisa sobre suas receitas, maiores gastos, dicas de economia ou previsão de orçamento.
            </p>
          </div>
        ) : (
          historico.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                }`}
              >
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30 rounded-tr-none'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                {msg.conteudo}
              </div>
            </div>
          ))
        )}

        {enviarMutation.isPending && (
          <div className="flex gap-3 mr-auto max-w-[80%] items-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-400 text-sm italic border border-slate-800">
              Analisando seu perfil financeiro...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Form e Timer de 30 Segundos */}
      <form onSubmit={handleEnviar} className="flex gap-3 shrink-0">
        <input
          type="text"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          disabled={tempoRestante > 0 || enviarMutation.isPending}
          placeholder={
            tempoRestante > 0
              ? `Aguarde a contagem de 30s (${tempoRestante}s)...`
              : 'Digite sua pergunta financeira...'
          }
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 outline-none disabled:opacity-50 transition"
        />

        <button
          type="submit"
          disabled={!mensagem.trim() || tempoRestante > 0 || enviarMutation.isPending}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition disabled:opacity-50 min-w-[140px] justify-center"
        >
          {tempoRestante > 0 ? (
            <>
              <Clock className="w-4 h-4 animate-spin text-amber-300" />
              <span>{tempoRestante}s</span>
            </>
          ) : (
            <>
              <span>Enviar</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
