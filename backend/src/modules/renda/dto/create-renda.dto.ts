import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRendaDto {
  @IsString()
  @IsNotEmpty({ message: 'A descrição da receita é obrigatória' })
  descricao: string;

  @IsNumber({}, { message: 'O valor deve ser um número válido' })
  @Min(0.01, { message: 'O valor da receita deve ser maior que zero' })
  valor: number;

  @IsDateString({}, { message: 'Data de recebimento deve ser uma data válida YYYY-MM-DD' })
  @IsNotEmpty({ message: 'A data de recebimento é obrigatória' })
  dataRecebimento: string;

  @IsOptional()
  @IsString()
  categoria?: string;
}
