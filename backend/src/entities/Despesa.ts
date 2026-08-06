import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum TipoDespesa {
  OCASIONAL = 'OCASIONAL',
  MENSAL = 'MENSAL',
}

@Entity('despesas')
export class Despesa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ type: 'date' })
  dataVencimento: Date;

  @Column({ type: 'varchar', length: 255 })
  local: string;

  @Column({ type: 'varchar', length: 100, default: 'Outros' })
  categoria: string;

  @Column({
    type: 'enum',
    enum: TipoDespesa,
    default: TipoDespesa.OCASIONAL,
  })
  tipo: TipoDespesa;

  @Column({ type: 'boolean', default: false })
  paga: boolean;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.despesas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  criadoEm: Date;
}
