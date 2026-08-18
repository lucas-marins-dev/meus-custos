import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Clock, Send, Trash2 } from 'lucide-react';
import { ErrorState, LoadingState } from '../components/ui/Ui';
import { api } from '../services/api';
import { ChatMessage } from '../types';
import { getApiErrorMessage } from '../utils/format';

const QUICK_QUESTIONS = [
  'Qual foi meu maior gasto do mês?',
  'Como posso reduzir minhas despesas?',
  'Como organizar o pagamento das minhas dívidas?',
  'Faça uma previsão do meu orçamento.',
];

interface SendMessageResponse {
  proximaMensagemEmSegundos?: number;
}

const isRateLimitError = (error: unknown) => {
  if (typeof error !== 'object' || error === null) return false;
  return (error as { response?: { status?: number } }).response?.status === 429;
};

export const ChatIA: React.FC = () => {
  const queryClient = useQueryClient();
  const [mensagem, setMensagem] = useState('');
  const [tempoRestante, setTempoRestante] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: historico = [],
    isLoading,
    isError,
    error: historicoError,
  } = useQuery<ChatMessage[]>({
    queryKey: ['ai-chat-historico'],
    queryFn: async () => {
      const response = await api.get('/ai-chat/historico');
      return response.data;
    },
  });

  const enviarMutation = useMutation<SendMessageResponse, unknown, string>({
    mutationFn: async (texto) => {
      const response = await api.post('/ai-chat/mensagem', { mensagem: texto });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-historico'] });
      setMensagem('');
      setTempoRestante(data.proximaMensagemEmSegundos || 30);
    },
    onError: (error) => {
      if (isRateLimitError(error)) setTempoRestante(30);
    },
  });

  const limparMutation = useMutation<void, unknown, void>({
    mutationFn: async () => {
      await api.delete('/ai-chat/historico');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-historico'] });
    },
  });

  useEffect(() => {
    if (tempoRestante <= 0) return;
    const interval = window.setInterval(() => {
      setTempoRestante((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [tempoRestante]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historico, enviarMutation.isPending]);

  const envioIndisponivel = tempoRestante > 0 || enviarMutation.isPending;

  const enviarTexto = (texto: string) => {
    const textoLimpo = texto.trim();
    if (!textoLimpo || envioIndisponivel) return;
    setMensagem(texto);
    enviarMutation.mutate(textoLimpo);
  };

  const handleEnviar = (event: React.FormEvent) => {
    event.preventDefault();
    enviarTexto(mensagem);
  };

  return (
    <div className="assistant-page">
      <article className="panel assistant-card">
        <header className="assistant-head">
          <span className="assistant-mark" aria-hidden="true">
            <Bot />
          </span>
          <div className="assistant-head__copy">
            <h2>Assistente financeiro</h2>
            <span className="assistant-status"><i />Online · análise com seus dados reais</span>
          </div>
          <button
            type="button"
            className="assistant-clear"
            onClick={() => {
              if (window.confirm('Deseja limpar todo o histórico desta conversa?')) {
                limparMutation.mutate();
              }
            }}
            disabled={limparMutation.isPending || historico.length === 0}
            aria-label="Limpar histórico da conversa"
            title="Limpar histórico"
          >
            <Trash2 aria-hidden="true" />
          </button>
        </header>

        <div
          className="assistant-conversation"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-busy={isLoading || enviarMutation.isPending}
        >
          {isLoading ? (
            <LoadingState compact label="Carregando conversa..." />
          ) : isError ? (
            <ErrorState
              compact
              label={getApiErrorMessage(
                historicoError,
                'Não foi possível carregar o histórico da conversa.',
              )}
            />
          ) : historico.length === 0 ? (
            <div className="assistant-empty">
              <div className="assistant-row">
                <span className="assistant-mini" aria-hidden="true"><Bot /></span>
                <div className="assistant-message">
                  <strong>Olá! Como posso ajudar?</strong>
                  <p>
                    Posso analisar seus gastos, sugerir economias e ajudar a planejar o orçamento
                    usando seus lançamentos reais.
                  </p>
                </div>
              </div>

              <div className="suggestion-area">
                <span>Perguntas rápidas</span>
                <div className="suggestions assistant-suggestions">
                  {QUICK_QUESTIONS.map((pergunta) => (
                    <button
                      key={pergunta}
                      type="button"
                      onClick={() => enviarTexto(pergunta)}
                      disabled={envioIndisponivel}
                    >
                      {pergunta}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            historico.map((mensagemHistorico) =>
              mensagemHistorico.role === 'user' ? (
                <div className="chat-row user" key={mensagemHistorico.id}>
                  <div className="question-bubble">{mensagemHistorico.conteudo}</div>
                </div>
              ) : (
                <div className="chat-row assistant" key={mensagemHistorico.id}>
                  <span className="assistant-mini" aria-hidden="true"><Bot /></span>
                  <div className="answer">
                    <strong>Meus Custos</strong>
                    <p>{mensagemHistorico.conteudo}</p>
                  </div>
                </div>
              ),
            )
          )}

          {enviarMutation.isPending ? (
            <div className="chat-row assistant assistant-pending" role="status">
              <span className="assistant-mini" aria-hidden="true"><Bot /></span>
              <div className="answer">
                <strong>Meus Custos</strong>
                <p>Analisando seu perfil financeiro...</p>
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <form className="chat-compose assistant-composer" onSubmit={handleEnviar}>
          {enviarMutation.isError ? (
            <ErrorState
              compact
              label={getApiErrorMessage(
                enviarMutation.error,
                'Não foi possível enviar sua pergunta. Tente novamente.',
              )}
            />
          ) : null}
          {limparMutation.isError ? (
            <ErrorState
              compact
              label={getApiErrorMessage(
                limparMutation.error,
                'Não foi possível limpar o histórico da conversa.',
              )}
            />
          ) : null}

          <div className="chat-input">
            <input
              type="text"
              value={mensagem}
              maxLength={1000}
              onChange={(event) => {
                setMensagem(event.target.value);
                if (enviarMutation.isError) enviarMutation.reset();
              }}
              disabled={envioIndisponivel}
              aria-label="Mensagem para o assistente"
              placeholder={
                tempoRestante > 0
                  ? `Aguarde ${tempoRestante}s para enviar outra pergunta...`
                  : 'Pergunte sobre suas finanças...'
              }
            />
            <button
              type="submit"
              disabled={!mensagem.trim() || envioIndisponivel}
              aria-label={tempoRestante > 0 ? `Aguarde ${tempoRestante} segundos` : 'Enviar mensagem'}
              title={tempoRestante > 0 ? `Aguarde ${tempoRestante}s` : 'Enviar'}
            >
              {tempoRestante > 0 ? <Clock aria-hidden="true" /> : <Send aria-hidden="true" />}
            </button>
          </div>
          <small>
            {tempoRestante > 0
              ? `Nova pergunta disponível em ${tempoRestante}s.`
              : 'A IA pode cometer erros. Confira informações importantes.'}
          </small>
        </form>
      </article>
    </div>
  );
};
