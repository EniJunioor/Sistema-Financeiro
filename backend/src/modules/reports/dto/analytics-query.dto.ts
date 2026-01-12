import { IsOptional, IsDateString, IsEnum, IsArray, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PeriodPreset {
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  LAST_YEAR = '1y',
  CURRENT_MONTH = 'current_month',
  CURRENT_YEAR = 'current_year',
  CUSTOM = 'custom',
}

export enum GroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CATEGORY = 'category',
  ACCOUNT = 'account',
}

export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Period preset for quick date ranges',
    enum: PeriodPreset,
    required: false,
  })
  @IsOptional()
  @IsEnum(PeriodPreset)
  period?: PeriodPreset;

  @ApiProperty({
    description: 'Start date for custom period (ISO string)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for custom period (ISO string)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Group results by time period or dimension',
    enum: GroupBy,
    required: false,
  })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy;

  @ApiProperty({
    description: 'Filter by specific account IDs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  accountIds?: string[];

  @ApiProperty({
    description: 'Filter by specific category IDs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  categoryIds?: string[];

  @ApiProperty({
    description: 'Filter by transaction types',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  transactionTypes?: string[];
}