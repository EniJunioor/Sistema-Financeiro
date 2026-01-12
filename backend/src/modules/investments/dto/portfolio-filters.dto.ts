import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { InvestmentType } from './create-investment.dto';

export class PortfolioFiltersDto {
  @ApiProperty({ enum: InvestmentType, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(InvestmentType, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  types?: InvestmentType[];

  @ApiProperty({ description: 'Filter by broker', required: false })
  @IsOptional()
  @IsString()
  broker?: string;

  @ApiProperty({ description: 'Filter by sector', required: false })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ description: 'Filter by currency', required: false })
  @IsOptional()
  @IsString()
  currency?: string;
}