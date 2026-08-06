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
import { DividaService } from './divida.service';
import { CreateDividaDto } from './dto/create-divida.dto';
import { UpdateDividaDto } from './dto/update-divida.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dividas')
@UseGuards(JwtAuthGuard)
export class DividaController {
  constructor(private readonly dividaService: DividaService) {}

  @Post()
  async criar(
    @CurrentUser('sub') userId: string,
    @Body() createDividaDto: CreateDividaDto,
  ) {
    return this.dividaService.criar(userId, createDividaDto);
  }

  @Get()
  async listar(@CurrentUser('sub') userId: string) {
    return this.dividaService.listarPorUsuario(userId);
  }

  @Get(':id')
  async buscarPorId(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.dividaService.buscarPorId(userId, id);
  }

  @Patch(':id')
  async atualizar(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() updateDividaDto: UpdateDividaDto,
  ) {
    return this.dividaService.atualizar(userId, id, updateDividaDto);
  }

  @Delete(':id')
  async remover(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    await this.dividaService.remover(userId, id);
    return { message: 'Dívida removida com sucesso' };
  }
}
