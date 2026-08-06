import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiChatService } from './ai-chat.service';
import { ChatMessage } from 'src/entities/ChatMessage';
import { User } from 'src/entities/User';
import { Renda } from 'src/entities/Renda';
import { Despesa } from 'src/entities/Despesa';
import { Divida } from 'src/entities/Divida';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AiChatService (TDD Rate Limiter 30s)', () => {
  let service: AiChatService;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn().mockResolvedValue({ id: 'u-1', nome: 'Lucas' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatService,
        { provide: getRepositoryToken(ChatMessage), useValue: mockRepo },
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: getRepositoryToken(Renda), useValue: mockRepo },
        { provide: getRepositoryToken(Despesa), useValue: mockRepo },
        { provide: getRepositoryToken(Divida), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AiChatService>(AiChatService);
  });

  it('deve enviar a primeira mensagem com sucesso', async () => {
    const res = await service.enviarMensagem('u-1', 'Qual meu saldo atual?');
    expect(res).toBeDefined();
    expect(res.proximaMensagemEmSegundos).toBe(30);
  });

  it('deve bloquear a segunda mensagem enviada em menos de 30 segundos (429 Too Many Requests)', async () => {
    await service.enviarMensagem('u-2', 'Primeira mensagem');

    await expect(
      service.enviarMensagem('u-2', 'Segunda mensagem imediata'),
    ).rejects.toThrow(HttpException);
  });
});
