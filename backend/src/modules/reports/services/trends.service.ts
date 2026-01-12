import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  AnalyticsQueryDto,
  TrendAnalysisDto,
  TrendDataPointDto,
  TrendProjectionDto,
  PeriodComparisonDto,
  PeriodComparisonItemDto,
  CategoryComparisonDto,
} from '../dto';

@Injectable()
export class TrendsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getTrendAnalysis(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<TrendAnalysisDto> {
    const cacheKey = `trend-analysis:${userId}:${JSON.stringify(query)}`;
    
    const cached = await this.cacheManager.get<TrendAnalysisDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const { startDate, endDate } = this.resolveDateRange(query);
    
    // Get historical data points
    const historicalData = await this.getHistoricalTrendData(userId, startDate, endDate, query);
    
    // Calculate trend directions and growth rates
    const { incomeTrend, expenseTrend, incomeGrowthRate, expenseGrowthRate } = 
      this.calculateTrendMetrics(historicalData);
    
    // Generate future projections
    const projections = this.generateProjections(historicalData, 6); // 6 months ahead
    
    // Detect seasonal patterns
    const seasonalPatterns = await this.detectSeasonalPatterns(userId);

    const analysis: TrendAnalysisDto = {
      historicalData,
      projections,
      incomeTrend,
      expenseTrend,
      incomeGrowthRate,
      expenseGrowthRate,
      seasonalPatterns,
      periodStart: startDate,
      periodEnd: endDate,
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, analysis, 600);

    return analysis;
  }

  async getPeriodComparison(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<PeriodComparisonDto> {
    const cacheKey = `period-comparison:${userId}:${JSON.stringify(query)}`;
    
    const cached = await this.cacheManager.get<PeriodComparisonDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const { startDate, endDate } = this.resolveDateRange(query);
    const periodLength = endDate.getTime() - startDate.getTime();
    
    // Calculate previous period dates
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - periodLength);

    // Get current period data
    const currentData = await this.getPeriodData(userId, startDate, endDate, query);
    
    // Get previous period data
    const previousData = await this.getPeriodData(userId, previousStartDate, previousEndDate, query);

    // Calculate comparisons
    const income = this.calculateComparison(currentData.totalIncome, previousData.totalIncome);
    const expenses = this.calculateComparison(currentData.totalExpenses, previousData.totalExpenses);
    const netIncome = this.calculateComparison(currentData.netIncome, previousData.netIncome);
    const transactionCount = this.calculateComparison(currentData.transactionCount, previousData.transactionCount);
    const averageTransactionAmount = this.calculateComparison(
      currentData.averageTransactionAmount, 
      previousData.averageTransactionAmount
    );

    // Category-wise comparison
    const categoryComparison = await this.getCategoryComparison(
      userId, 
      startDate, 
      endDate, 
      previousStartDate, 
      previousEndDate,
      query
    );

    // Calculate health score
    const healthScore = this.calculateHealthScore(income, expenses, netIncome);

    // Generate insights
    const insights = this.generateInsights(income, expenses, netIncome, categoryComparison);

    const comparison: PeriodComparisonDto = {
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      previousPeriodStart: previousStartDate,
      previousPeriodEnd: previousEndDate,
      income,
      expenses,
      netIncome,
      transactionCount,
      averageTransactionAmount,
      categoryComparison,
      healthScore,
      insights,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, comparison, 300);

    return comparison;
  }

  private async getHistoricalTrendData(
    userId: string,
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ): Promise<TrendDataPointDto[]> {
    // Get monthly aggregated data
    const result = await this.prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN CAST(amount as REAL) ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN CAST(amount as REAL) ELSE 0 END) as expenses,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE userId = ${userId}
        AND date >= ${startDate.toISOString()}
        AND date <= ${endDate.toISOString()}
        ${query.accountIds ? `AND accountId IN (${query.accountIds.map(id => `'${id}'`).join(',')})` : ''}
        ${query.categoryIds ? `AND categoryId IN (${query.categoryIds.map(id => `'${id}'`).join(',')})` : ''}
      GROUP BY month
      ORDER BY month ASC
    ` as any[];

    let runningBalance = 0;
    
    return result.map((row: any) => {
      const income = Number(row.income) || 0;
      const expenses = Number(row.expenses) || 0;
      const net = income - expenses;
      runningBalance += net;

      return {
        date: new Date(row.month + '-01'),
        income,
        expenses,
        net,
        balance: runningBalance,
        transactionCount: Number(row.transaction_count) || 0,
      };
    });
  }

  private calculateTrendMetrics(data: TrendDataPointDto[]): {
    incomeTrend: 'positive' | 'negative' | 'stable';
    expenseTrend: 'positive' | 'negative' | 'stable';
    incomeGrowthRate: number;
    expenseGrowthRate: number;
  } {
    if (data.length < 2) {
      return {
        incomeTrend: 'stable',
        expenseTrend: 'stable',
        incomeGrowthRate: 0,
        expenseGrowthRate: 0,
      };
    }

    // Calculate linear regression for trends
    const incomeGrowthRate = this.calculateGrowthRate(data.map(d => d.income));
    const expenseGrowthRate = this.calculateGrowthRate(data.map(d => d.expenses));

    return {
      incomeTrend: incomeGrowthRate > 0.05 ? 'positive' : incomeGrowthRate < -0.05 ? 'negative' : 'stable',
      expenseTrend: expenseGrowthRate > 0.05 ? 'positive' : expenseGrowthRate < -0.05 ? 'negative' : 'stable',
      incomeGrowthRate: incomeGrowthRate * 100, // Convert to percentage
      expenseGrowthRate: expenseGrowthRate * 100,
    };
  }

  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ..., n-1
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;

    return avgY > 0 ? slope / avgY : 0; // Normalize by average value
  }

  private generateProjections(
    historicalData: TrendDataPointDto[],
    monthsAhead: number,
  ): TrendProjectionDto[] {
    if (historicalData.length < 3) {
      return []; // Need at least 3 data points for meaningful projection
    }

    const incomeValues = historicalData.map(d => d.income);
    const expenseValues = historicalData.map(d => d.expenses);

    const incomeGrowthRate = this.calculateGrowthRate(incomeValues);
    const expenseGrowthRate = this.calculateGrowthRate(expenseValues);

    const lastDataPoint = historicalData[historicalData.length - 1];
    const projections: TrendProjectionDto[] = [];

    for (let i = 1; i <= monthsAhead; i++) {
      const projectionDate = new Date(lastDataPoint.date);
      projectionDate.setMonth(projectionDate.getMonth() + i);

      const projectedIncome = lastDataPoint.income * (1 + incomeGrowthRate) ** i;
      const projectedExpenses = lastDataPoint.expenses * (1 + expenseGrowthRate) ** i;

      // Confidence decreases with distance into the future
      const confidence = Math.max(0.3, 1 - (i * 0.1));

      projections.push({
        date: projectionDate,
        projectedIncome,
        projectedExpenses,
        projectedNet: projectedIncome - projectedExpenses,
        confidence,
      });
    }

    return projections;
  }

  private async detectSeasonalPatterns(userId: string): Promise<any[]> {
    // Get data for the last 2 years to detect seasonal patterns
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const result = await this.prisma.$queryRaw`
      SELECT 
        CAST(strftime('%m', date) as INTEGER) as month,
        AVG(CASE WHEN type = 'income' THEN CAST(amount as REAL) ELSE 0 END) as avg_income,
        AVG(CASE WHEN type = 'expense' THEN CAST(amount as REAL) ELSE 0 END) as avg_expenses,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE userId = ${userId}
        AND date >= ${twoYearsAgo.toISOString()}
      GROUP BY month
      ORDER BY month ASC
    ` as any[];

    return result.map((row: any) => ({
      month: Number(row.month),
      averageIncome: Number(row.avg_income) || 0,
      averageExpenses: Number(row.avg_expenses) || 0,
      pattern: this.identifyPattern(Number(row.avg_income), Number(row.avg_expenses)),
    }));
  }

  private identifyPattern(income: number, expenses: number): string {
    const ratio = expenses > 0 ? income / expenses : 0;
    
    if (ratio > 1.2) return 'high-savings';
    if (ratio > 0.9) return 'balanced';
    if (ratio > 0.7) return 'moderate-spending';
    return 'high-spending';
  }

  private async getPeriodData(
    userId: string,
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ): Promise<any> {
    const whereClause = this.buildWhereClause(userId, query, startDate, endDate);

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
    });

    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      averageTransactionAmount: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length 
        : 0,
    };
  }

  private calculateComparison(current: number, previous: number): PeriodComparisonItemDto {
    const change = current - previous;
    const changePercentage = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercentage) > 5) {
      trend = changePercentage > 0 ? 'up' : 'down';
    }

    return {
      current,
      previous,
      change,
      changePercentage,
      trend,
    };
  }

  private async getCategoryComparison(
    userId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
    query: AnalyticsQueryDto,
  ): Promise<CategoryComparisonDto[]> {
    // Get current period category data
    const currentCategories = await this.getCategoryTotals(userId, currentStart, currentEnd, query);
    
    // Get previous period category data
    const previousCategories = await this.getCategoryTotals(userId, previousStart, previousEnd, query);

    const categoryMap = new Map<string, CategoryComparisonDto>();

    // Process current period categories
    currentCategories.forEach(cat => {
      categoryMap.set(cat.categoryId, {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        comparison: this.calculateComparison(cat.amount, 0),
      });
    });

    // Update with previous period data
    previousCategories.forEach(cat => {
      if (categoryMap.has(cat.categoryId)) {
        const existing = categoryMap.get(cat.categoryId)!;
        existing.comparison = this.calculateComparison(existing.comparison.current, cat.amount);
      } else {
        categoryMap.set(cat.categoryId, {
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          comparison: this.calculateComparison(0, cat.amount),
        });
      }
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => Math.abs(b.comparison.change) - Math.abs(a.comparison.change));
  }

  private async getCategoryTotals(
    userId: string,
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ): Promise<any[]> {
    const whereClause = this.buildWhereClause(userId, query, startDate, endDate);

    const result = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        ...whereClause,
        type: 'expense', // Only expenses for category comparison
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get category names
    const categoryIds = result.map(r => r.categoryId).filter(Boolean) as string[];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryNameMap = new Map(categories.map(c => [c.id, c.name]));

    return result.map(r => ({
      categoryId: r.categoryId || 'uncategorized',
      categoryName: r.categoryId ? categoryNameMap.get(r.categoryId) || 'Unknown' : 'Uncategorized',
      amount: Number(r._sum.amount) || 0,
      count: r._count,
    }));
  }

  private calculateHealthScore(
    income: PeriodComparisonItemDto,
    expenses: PeriodComparisonItemDto,
    netIncome: PeriodComparisonItemDto,
  ): number {
    let score = 50; // Base score

    // Income trend (30% weight)
    if (income.trend === 'up') score += 15;
    else if (income.trend === 'down') score -= 15;

    // Expense trend (20% weight) - lower expenses are better
    if (expenses.trend === 'down') score += 10;
    else if (expenses.trend === 'up') score -= 10;

    // Net income trend (40% weight)
    if (netIncome.trend === 'up') score += 20;
    else if (netIncome.trend === 'down') score -= 20;

    // Savings rate bonus (10% weight)
    if (netIncome.current > 0 && income.current > 0) {
      const savingsRate = netIncome.current / income.current;
      if (savingsRate > 0.2) score += 5; // 20%+ savings rate
      else if (savingsRate > 0.1) score += 2; // 10%+ savings rate
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateInsights(
    income: PeriodComparisonItemDto,
    expenses: PeriodComparisonItemDto,
    netIncome: PeriodComparisonItemDto,
    categoryComparison: CategoryComparisonDto[],
  ): string[] {
    const insights: string[] = [];

    // Income insights
    if (income.trend === 'up' && income.changePercentage > 10) {
      insights.push(`Great news! Your income increased by ${income.changePercentage.toFixed(1)}% compared to the previous period.`);
    } else if (income.trend === 'down' && income.changePercentage < -10) {
      insights.push(`Your income decreased by ${Math.abs(income.changePercentage).toFixed(1)}%. Consider exploring additional income sources.`);
    }

    // Expense insights
    if (expenses.trend === 'up' && expenses.changePercentage > 15) {
      insights.push(`Your expenses increased significantly by ${expenses.changePercentage.toFixed(1)}%. Review your spending patterns.`);
    } else if (expenses.trend === 'down' && expenses.changePercentage < -10) {
      insights.push(`Excellent! You reduced your expenses by ${Math.abs(expenses.changePercentage).toFixed(1)}%.`);
    }

    // Net income insights
    if (netIncome.current > 0 && netIncome.trend === 'up') {
      insights.push(`Your savings improved by ${netIncome.changePercentage.toFixed(1)}%. Keep up the good work!`);
    } else if (netIncome.current < 0) {
      insights.push(`You spent more than you earned this period. Consider creating a budget to control expenses.`);
    }

    // Category insights
    const topIncreaseCategory = categoryComparison
      .filter(c => c.comparison.trend === 'up')
      .sort((a, b) => b.comparison.changePercentage - a.comparison.changePercentage)[0];

    if (topIncreaseCategory && topIncreaseCategory.comparison.changePercentage > 20) {
      insights.push(`Your ${topIncreaseCategory.categoryName} spending increased by ${topIncreaseCategory.comparison.changePercentage.toFixed(1)}%.`);
    }

    return insights;
  }

  private resolveDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    // Reuse the same logic from AnalyticsService
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      // Default to last 12 months for trend analysis
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
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
}