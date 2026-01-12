import { ApiProperty } from '@nestjs/swagger';

export class CategoryBreakdownDto {
  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiProperty({ description: 'Total amount for this category' })
  amount: number;

  @ApiProperty({ description: 'Percentage of total' })
  percentage: number;

  @ApiProperty({ description: 'Transaction count' })
  transactionCount: number;

  @ApiProperty({ description: 'Category color for charts' })
  color?: string;
}

export class AccountSummaryDto {
  @ApiProperty({ description: 'Account ID' })
  accountId: string;

  @ApiProperty({ description: 'Account name' })
  accountName: string;

  @ApiProperty({ description: 'Account type' })
  accountType: string;

  @ApiProperty({ description: 'Current balance' })
  balance: number;

  @ApiProperty({ description: 'Total income in period' })
  totalIncome: number;

  @ApiProperty({ description: 'Total expenses in period' })
  totalExpenses: number;

  @ApiProperty({ description: 'Net change in period' })
  netChange: number;
}

export class FinancialSummaryDto {
  @ApiProperty({ description: 'Total income for the period' })
  totalIncome: number;

  @ApiProperty({ description: 'Total expenses for the period' })
  totalExpenses: number;

  @ApiProperty({ description: 'Net income (income - expenses)' })
  netIncome: number;

  @ApiProperty({ description: 'Current total balance across all accounts' })
  totalBalance: number;

  @ApiProperty({ description: 'Total number of transactions' })
  transactionCount: number;

  @ApiProperty({ description: 'Average transaction amount' })
  averageTransactionAmount: number;

  @ApiProperty({ description: 'Largest expense in period' })
  largestExpense: number;

  @ApiProperty({ description: 'Largest income in period' })
  largestIncome: number;

  @ApiProperty({
    description: 'Breakdown by category',
    type: [CategoryBreakdownDto],
  })
  categoryBreakdown: CategoryBreakdownDto[];

  @ApiProperty({
    description: 'Summary by account',
    type: [AccountSummaryDto],
  })
  accountSummary: AccountSummaryDto[];

  @ApiProperty({ description: 'Period start date' })
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: Date;
}