import { IsEnum, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RecurringRuleDto {
  @ApiProperty({
    description: 'Frequency of recurrence',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    example: 'monthly'
  })
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @ApiProperty({
    description: 'Interval between recurrences (e.g., every 2 weeks)',
    example: 1,
    minimum: 1,
    maximum: 365
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  interval: number;

  @ApiPropertyOptional({
    description: 'End date for recurring transactions',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Next scheduled date for the recurring transaction',
    example: '2024-02-15T10:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  nextDate?: string;
}