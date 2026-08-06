import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('mensagem')
  async enviarMensagem(
    @CurrentUser('sub') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiChatService.enviarMensagem(userId, dto.mensagem);
  }

  @Get('historico')
  async listarHistorico(@CurrentUser('sub') userId: string) {
    return this.aiChatService.listarHistorico(userId);
  }

  @Delete('historico')
  async limparHistorico(@CurrentUser('sub') userId: string) {
    await this.aiChatService.limparHistorico(userId);
    return { message: 'Histórico de chat limpo com sucesso' };
  }
}
