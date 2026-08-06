import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from 'src/entities/ChatMessage';
import { User } from 'src/entities/User';
import { Renda } from 'src/entities/Renda';
import { Despesa } from 'src/entities/Despesa';
import { Divida } from 'src/entities/Divida';
import { AiChatService } from './ai-chat.service';
import { AiChatController } from './ai-chat.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, User, Renda, Despesa, Divida]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345',
      }),
    }),
  ],
  controllers: [AiChatController],
  providers: [AiChatService],
  exports: [AiChatService],
})
export class AiChatModule {}
