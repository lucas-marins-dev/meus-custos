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
import { DespesaService } from './despesa.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('despesas')
@UseGuards(JwtAuthGuard)
export class DespesaController {
  constructor(private readonly despesaService: DespesaService) {}

  @Post()
  async criar(
    @CurrentUser('sub') userId: string,
    @Body() createDespesaDto: CreateDespesaDto,
  ) {
    return this.despesaService.criar(userId, createDespesaDto);
  }

  @Get()
  async listar(@CurrentUser('sub') userId: string) {
    return this.despesaService.listarPorUsuario(userId);
  }

  @Get(':id')
  async buscarPorId(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.despesaService.buscarPorId(userId, id);
  }

  @Patch(':id')
  async atualizar(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() updateDespesaDto: UpdateDespesaDto,
  ) {
    return this.despesaService.atualizar(userId, id, updateDespesaDto);
  }

  @Delete(':id')
  async remover(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    await this.despesaService.remover(userId, id);
    return { message: 'Despesa removida com sucesso' };
  }
}
