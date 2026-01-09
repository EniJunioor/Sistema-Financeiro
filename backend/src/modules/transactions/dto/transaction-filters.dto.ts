import { IsOptional, IsEnum, IsDateString, IsUUID, IsString, IsArray, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionFiltersDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Transaction type filter',
    enum: ['income', 'expense', 'transfer']
  })
  @IsOptional()
  @IsEnum(['income', 'expense', 'transfer'])
  type?: 'income' | 'expense' | 'transfer';

  @ApiPropertyOptional({
    description: 'Start date for filtering',
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Minimum amount filter',
    example: 10.00
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum amount filter',
    example: 1000.00
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Category ID filter',
    example: 'clx0987654321'
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Account ID filter',
    example: 'clx1234567890'
  })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Search query for full-text search',
    example: 'grocery walmart'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Tags filter',
    example: ['food', 'essential'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['date', 'amount', 'description', 'createdAt'],
    example: 'date'
  })
  @IsOptional()
  @IsEnum(['date', 'amount', 'description', 'createdAt'])
  sortBy?: 'date' | 'amount' | 'description' | 'createdAt' = 'date';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}