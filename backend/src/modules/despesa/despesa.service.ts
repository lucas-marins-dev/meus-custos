import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Despesa, TipoDespesa } from 'src/entities/Despesa';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';

@Injectable()
export class DespesaService {
  constructor(
    @InjectRepository(Despesa)
    private readonly despesaRepository: Repository<Despesa>,
  ) {}

  async criar(userId: string, createDespesaDto: CreateDespesaDto): Promise<Despesa> {
    const novaDespesa = this.despesaRepository.create({
      ...createDespesaDto,
      userId,
      tipo: createDespesaDto.tipo || TipoDespesa.OCASIONAL,
      paga: createDespesaDto.paga ?? false,
      dataVencimento: new Date(createDespesaDto.dataVencimento),
    });
    return this.despesaRepository.save(novaDespesa);
  }

  async listarPorUsuario(userId: string): Promise<Despesa[]> {
    return this.despesaRepository.find({
      where: { userId },
      order: { dataVencimento: 'DESC' },
    });
  }

  async buscarPorId(userId: string, id: string): Promise<Despesa> {
    const despesa = await this.despesaRepository.findOne({
      where: { id, userId },
    });
    if (!despesa) {
      throw new NotFoundException('Despesa não encontrada');
    }
    return despesa;
  }

  async atualizar(userId: string, id: string, updateDespesaDto: UpdateDespesaDto): Promise<Despesa> {
    const despesa = await this.buscarPorId(userId, id);
    if (updateDespesaDto.descricao) despesa.descricao = updateDespesaDto.descricao;
    if (updateDespesaDto.valor) despesa.valor = updateDespesaDto.valor;
    if (updateDespesaDto.local) despesa.local = updateDespesaDto.local;
    if (updateDespesaDto.categoria) despesa.categoria = updateDespesaDto.categoria;
    if (updateDespesaDto.tipo) despesa.tipo = updateDespesaDto.tipo;
    if (updateDespesaDto.paga !== undefined) despesa.paga = updateDespesaDto.paga;
    if (updateDespesaDto.dataVencimento) despesa.dataVencimento = new Date(updateDespesaDto.dataVencimento);

    return this.despesaRepository.save(despesa);
  }

  async remover(userId: string, id: string): Promise<void> {
    const despesa = await this.buscarPorId(userId, id);
    await this.despesaRepository.remove(despesa);
  }
}
