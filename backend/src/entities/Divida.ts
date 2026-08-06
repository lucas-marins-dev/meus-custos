import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum StatusDivida {
  PENDENTE = 'PENDENTE',
  PARCIAL = 'PARCIAL',
  QUITADA = 'QUITADA',
}

@Entity('dividas')
export class Divida {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  credor: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorPago: number;

  @Column({ type: 'date', nullable: true })
  dataVencimento: Date;

  @Column({
    type: 'enum',
    enum: StatusDivida,
    default: StatusDivida.PENDENTE,
  })
  status: StatusDivida;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.dividas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  criadoEm: Date;
}
