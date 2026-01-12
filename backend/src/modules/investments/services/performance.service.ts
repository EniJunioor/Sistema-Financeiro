import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PerformanceMetrics } from '../interfaces/investment.interface';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculatePerformanceMetrics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PerformanceMetrics> {
    const periodStart = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const periodEnd = endDate || new Date();

    // Get all investment transactions in the period
    const transactions = await this.prisma.investmentTransaction.findMany({
      where: {
        investment: { userId },
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        investment: true,
      },
      orderBy: { date: 'asc' },
    });

    if (transactions.length === 0) {
      return this.getEmptyMetrics(periodStart, periodEnd);
    }

    // Calculate daily returns
    const dailyReturns = await this.calculateDailyReturns(userId, periodStart, periodEnd);
    
    if (dailyReturns.length === 0) {
      return this.getEmptyMetrics(periodStart, periodEnd);
    }

    // Calculate metrics
    const totalReturn = this.calculateTotalReturn(dailyReturns);
    const totalReturnPercent = totalReturn * 100;
    const annualizedReturn = this.calculateAnnualizedReturn(dailyReturns, periodStart, periodEnd);
    const volatility = this.calculateVolatility(dailyReturns);
    const sharpeRatio = this.calculateSharpeRatio(dailyReturns, 0.05); // Assuming 5% risk-free rate
    const maxDrawdown = this.calculateMaxDrawdown(dailyReturns);
    const { bestDay, worstDay } = this.getBestWorstDays(dailyReturns);
    const winRate = this.calculateWinRate(dailyReturns);

    return {
      totalReturn,
      totalReturnPercent,
      annualizedReturn: annualizedReturn * 100,
      volatility: volatility * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      bestDay: bestDay * 100,
      worstDay: worstDay * 100,
      winRate: winRate * 100,
      periodStart,
      periodEnd,
    };
  }

  private async calculateDailyReturns(userId: string, startDate: Date, endDate: Date): Promise<number[]> {
    // This is a simplified implementation
    // In a real scenario, you'd need to track portfolio value day by day
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      include: {
        transactions: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    // For now, return mock daily returns
    // In production, this would calculate actual daily portfolio values
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const returns: number[] = [];

    for (let i = 0; i < days; i++) {
      // Mock return calculation - replace with actual portfolio value changes
      const mockReturn = (Math.random() - 0.5) * 0.04; // Random return between -2% and +2%
      returns.push(mockReturn);
    }

    return returns;
  }

  private calculateTotalReturn(dailyReturns: number[]): number {
    return dailyReturns.reduce((total, dailyReturn) => {
      return total * (1 + dailyReturn);
    }, 1) - 1;
  }

  private calculateAnnualizedReturn(dailyReturns: number[], startDate: Date, endDate: Date): number {
    const totalReturn = this.calculateTotalReturn(dailyReturns);
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.pow(1 + totalReturn, 1 / years) - 1;
  }

  private calculateVolatility(dailyReturns: number[]): number {
    const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / dailyReturns.length;
    return Math.sqrt(variance * 252); // Annualized volatility (252 trading days)
  }

  private calculateSharpeRatio(dailyReturns: number[], riskFreeRate: number): number {
    const annualizedReturn = this.calculateAnnualizedReturn(dailyReturns, new Date(), new Date());
    const volatility = this.calculateVolatility(dailyReturns);
    
    if (volatility === 0) return 0;
    return (annualizedReturn - riskFreeRate) / volatility;
  }

  private calculateMaxDrawdown(dailyReturns: number[]): number {
    let peak = 1;
    let maxDrawdown = 0;
    let currentValue = 1;

    for (const dailyReturn of dailyReturns) {
      currentValue *= (1 + dailyReturn);
      
      if (currentValue > peak) {
        peak = currentValue;
      }
      
      const drawdown = (peak - currentValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private getBestWorstDays(dailyReturns: number[]): { bestDay: number; worstDay: number } {
    const bestDay = Math.max(...dailyReturns);
    const worstDay = Math.min(...dailyReturns);
    return { bestDay, worstDay };
  }

  private calculateWinRate(dailyReturns: number[]): number {
    const positiveReturns = dailyReturns.filter(ret => ret > 0).length;
    return positiveReturns / dailyReturns.length;
  }

  private getEmptyMetrics(periodStart: Date, periodEnd: Date): PerformanceMetrics {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      bestDay: 0,
      worstDay: 0,
      winRate: 0,
      periodStart,
      periodEnd,
    };
  }

  async calculateInvestmentPerformance(investmentId: string): Promise<{
    totalReturn: number;
    totalReturnPercent: number;
    realizedGainLoss: number;
    unrealizedGainLoss: number;
    dividendsReceived: number;
  }> {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!investment) {
      throw new Error('Investment not found');
    }

    let totalCost = 0;
    let totalQuantity = 0;
    let realizedGainLoss = 0;
    let dividendsReceived = 0;

    // Calculate based on transactions
    for (const transaction of investment.transactions) {
      const quantity = transaction.quantity.toNumber();
      const price = transaction.price.toNumber();
      const fees = transaction.fees?.toNumber() || 0;

      switch (transaction.type) {
        case 'buy':
          totalCost += (quantity * price) + fees;
          totalQuantity += quantity;
          break;
        
        case 'sell':
          const avgCostPerShare = totalQuantity > 0 ? totalCost / totalQuantity : 0;
          const saleProceeds = (quantity * price) - fees;
          const saleCost = quantity * avgCostPerShare;
          realizedGainLoss += saleProceeds - saleCost;
          
          // Update remaining position
          totalCost -= saleCost;
          totalQuantity -= quantity;
          break;
        
        case 'dividend':
          dividendsReceived += (quantity * price) - fees;
          break;
      }
    }

    // Calculate unrealized gain/loss
    const currentPrice = investment.currentPrice?.toNumber() || investment.averagePrice.toNumber();
    const currentValue = totalQuantity * currentPrice;
    const unrealizedGainLoss = currentValue - totalCost;

    const totalReturn = realizedGainLoss + unrealizedGainLoss + dividendsReceived;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    return {
      totalReturn,
      totalReturnPercent,
      realizedGainLoss,
      unrealizedGainLoss,
      dividendsReceived,
    };
  }
}