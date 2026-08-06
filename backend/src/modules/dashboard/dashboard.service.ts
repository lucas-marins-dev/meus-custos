import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Renda } from 'src/entities/Renda';
import { Despesa } from 'src/entities/Despesa';
import { Divida } from 'src/entities/Divida';

export interface DashboardMetricas {
  saldoAtual: number;
  saldoPrevistoFimMes: number;
  maiorGasto: {
    descricao: string;
    valor: number;
    local: string;
    dataVencimento: Date;
  } | null;
  localMaisGastos: {
    local: string;
    totalGasto: number;
  } | null;
  gastosPorCategoria: Array<{ categoria: string; total: number }>;
  evolucaoDiaria: Array<{ data: string; receita: number; despesa: number }>;
  totalDividasPendentes: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Renda)
    private readonly rendaRepo: Repository<Renda>,
    @InjectRepository(Despesa)
    private readonly despesaRepo: Repository<Despesa>,
    @InjectRepository(Divida)
    private readonly dividaRepo: Repository<Divida>,
  ) {}

  async obterMetricas(userId: string): Promise<DashboardMetricas> {
    const rendas = await this.rendaRepo.find({ where: { userId } });
    const despesas = await this.despesaRepo.find({ where: { userId } });
    const dividas = await this.dividaRepo.find({ where: { userId } });

    // 1. Saldo Atual = Soma de todas as receitas até hoje - Despesas Pagas
    const hoje = new Date();
    const totalReceitasAteHoje = rendas
      .filter((r) => new Date(r.dataRecebimento) <= hoje)
      .reduce((acc, curr) => acc + Number(curr.valor), 0);

    const totalDespesasPagas = despesas
      .filter((d) => d.paga)
      .reduce((acc, curr) => acc + Number(curr.valor), 0);

    const saldoAtual = Number((totalReceitasAteHoje - totalDespesasPagas).toFixed(2));

    // 2. Saldo Previsto no Fim do Mês Corrente
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const rendasMes = rendas.filter((r) => {
      const dt = new Date(r.dataRecebimento);
      return dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual;
    });

    const despesasMes = despesas.filter((d) => {
      const dt = new Date(d.dataVencimento);
      return dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual;
    });

    const totalRendasMes = rendasMes.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const totalDespesasMes = despesasMes.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const saldoPrevistoFimMes = Number((totalRendasMes - totalDespesasMes).toFixed(2));

    // 3. Maior Gasto (Despesa de maior valor)
    let maiorGasto: DashboardMetricas['maiorGasto'] = null;
    if (despesas.length > 0) {
      const ordenada = [...despesas].sort((a, b) => Number(b.valor) - Number(a.valor));
      const top = ordenada[0];
      maiorGasto = {
        descricao: top.descricao,
        valor: Number(top.valor),
        local: top.local,
        dataVencimento: top.dataVencimento,
      };
    }

    // 4. Local com Mais Gastos
    const mapaLocais = new Map<string, number>();
    despesas.forEach((d) => {
      const localNorm = (d.local || 'Outros').trim();
      const acumulado = mapaLocais.get(localNorm) || 0;
      mapaLocais.set(localNorm, acumulado + Number(d.valor));
    });

    let localMaisGastos: DashboardMetricas['localMaisGastos'] = null;
    let maiorTotalLocal = 0;
    mapaLocais.forEach((total, local) => {
      if (total > maiorTotalLocal) {
        maiorTotalLocal = total;
        localMaisGastos = { local, totalGasto: Number(total.toFixed(2)) };
      }
    });

    // 5. Gastos por Categoria (Gráfico de Rosca)
    const mapaCategorias = new Map<string, number>();
    despesas.forEach((d) => {
      const cat = (d.categoria || 'Outros').trim();
      const acumulado = mapaCategorias.get(cat) || 0;
      mapaCategorias.set(cat, acumulado + Number(d.valor));
    });

    const gastosPorCategoria: DashboardMetricas['gastosPorCategoria'] = [];
    mapaCategorias.forEach((total, categoria) => {
      gastosPorCategoria.push({ categoria, total: Number(total.toFixed(2)) });
    });

    // 6. Evolução Diária do Mês (Gráfico de Linha)
    const mapaDias = new Map<string, { receita: number; despesa: number }>();
    
    rendasMes.forEach((r) => {
      const diaStr = new Date(r.dataRecebimento).toISOString().split('T')[0];
      const entry = mapaDias.get(diaStr) || { receita: 0, despesa: 0 };
      entry.receita += Number(r.valor);
      mapaDias.set(diaStr, entry);
    });

    despesasMes.forEach((d) => {
      const diaStr = new Date(d.dataVencimento).toISOString().split('T')[0];
      const entry = mapaDias.get(diaStr) || { receita: 0, despesa: 0 };
      entry.despesa += Number(d.valor);
      mapaDias.set(diaStr, entry);
    });

    const evolucaoDiaria: DashboardMetricas['evolucaoDiaria'] = Array.from(mapaDias.entries())
      .map(([data, valores]) => ({
        data,
        receita: Number(valores.receita.toFixed(2)),
        despesa: Number(valores.despesa.toFixed(2)),
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    // 7. Total Dívidas Pendentes
    const totalDividasPendentes = dividas
      .filter((div) => div.status !== 'QUITADA')
      .reduce((acc, curr) => acc + (Number(curr.valorTotal) - Number(curr.valorPago)), 0);

    return {
      saldoAtual,
      saldoPrevistoFimMes,
      maiorGasto,
      localMaisGastos,
      gastosPorCategoria,
      evolucaoDiaria,
      totalDividasPendentes: Number(totalDividasPendentes.toFixed(2)),
    };
  }
}
