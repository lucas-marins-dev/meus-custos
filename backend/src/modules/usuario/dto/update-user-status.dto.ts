import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean({ message: 'O status ativo deve ser verdadeiro ou falso' })
  @IsNotEmpty()
  ativo: boolean;
}
