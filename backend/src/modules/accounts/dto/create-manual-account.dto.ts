import { IsString, IsEnum, IsOptional, MinLength, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ManualAccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
}

export class CreateManualAccountDto {
  @ApiProperty({ description: 'Nome da conta', example: 'Conta Corrente' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    enum: ManualAccountType,
    description: 'Tipo da conta',
    example: ManualAccountType.CHECKING,
  })
  @IsEnum(ManualAccountType)
  type: ManualAccountType;

  @ApiPropertyOptional({
    description: 'Saldo inicial',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value ?? 0))
  @Min(0)
  balance?: number = 0;

  @ApiPropertyOptional({
    description: 'Moeda',
    example: 'BRL',
    default: 'BRL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string = 'BRL';
}
