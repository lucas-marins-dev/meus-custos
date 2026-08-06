export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  criadoEm?: string;
}

export interface Renda {
  id: string;
  descricao: string;
  valor: number;
  dataRecebimento: string;
  categoria: string;
  userId: string;
}

export type TipoDespesa = 'OCASIONAL' | 'MENSAL';

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  local: string;
  categoria: string;
  tipo: TipoDespesa;
  paga: boolean;
  userId: string;
}

export type StatusDivida = 'PENDENTE' | 'PARCIAL' | 'QUITADA';

export interface Divida {
  id: string;
  credor: string;
  valorTotal: number;
  valorPago: number;
  dataVencimento?: string;
  status: StatusDivida;
  userId: string;
}

export interface DashboardMetricas {
  saldoAtual: number;
  saldoPrevistoFimMes: number;
  maiorGasto: {
    descricao: string;
    valor: number;
    local: string;
    dataVencimento: string;
  } | null;
  localMaisGastos: {
    local: string;
    totalGasto: number;
  } | null;
  gastosPorCategoria: Array<{ categoria: string; total: number }>;
  evolucaoDiaria: Array<{ data: string; receita: number; despesa: number }>;
  totalDividasPendentes: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  conteudo: string;
  criadoEm: string;
}
