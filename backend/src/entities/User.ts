import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Renda } from './Renda';
import { Despesa } from './Despesa';
import { Divida } from './Divida';
import { ChatMessage } from './ChatMessage';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  senhaHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @OneToMany(() => Renda, (renda) => renda.user)
  rendas: Renda[];

  @OneToMany(() => Despesa, (despesa) => despesa.user)
  despesas: Despesa[];

  @OneToMany(() => Divida, (divida) => divida.user)
  dividas: Divida[];

  @OneToMany(() => ChatMessage, (msg) => msg.user)
  chatMessages: ChatMessage[];
}
