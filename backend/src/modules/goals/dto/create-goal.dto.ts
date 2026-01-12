import { IsString, IsOptional, IsEnum, IsDecimal, IsDateString, IsBoolean, MinLength, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum GoalType {
  SAVINGS = 'savings',
  SPENDING_LIMIT = 'spending_limit',
  INVESTMENT = 'investment',
  DEBT_PAYOFF = 'debt_payoff',
}

export class CreateGoalDto {
  @ApiProperty({ description: 'Nome da meta' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Descrição da meta', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: GoalType, description: 'Tipo da meta' })
  @IsEnum(GoalType)
  type: GoalType;

  @ApiProperty({ description: 'Valor alvo da meta' })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  targetAmount: number;

  @ApiProperty({ description: 'Data alvo para atingir a meta', required: false })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiProperty({ description: 'ID da categoria relacionada', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'Se a meta está ativa', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}