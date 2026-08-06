import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { StatusDivida } from 'src/entities/Divida';

export class UpdateDividaDto {
  @IsOptional()
  @IsString()
  credor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  valorTotal?: number;

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
