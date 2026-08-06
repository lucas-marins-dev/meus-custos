import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from 'src/entities/ChatMessage';
import { User } from 'src/entities/User';
import { Renda } from 'src/entities/Renda';
import { Despesa } from 'src/entities/Despesa';
import { Divida } from 'src/entities/Divida';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly ultimasMensagensPorUsuario = new Map<string, number>();

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Renda)
    private readonly rendaRepo: Repository<Renda>,
    @InjectRepository(Despesa)
    private readonly despesaRepo: Repository<Despesa>,
    @InjectRepository(Divida)
    private readonly dividaRepo: Repository<Divida>,
  ) {}

  async enviarMensagem(userId: string, conteudoMensagem: string): Promise<{
    resposta: string;
    proximaMensagemEmSegundos: number;
    historico: ChatMessage[];
  }> {
    // 1. Rate limiting backend: Trava de 30 segundos
    const agora = Date.now();
    const ultimaMensagemTime = this.ultimasMensagensPorUsuario.get(userId);

    if (ultimaMensagemTime) {
      const segundosDecorridos = (agora - ultimaMensagemTime) / 1000;
      if (segundosDecorridos < 30) {
        const segundosRestantes = Math.ceil(30 - segundosDecorridos);
        throw new HttpException(
          `Aguarde mais ${segundosRestantes} segundos antes de enviar outra pergunta para a IA.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 2. Registra o timestamp da nova mensagem do usuário
    this.ultimasMensagensPorUsuario.set(userId, agora);

    // 3. Salva a mensagem do usuário no banco MySQL
    const userMsg = this.chatRepo.create({
      userId,
      role: 'user',
      conteudo: conteudoMensagem,
    });
    await this.chatRepo.save(userMsg);

    // 4. Constrói o contexto financeiro completo do usuário
    const contextoFinanceiro = await this.gerarContextoFinanceiro(userId);

    // 5. Consulta o modelo Google Gemini (ou gera fallback se a chave não estiver configurada)
    let respostaIa = '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey !== 'mock_or_real_key') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const promptCompleto = `${contextoFinanceiro}\n\nPergunta do Usuário: ${conteudoMensagem}`;
        const result = await model.generateContent(promptCompleto);
        const responseText = result.response.text();
        respostaIa = responseText || 'Desculpe, não consegui processar sua resposta no momento.';
      } catch (error) {
        this.logger.error('Erro ao chamar Google Gemini API:', error);
        respostaIa = this.gerarRespostaSimulada(contextoFinanceiro, conteudoMensagem);
      }
    } else {
      respostaIa = this.gerarRespostaSimulada(contextoFinanceiro, conteudoMensagem);
    }

    // 6. Salva a resposta do assistente no banco MySQL
    const aiMsg = this.chatRepo.create({
      userId,
      role: 'model',
      conteudo: respostaIa,
    });
    await this.chatRepo.save(aiMsg);

    // 7. Retorna histórico atualizado e tempo de espera
    const historico = await this.listarHistorico(userId);

    return {
      resposta: respostaIa,
      proximaMensagemEmSegundos: 30,
      historico,
    };
  }

  async listarHistorico(userId: string): Promise<ChatMessage[]> {
    return this.chatRepo.find({
      where: { userId },
      order: { criadoEm: 'ASC' },
      take: 50,
    });
  }

  async limparHistorico(userId: string): Promise<void> {
    await this.chatRepo.delete({ userId });
  }

  private async gerarContextoFinanceiro(userId: string): Promise<string> {
    const usuario = await this.userRepo.findOne({ where: { id: userId } });
    const rendas = await this.rendaRepo.find({ where: { userId } });
    const despesas = await this.despesaRepo.find({ where: { userId } });
    const dividas = await this.dividaRepo.find({ where: { userId } });

    const totalRendas = rendas.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const totalDespesas = despesas.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const saldo = (totalRendas - totalDespesas).toFixed(2);

    const rendasTexto = rendas.map((r) => `- R$ ${r.valor} (${r.descricao} em ${r.dataRecebimento})`).join('\n');
    const despesasTexto = despesas.map((d) => `- R$ ${d.valor} (${d.descricao} em ${d.local}, Cat: ${d.categoria})`).join('\n');
    const dividasTexto = dividas.map((div) => `- ${div.credor}: R$ ${div.valorTotal} (Pago: R$ ${div.valorPago})`).join('\n');

    return `Você é um Consultor Financeiro Pessoal atencioso, prático e motivador.
Sua missão é ajudar o usuário ${usuario?.nome || 'Cliente'} a gerenciar suas finanças com clareza.

--- PERFIL FINANCEIRO ATUAL DO USUÁRIO ---
- Nome: ${usuario?.nome || 'Usuário'}
- Saldo Calculado: R$ ${saldo}
- Receitas Registradas (Total: R$ ${totalRendas}):
${rendasTexto || 'Nenhuma receita cadastrada ainda.'}

- Despesas Registradas (Total: R$ ${totalDespesas}):
${despesasTexto || 'Nenhuma despesa cadastrada ainda.'}

- Dívidas Registradas:
${dividasTexto || 'Nenhuma dívida registrada.'}

Responda à pergunta abaixo com conselhos práticos, claros e em português do Brasil (PT-BR). Mantenha um tom amigável.`;
  }

  private gerarRespostaSimulada(contexto: string, pergunta: string): string {
    const perguntaLower = pergunta.toLowerCase();

    if (perguntaLower.includes('saldo') || perguntaLower.includes('quanto tenho')) {
      return 'Analisando seus dados: seu saldo calculado atual é baseado nas receitas e despesas cadastradas. Recomendo manter suas despesas mensais sob controle e reservar ao menos 10% para emergências!';
    }
    if (perguntaLower.includes('gasto') || perguntaLower.includes('economizar') || perguntaLower.includes('dica')) {
      return 'Para otimizar seus custos, observe os estabelecimentos onde você realiza compras ocasionais com frequência. Pequenos cortes diários podem gerar uma grande economia no final do mês!';
    }
    return `Com base na sua saúde financeira atual, identifiquei que manter os registros de rendas e despesas atualizados é o melhor caminho. Como posso ajudar a planejar suas próximas metas financeiras?`;
  }
}
