import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  AnalyticsQueryDto,
  PeriodPreset,
  GroupBy,
  FinancialSummaryDto,
  CategoryBreakdownDto,
  AccountSummaryDto,
} from '../dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getFinancialSummary(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<FinancialSummaryDto> {
    const cacheKey = `financial-summary:${userId}:${JSON.stringify(query)}`;
    
    // Try to get from cache first
    const cached = await this.cacheManager.get<FinancialSummaryDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const { startDate, endDate } = this.resolveDateRange(query);
    
    // Build where clause for transactions
    const whereClause = this.buildWhereClause(userId, query, startDate, endDate);

    // Get all transactions for the period
    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        account: true,
      },
    });

    // Calculate basic metrics
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    // Get current account balances
    const accounts = await this.prisma.account.findMany({
      where: {
        userId,
        isActive: true,
        ...(query.accountIds && { id: { in: query.accountIds } }),
      },
    });

    const totalBalance = accounts.reduce(
      (sum, account) => sum + Number(account.balance),
      0,
    );

    // Calculate category breakdown
    const categoryBreakdown = await this.calculateCategoryBreakdown(
      expenseTransactions,
      totalExpenses,
    );

    // Calculate account summary
    const accountSummary = await this.calculateAccountSummary(
      accounts,
      transactions,
    );

    const summary: FinancialSummaryDto = {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      totalBalance,
      transactionCount: transactions.length,
      averageTransactionAmount: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length 
        : 0,
      largestExpense: expenseTransactions.length > 0 
        ? Math.max(...expenseTransactions.map(t => Number(t.amount))) 
        : 0,
      largestIncome: incomeTransactions.length > 0 
        ? Math.max(...incomeTransactions.map(t => Number(t.amount))) 
        : 0,
      categoryBreakdown,
      accountSummary,
      periodStart: startDate,
      periodEnd: endDate,
    };

    // Cache the result for 5 minutes
    await this.cacheManager.set(cacheKey, summary, 300);

    return summary;
  }

  async getTransactionsByPeriod(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<any[]> {
    const cacheKey = `transactions-by-period:${userId}:${JSON.stringify(query)}`;
    
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { startDate, endDate } = this.resolveDateRange(query);
    const groupBy = query.groupBy || GroupBy.DAY;

    // Build aggregation query based on groupBy
    const dateFormat = this.getDateFormat(groupBy);
    
    const result = await this.prisma.$queryRaw`
      SELECT 
        strftime(${dateFormat}, date) as period,
        type,
        SUM(CAST(amount as REAL)) as total_amount,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE userId = ${userId}
        AND date >= ${startDate.toISOString()}
        AND date <= ${endDate.toISOString()}
        ${query.accountIds ? `AND accountId IN (${query.accountIds.map(id => `'${id}'`).join(',')})` : ''}
        ${query.categoryIds ? `AND categoryId IN (${query.categoryIds.map(id => `'${id}'`).join(',')})` : ''}
        ${query.transactionTypes ? `AND type IN (${query.transactionTypes.map(type => `'${type}'`).join(',')})` : ''}
      GROUP BY period, type
      ORDER BY period ASC
    `;

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result as any[];
  }

  private async calculateCategoryBreakdown(
    expenseTransactions: any[],
    totalExpenses: number,
  ): Promise<CategoryBreakdownDto[]> {
    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      amount: number;
      transactionCount: number;
      color?: string;
    }>();

    expenseTransactions.forEach(transaction => {
      const categoryId = transaction.categoryId || 'uncategorized';
      const categoryName = transaction.category?.name || 'Uncategorized';
      const amount = Number(transaction.amount);

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!;
        existing.amount += amount;
        existing.transactionCount += 1;
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          amount,
          transactionCount: 1,
          color: transaction.category?.color,
        });
      }
    });

    return Array.from(categoryMap.values())
      .map(category => ({
        ...category,
        percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private async calculateAccountSummary(
    accounts: any[],
    transactions: any[],
  ): Promise<AccountSummaryDto[]> {
    return accounts.map(account => {
      const accountTransactions = transactions.filter(
        t => t.accountId === account.id,
      );

      const totalIncome = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        balance: Number(account.balance),
        totalIncome,
        totalExpenses,
        netChange: totalIncome - totalExpenses,
      };
    });
  }

  private resolveDateRange(query: AnalyticsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (query.period && query.period !== PeriodPreset.CUSTOM) {
      switch (query.period) {
        case PeriodPreset.LAST_7_DAYS:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case PeriodPreset.LAST_30_DAYS:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case PeriodPreset.LAST_90_DAYS:
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case PeriodPreset.LAST_YEAR:
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case PeriodPreset.CURRENT_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case PeriodPreset.CURRENT_YEAR:
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      startDate = query.startDate ? new Date(query.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = query.endDate ? new Date(query.endDate) : new Date(now);
    }

    return { startDate, endDate };
  }

  private buildWhereClause(
    userId: string,
    query: AnalyticsQueryDto,
    startDate: Date,
    endDate: Date,
  ): any {
    const where: any = {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (query.accountIds?.length) {
      where.accountId = { in: query.accountIds };
    }

    if (query.categoryIds?.length) {
      where.categoryId = { in: query.categoryIds };
    }

    if (query.transactionTypes?.length) {
      where.type = { in: query.transactionTypes };
    }

    return where;
  }

  private getDateFormat(groupBy: GroupBy): string {
    switch (groupBy) {
      case GroupBy.DAY:
        return '%Y-%m-%d';
      case GroupBy.WEEK:
        return '%Y-W%W';
      case GroupBy.MONTH:
        return '%Y-%m';
      case GroupBy.QUARTER:
        return '%Y-Q' + Math.ceil((new Date().getMonth() + 1) / 3);
      case GroupBy.YEAR:
        return '%Y';
      default:
        return '%Y-%m-%d';
    }
  }
}