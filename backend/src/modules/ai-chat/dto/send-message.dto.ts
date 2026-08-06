import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'A mensagem não pode estar vazia' })
  @MaxLength(1000, { message: 'A mensagem deve ter no máximo 1000 caracteres' })
  mensagem: string;
}
