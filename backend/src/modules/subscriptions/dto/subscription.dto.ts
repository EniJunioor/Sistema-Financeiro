import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubscriptionFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Nome da assinatura' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Valor da assinatura' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Moeda (padrão: BRL)' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ enum: SubscriptionFrequency, description: 'Frequência de pagamento' })
  @IsEnum(SubscriptionFrequency)
  frequency: SubscriptionFrequency;

  @ApiProperty({ description: 'Data do próximo pagamento' })
  @IsDateString()
  nextPaymentDate: string;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de término' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'ID da conta' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Logo ou ícone' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais (JSON)' })
  @IsString()
  @IsOptional()
  metadata?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Nome da assinatura' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Valor da assinatura' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ enum: SubscriptionFrequency, description: 'Frequência de pagamento' })
  @IsEnum(SubscriptionFrequency)
  @IsOptional()
  frequency?: SubscriptionFrequency;

  @ApiPropertyOptional({ description: 'Data do próximo pagamento' })
  @IsDateString()
  @IsOptional()
  nextPaymentDate?: string;

  @ApiPropertyOptional({ description: 'Data de término' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Status ativo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'ID da conta' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Logo ou ícone' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class SubscriptionFiltersDto {
  @ApiPropertyOptional({ description: 'Filtrar por status ativo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar por categoria' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por conta' })
  @IsString()
  @IsOptional()
  accountId?: string;
}
