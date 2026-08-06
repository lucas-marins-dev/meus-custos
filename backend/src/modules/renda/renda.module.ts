import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Renda } from 'src/entities/Renda';
import { RendaService } from './renda.service';
import { RendaController } from './renda.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Renda]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345',
      }),
    }),
  ],
  controllers: [RendaController],
  providers: [RendaService],
  exports: [RendaService],
})
export class RendaModule {}
