import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRendaDto {
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  valor?: number;

  @IsOptional()
  @IsDateString()
  dataRecebimento?: string;

  @IsOptional()
  @IsString()
  categoria?: string;
}
