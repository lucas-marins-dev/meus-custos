import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Divida, StatusDivida } from 'src/entities/Divida';
import { CreateDividaDto } from './dto/create-divida.dto';
import { UpdateDividaDto } from './dto/update-divida.dto';

@Injectable()
export class DividaService {
  constructor(
    @InjectRepository(Divida)
    private readonly dividaRepository: Repository<Divida>,
  ) {}

  async criar(userId: string, createDividaDto: CreateDividaDto): Promise<Divida> {
    const valorPago = createDividaDto.valorPago || 0;
    let status = createDividaDto.status || StatusDivida.PENDENTE;

    if (valorPago >= createDividaDto.valorTotal) {
      status = StatusDivida.QUITADA;
    } else if (valorPago > 0) {
      status = StatusDivida.PARCIAL;
    }

    const novaDivida = this.dividaRepository.create({
      ...createDividaDto,
      userId,
      valorPago,
      status,
      dataVencimento: createDividaDto.dataVencimento
        ? new Date(createDividaDto.dataVencimento)
        : undefined,
    });
    return this.dividaRepository.save(novaDivida);
  }

  async listarPorUsuario(userId: string): Promise<Divida[]> {
    return this.dividaRepository.find({
      where: { userId },
      order: { criadoEm: 'DESC' },
    });
  }

  async buscarPorId(userId: string, id: string): Promise<Divida> {
    const divida = await this.dividaRepository.findOne({
      where: { id, userId },
    });
    if (!divida) {
      throw new NotFoundException('Dívida não encontrada');
    }
    return divida;
  }

  async atualizar(userId: string, id: string, updateDividaDto: UpdateDividaDto): Promise<Divida> {
    const divida = await this.buscarPorId(userId, id);
    if (updateDividaDto.credor) divida.credor = updateDividaDto.credor;
    if (updateDividaDto.valorTotal !== undefined) divida.valorTotal = updateDividaDto.valorTotal;
    if (updateDividaDto.valorPago !== undefined) divida.valorPago = updateDividaDto.valorPago;
    if (updateDividaDto.dataVencimento) divida.dataVencimento = new Date(updateDividaDto.dataVencimento);

    // Recalcula status automaticamente baseado no valor pago x total
    if (updateDividaDto.status) {
      divida.status = updateDividaDto.status;
    } else {
      if (divida.valorPago >= divida.valorTotal) {
        divida.status = StatusDivida.QUITADA;
      } else if (divida.valorPago > 0) {
        divida.status = StatusDivida.PARCIAL;
      } else {
        divida.status = StatusDivida.PENDENTE;
      }
    }

    return this.dividaRepository.save(divida);
  }

  async remover(userId: string, id: string): Promise<void> {
    const divida = await this.buscarPorId(userId, id);
    await this.dividaRepository.remove(divida);
  }
}
