import { ApiProperty } from '@nestjs/swagger';

export class TrendDataPointDto {
  @ApiProperty({ description: 'Date for this data point' })
  date: Date;

  @ApiProperty({ description: 'Income amount for this period' })
  income: number;

  @ApiProperty({ description: 'Expense amount for this period' })
  expenses: number;

  @ApiProperty({ description: 'Net amount (income - expenses)' })
  net: number;

  @ApiProperty({ description: 'Running balance' })
  balance: number;

  @ApiProperty({ description: 'Transaction count for this period' })
  transactionCount: number;
}

export class TrendProjectionDto {
  @ApiProperty({ description: 'Projected date' })
  date: Date;

  @ApiProperty({ description: 'Projected income' })
  projectedIncome: number;

  @ApiProperty({ description: 'Projected expenses' })
  projectedExpenses: number;

  @ApiProperty({ description: 'Projected net amount' })
  projectedNet: number;

  @ApiProperty({ description: 'Confidence level (0-1)' })
  confidence: number;
}

export class TrendAnalysisDto {
  @ApiProperty({
    description: 'Historical trend data points',
    type: [TrendDataPointDto],
  })
  historicalData: TrendDataPointDto[];

  @ApiProperty({
    description: 'Future projections based on trends',
    type: [TrendProjectionDto],
  })
  projections: TrendProjectionDto[];

  @ApiProperty({ description: 'Income trend direction (positive/negative/stable)' })
  incomeTrend: 'positive' | 'negative' | 'stable';

  @ApiProperty({ description: 'Expense trend direction (positive/negative/stable)' })
  expenseTrend: 'positive' | 'negative' | 'stable';

  @ApiProperty({ description: 'Monthly income growth rate (percentage)' })
  incomeGrowthRate: number;

  @ApiProperty({ description: 'Monthly expense growth rate (percentage)' })
  expenseGrowthRate: number;

  @ApiProperty({ description: 'Seasonal patterns detected' })
  seasonalPatterns: {
    month: number;
    averageIncome: number;
    averageExpenses: number;
    pattern: string;
  }[];

  @ApiProperty({ description: 'Analysis period start' })
  periodStart: Date;

  @ApiProperty({ description: 'Analysis period end' })
  periodEnd: Date;
}