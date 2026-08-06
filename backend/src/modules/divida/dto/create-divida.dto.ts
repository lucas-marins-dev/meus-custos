import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { StatusDivida } from 'src/entities/Divida';

export class CreateDividaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do credor ou instituição é obrigatório' })
  credor: string;

  @IsNumber({}, { message: 'O valor total deve ser um número' })
  @Min(0.01, { message: 'O valor total deve ser maior que zero' })
  valorTotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorPago?: number;

  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @IsOptional()
  @IsEnum(StatusDivida)
  status?: StatusDivida;
}
