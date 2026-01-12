import { ApiProperty } from '@nestjs/swagger';

export class PeriodComparisonItemDto {
  @ApiProperty({ description: 'Current period value' })
  current: number;

  @ApiProperty({ description: 'Previous period value' })
  previous: number;

  @ApiProperty({ description: 'Absolute change' })
  change: number;

  @ApiProperty({ description: 'Percentage change' })
  changePercentage: number;

  @ApiProperty({ description: 'Trend direction' })
  trend: 'up' | 'down' | 'stable';
}

export class CategoryComparisonDto {
  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiProperty({ description: 'Comparison data' })
  comparison: PeriodComparisonItemDto;
}

export class PeriodComparisonDto {
  @ApiProperty({ description: 'Current period start date' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current period end date' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Previous period start date' })
  previousPeriodStart: Date;

  @ApiProperty({ description: 'Previous period end date' })
  previousPeriodEnd: Date;

  @ApiProperty({ description: 'Income comparison' })
  income: PeriodComparisonItemDto;

  @ApiProperty({ description: 'Expenses comparison' })
  expenses: PeriodComparisonItemDto;

  @ApiProperty({ description: 'Net income comparison' })
  netIncome: PeriodComparisonItemDto;

  @ApiProperty({ description: 'Transaction count comparison' })
  transactionCount: PeriodComparisonItemDto;

  @ApiProperty({ description: 'Average transaction amount comparison' })
  averageTransactionAmount: PeriodComparisonItemDto;

  @ApiProperty({
    description: 'Category-wise comparison',
    type: [CategoryComparisonDto],
  })
  categoryComparison: CategoryComparisonDto[];

  @ApiProperty({ description: 'Overall financial health score (0-100)' })
  healthScore: number;

  @ApiProperty({ description: 'Key insights and recommendations' })
  insights: string[];
}