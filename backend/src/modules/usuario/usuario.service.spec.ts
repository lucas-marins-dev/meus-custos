import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsuarioService } from './usuario.service';
import { User, UserRole } from 'src/entities/User';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsuarioService (TDD)', () => {
  let service: UsuarioService;
  let repositoryMock: any;

  const mockUser: User = {
    id: 'user-uuid-123',
    nome: 'Maria Silva',
    email: 'maria@teste.com',
    senhaHash: '$2b$10$hashedpassword',
    role: UserRole.USER,
    ativo: true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    rendas: [],
    despesas: [],
    dividas: [],
    chatMessages: [],
  };

  beforeEach(async () => {
    repositoryMock = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((user) => Promise.resolve({ id: 'user-uuid-123', ...user })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([mockUser]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        {
          provide: getRepositoryToken(User),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve criar um novo usuário com sucesso', async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    const resultado = await service.criar({
      nome: 'Maria Silva',
      email: 'maria@teste.com',
      senha: 'password123',
    });

    expect(resultado.id).toBe('user-uuid-123');
    expect(resultado.email).toBe('maria@teste.com');
    expect(resultado).not.toHaveProperty('senhaHash');
  });

  it('deve lançar ConflictException se o e-mail já estiver cadastrado', async () => {
    repositoryMock.findOne.mockResolvedValue(mockUser);

    await expect(
      service.criar({
        nome: 'Maria Silva',
        email: 'maria@teste.com',
        senha: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('deve atualizar o status de um usuário (ativar/desativar)', async () => {
    repositoryMock.findOne.mockResolvedValue(mockUser);
    repositoryMock.save.mockImplementation((u) => Promise.resolve(u));

    const resultado = await service.atualizarStatus('user-uuid-123', { ativo: false });
    expect(resultado.ativo).toBe(false);
  });
});
