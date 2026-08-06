import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usuarioService.buscarPorEmailComSenha(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    if (!user.ativo) {
      throw new ForbiddenException('Acesso suspenso. Entre em contato com o administrador.');
    }

    const senhaValida = await bcrypt.compare(loginDto.senha, user.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    };
  }

  async obterPerfil(userId: string) {
    return this.usuarioService.buscarPorId(userId);
  }
}
