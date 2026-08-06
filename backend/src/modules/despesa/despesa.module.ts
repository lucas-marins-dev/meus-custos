import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Despesa } from 'src/entities/Despesa';
import { DespesaService } from './despesa.service';
import { DespesaController } from './despesa.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Despesa]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345',
      }),
    }),
  ],
  controllers: [DespesaController],
  providers: [DespesaService],
  exports: [DespesaService],
})
export class DespesaModule {}
