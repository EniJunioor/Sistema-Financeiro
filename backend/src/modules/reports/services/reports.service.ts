import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import { TrendsService } from './trends.service';
import {
  AnalyticsQueryDto,
  FinancialSummaryDto,
  TrendAnalysisDto,
  PeriodComparisonDto,
} from '../dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly trendsService: TrendsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getDashboardData(
    userId: string,
    query: AnalyticsQueryDto = {},
  ): Promise<{
    summary: FinancialSummaryDto;
    trends: TrendAnalysisDto;
    comparison: PeriodComparisonDto;
  }> {
    const cacheKey = `dashboard-data:${userId}:${JSON.stringify(query)}`;
    
    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    // Get all dashboard data in parallel for better performance
    const [summary, trends, comparison] = await Promise.all([
      this.analyticsService.getFinancialSummary(userId, query),
      this.trendsService.getTrendAnalysis(userId, query),
      this.trendsService.getPeriodComparison(userId, query),
    ]);

    const dashboardData = {
      summary,
      trends,
      comparison,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, dashboardData, 300);

    return dashboardData;
  }

  async getFinancialOverview(userId: string): Promise<{
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRate: number;
    topCategories: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
    recentTransactions: Array<{
      id: string;
      description: string;
      amount: number;
      type: string;
      date: Date;
      categoryName?: string;
    }>;
  }> {
    const cacheKey = `financial-overview:${userId}`;
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    // Get current month data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get total balance across all accounts
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
    });
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);

    // Get current month transactions
    const monthlyTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        category: true,
      },
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    // Get top spending categories for current month
    const categoryTotals = new Map<string, { name: string; amount: number }>();
    
    monthlyTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const categoryName = transaction.category?.name || 'Uncategorized';
        const amount = Number(transaction.amount);
        
        if (categoryTotals.has(categoryName)) {
          categoryTotals.get(categoryName)!.amount += amount;
        } else {
          categoryTotals.set(categoryName, { name: categoryName, amount });
        }
      });

    const topCategories = Array.from(categoryTotals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(cat => ({
        name: cat.name,
        amount: cat.amount,
        percentage: monthlyExpenses > 0 ? (cat.amount / monthlyExpenses) * 100 : 0,
      }));

    // Get recent transactions (last 10)
    const recentTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 10,
    });

    const overview = {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      topCategories,
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        date: t.date,
        categoryName: t.category?.name,
      })),
    };

    // Cache for 2 minutes (shorter cache for overview data)
    await this.cacheManager.set(cacheKey, overview, 120);

    return overview;
  }

  async getCashFlowAnalysis(
    userId: string,
    months: number = 12,
  ): Promise<{
    cashFlowData: Array<{
      month: string;
      income: number;
      expenses: number;
      netFlow: number;
      cumulativeFlow: number;
    }>;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    volatilityScore: number;
    projectedBalance: number;
  }> {
    const cacheKey = `cash-flow-analysis:${userId}:${months}`;
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get monthly cash flow data
    const result = await this.prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN CAST(amount as REAL) ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN CAST(amount as REAL) ELSE 0 END) as expenses
      FROM transactions 
      WHERE userId = ${userId}
        AND date >= ${startDate.toISOString()}
        AND date <= ${endDate.toISOString()}
      GROUP BY month
      ORDER BY month ASC
    ` as any[];

    let cumulativeFlow = 0;
    const cashFlowData = result.map((row: any) => {
      const income = Number(row.income) || 0;
      const expenses = Number(row.expenses) || 0;
      const netFlow = income - expenses;
      cumulativeFlow += netFlow;

      return {
        month: row.month,
        income,
        expenses,
        netFlow,
        cumulativeFlow,
      };
    });

    // Calculate averages
    const totalIncome = cashFlowData.reduce((sum, data) => sum + data.income, 0);
    const totalExpenses = cashFlowData.reduce((sum, data) => sum + data.expenses, 0);
    const averageMonthlyIncome = cashFlowData.length > 0 ? totalIncome / cashFlowData.length : 0;
    const averageMonthlyExpenses = cashFlowData.length > 0 ? totalExpenses / cashFlowData.length : 0;

    // Calculate volatility (standard deviation of net flow)
    const netFlows = cashFlowData.map(data => data.netFlow);
    const avgNetFlow = netFlows.reduce((sum, flow) => sum + flow, 0) / netFlows.length;
    const variance = netFlows.reduce((sum, flow) => sum + Math.pow(flow - avgNetFlow, 2), 0) / netFlows.length;
    const volatilityScore = Math.sqrt(variance);

    // Project balance for next 3 months based on average net flow
    const currentBalance = await this.getCurrentBalance(userId);
    const projectedBalance = currentBalance + (avgNetFlow * 3);

    const analysis = {
      cashFlowData,
      averageMonthlyIncome,
      averageMonthlyExpenses,
      volatilityScore,
      projectedBalance,
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, analysis, 600);

    return analysis;
  }

  async getSpendingPatterns(
    userId: string,
  ): Promise<{
    dailyAverages: Array<{ dayOfWeek: number; dayName: string; averageAmount: number }>;
    monthlyPatterns: Array<{ month: number; monthName: string; averageAmount: number }>;
    categoryTrends: Array<{
      categoryName: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      changePercentage: number;
      monthlyData: Array<{ month: string; amount: number }>;
    }>;
  }> {
    const cacheKey = `spending-patterns:${userId}`;
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    // Get data for the last 12 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    // Daily patterns (day of week)
    const dailyResult = await this.prisma.$queryRaw`
      SELECT 
        CAST(strftime('%w', date) as INTEGER) as day_of_week,
        AVG(CAST(amount as REAL)) as avg_amount
      FROM transactions 
      WHERE userId = ${userId}
        AND type = 'expense'
        AND date >= ${startDate.toISOString()}
        AND date <= ${endDate.toISOString()}
      GROUP BY day_of_week
      ORDER BY day_of_week ASC
    ` as any[];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyAverages = dailyResult.map((row: any) => ({
      dayOfWeek: Number(row.day_of_week),
      dayName: dayNames[Number(row.day_of_week)],
      averageAmount: Number(row.avg_amount) || 0,
    }));

    // Monthly patterns
    const monthlyResult = await this.prisma.$queryRaw`
      SELECT 
        CAST(strftime('%m', date) as INTEGER) as month,
        AVG(CAST(amount as REAL)) as avg_amount
      FROM transactions 
      WHERE userId = ${userId}
        AND type = 'expense'
        AND date >= ${startDate.toISOString()}
        AND date <= ${endDate.toISOString()}
      GROUP BY month
      ORDER BY month ASC
    ` as any[];

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthlyPatterns = monthlyResult.map((row: any) => ({
      month: Number(row.month),
      monthName: monthNames[Number(row.month) - 1],
      averageAmount: Number(row.avg_amount) || 0,
    }));

    // Category trends over time
    const categoryTrends = await this.getCategoryTrends(userId, startDate, endDate);

    const patterns = {
      dailyAverages,
      monthlyPatterns,
      categoryTrends,
    };

    // Cache for 30 minutes
    await this.cacheManager.set(cacheKey, patterns, 1800);

    return patterns;
  }

  private async getCurrentBalance(userId: string): Promise<number> {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
    });
    
    return accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  }

  private async getCategoryTrends(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    // Get monthly spending by category
    const result = await this.prisma.$queryRaw`
      SELECT 
        c.name as category_name,
        strftime('%Y-%m', t.date) as month,
        SUM(CAST(t.amount as REAL)) as amount
      FROM transactions t
      LEFT JOIN categories c ON t.categoryId = c.id
      WHERE t.userId = ${userId}
        AND t.type = 'expense'
        AND t.date >= ${startDate.toISOString()}
        AND t.date <= ${endDate.toISOString()}
      GROUP BY c.name, month
      ORDER BY c.name, month ASC
    ` as any[];

    // Group by category and calculate trends
    const categoryMap = new Map<string, Array<{ month: string; amount: number }>>();
    
    result.forEach((row: any) => {
      const categoryName = row.category_name || 'Uncategorized';
      const monthData = { month: row.month, amount: Number(row.amount) || 0 };
      
      if (categoryMap.has(categoryName)) {
        categoryMap.get(categoryName)!.push(monthData);
      } else {
        categoryMap.set(categoryName, [monthData]);
      }
    });

    return Array.from(categoryMap.entries())
      .map(([categoryName, monthlyData]) => {
        // Calculate trend
        const amounts = monthlyData.map(d => d.amount);
        const trend = this.calculateTrend(amounts);
        const changePercentage = this.calculateChangePercentage(amounts);

        return {
          categoryName,
          trend,
          changePercentage,
          monthlyData,
        };
      })
      .filter(category => category.monthlyData.length >= 3) // Only categories with at least 3 months of data
      .sort((a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage));
  }

  private calculateTrend(amounts: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (amounts.length < 2) return 'stable';

    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const changePercentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    if (changePercentage > 10) return 'increasing';
    if (changePercentage < -10) return 'decreasing';
    return 'stable';
  }

  private calculateChangePercentage(amounts: number[]): number {
    if (amounts.length < 2) return 0;

    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  }
}