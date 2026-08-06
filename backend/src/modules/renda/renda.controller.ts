import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RendaService } from './renda.service';
import { CreateRendaDto } from './dto/create-renda.dto';
import { UpdateRendaDto } from './dto/update-renda.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('rendas')
@UseGuards(JwtAuthGuard)
export class RendaController {
  constructor(private readonly rendaService: RendaService) {}

  @Post()
  async criar(
    @CurrentUser('sub') userId: string,
    @Body() createRendaDto: CreateRendaDto,
  ) {
    return this.rendaService.criar(userId, createRendaDto);
  }

  @Get()
  async listar(@CurrentUser('sub') userId: string) {
    return this.rendaService.listarPorUsuario(userId);
  }

  @Get(':id')
  async buscarPorId(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.rendaService.buscarPorId(userId, id);
  }

  @Patch(':id')
  async atualizar(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() updateRendaDto: UpdateRendaDto,
  ) {
    return this.rendaService.atualizar(userId, id, updateRendaDto);
  }

  @Delete(':id')
  async remover(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    await this.rendaService.remover(userId, id);
    return { message: 'Receita removida com sucesso' };
  }
}
