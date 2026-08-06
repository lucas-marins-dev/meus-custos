import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TipoDespesa } from 'src/entities/Despesa';

export class CreateDespesaDto {
  @IsString()
  @IsNotEmpty({ message: 'A descrição do gasto é obrigatória' })
  descricao: string;

  @IsNumber({}, { message: 'O valor deve ser um número válido' })
  @Min(0.01, { message: 'O valor do gasto deve ser maior que zero' })
  valor: number;

  @IsDateString({}, { message: 'Data de vencimento deve ser uma data válida YYYY-MM-DD' })
  @IsNotEmpty({ message: 'A data de vencimento é obrigatória' })
  dataVencimento: string;

  @IsString()
  @IsNotEmpty({ message: 'O local/estabelecimento do gasto é obrigatório' })
  local: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsEnum(TipoDespesa, { message: 'Tipo de despesa inválido (OCASIONAL ou MENSAL)' })
  tipo?: TipoDespesa;

  @IsOptional()
  @IsBoolean()
  paga?: boolean;
}
