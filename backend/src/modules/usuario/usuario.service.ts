import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/entities/User';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async criar(createUserDto: CreateUserDto): Promise<Omit<User, 'senhaHash'>> {
    const usuarioExistente = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (usuarioExistente) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(createUserDto.senha, salt);

    const novoUsuario = this.userRepository.create({
      nome: createUserDto.nome,
      email: createUserDto.email,
      senhaHash,
      role: createUserDto.role || UserRole.USER,
      ativo: true,
    });

    const usuarioSalvo = await this.userRepository.save(novoUsuario);
    const { senhaHash: _, ...userSemSenha } = usuarioSalvo;
    return userSemSenha;
  }

  async listarTodos(): Promise<Omit<User, 'senhaHash'>[]> {
    const usuarios = await this.userRepository.find({
      order: { criadoEm: 'DESC' },
    });
    return usuarios.map(({ senhaHash, ...user }) => user);
  }

  async buscarPorId(id: string): Promise<Omit<User, 'senhaHash'>> {
    const usuario = await this.userRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const { senhaHash, ...userSemSenha } = usuario;
    return userSemSenha;
  }

  async buscarPorEmailComSenha(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async atualizarStatus(id: string, updateStatusDto: UpdateUserStatusDto): Promise<Omit<User, 'senhaHash'>> {
    const usuario = await this.userRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    usuario.ativo = updateStatusDto.ativo;
    const usuarioAtualizado = await this.userRepository.save(usuario);
    const { senhaHash, ...userSemSenha } = usuarioAtualizado;
    return userSemSenha;
  }
}
