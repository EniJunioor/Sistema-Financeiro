import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GoalType } from './create-goal.dto';

export class GoalFiltersDto {
  @ApiProperty({ enum: GoalType, required: false, description: 'Filtrar por tipo de meta' })
  @IsOptional()
  @IsEnum(GoalType)
  type?: GoalType;

  @ApiProperty({ required: false, description: 'Filtrar por status ativo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Filtrar por categoria' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false, description: 'Buscar por nome ou descrição' })
  @IsOptional()
  @IsString()
  search?: string;
}