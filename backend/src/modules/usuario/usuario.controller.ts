import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/entities/User';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async criar(@Body() createUserDto: CreateUserDto) {
    return this.usuarioService.criar(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async listarTodos() {
    return this.usuarioService.listarTodos();
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async atualizarStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.usuarioService.atualizarStatus(id, updateStatusDto);
  }
}
