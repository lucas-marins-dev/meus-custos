import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Renda } from 'src/entities/Renda';
import { CreateRendaDto } from './dto/create-renda.dto';
import { UpdateRendaDto } from './dto/update-renda.dto';

@Injectable()
export class RendaService {
  constructor(
    @InjectRepository(Renda)
    private readonly rendaRepository: Repository<Renda>,
  ) {}

  async criar(userId: string, createRendaDto: CreateRendaDto): Promise<Renda> {
    const novaRenda = this.rendaRepository.create({
      ...createRendaDto,
      userId,
      dataRecebimento: new Date(createRendaDto.dataRecebimento),
    });
    return this.rendaRepository.save(novaRenda);
  }

  async listarPorUsuario(userId: string): Promise<Renda[]> {
    return this.rendaRepository.find({
      where: { userId },
      order: { dataRecebimento: 'DESC' },
    });
  }

  async buscarPorId(userId: string, id: string): Promise<Renda> {
    const renda = await this.rendaRepository.findOne({
      where: { id, userId },
    });
    if (!renda) {
      throw new NotFoundException('Receita não encontrada');
    }
    return renda;
  }

  async atualizar(userId: string, id: string, updateRendaDto: UpdateRendaDto): Promise<Renda> {
    const renda = await this.buscarPorId(userId, id);
    if (updateRendaDto.descricao) renda.descricao = updateRendaDto.descricao;
    if (updateRendaDto.valor) renda.valor = updateRendaDto.valor;
    if (updateRendaDto.categoria) renda.categoria = updateRendaDto.categoria;
    if (updateRendaDto.dataRecebimento) renda.dataRecebimento = new Date(updateRendaDto.dataRecebimento);

    return this.rendaRepository.save(renda);
  }

  async remover(userId: string, id: string): Promise<void> {
    const renda = await this.buscarPorId(userId, id);
    await this.rendaRepository.remove(renda);
  }
}
