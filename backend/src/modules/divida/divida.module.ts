import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Divida } from 'src/entities/Divida';
import { DividaService } from './divida.service';
import { DividaController } from './divida.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Divida]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345',
      }),
    }),
  ],
  controllers: [DividaController],
  providers: [DividaService],
  exports: [DividaService],
})
export class DividaModule {}
