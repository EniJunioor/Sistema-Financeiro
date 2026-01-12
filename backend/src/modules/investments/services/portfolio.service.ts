import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { QuotesService } from './quotes.service';
import { 
  PortfolioSummary, 
  InvestmentSummary, 
  AssetAllocation, 
  AllocationItem,
  RebalancingRecommendation,
  RebalancingAction
} from '../interfaces/investment.interface';
import { PortfolioFiltersDto } from '../dto/portfolio-filters.dto';
import { InvestmentType } from '../dto/create-investment.dto';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quotesService: QuotesService,
  ) {}

  async getPortfolioSummary(userId: string, filters?: PortfolioFiltersDto): Promise<PortfolioSummary> {
    // Build where clause based on filters
    const whereClause: any = { userId };
    
    if (filters?.types?.length) {
      whereClause.type = { in: filters.types };
    }
    if (filters?.broker) {
      whereClause.broker = filters.broker;
    }
    if (filters?.sector) {
      whereClause.sector = filters.sector;
    }
    if (filters?.currency) {
      whereClause.currency = filters.currency;
    }

    const investments = await this.prisma.investment.findMany({
      where: whereClause,
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (investments.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        currency: 'BRL',
        lastUpdated: new Date(),
        investments: [],
      };
    }

    // Get current quotes for all investments
    const symbolsToUpdate = investments.map(inv => ({
      symbol: inv.symbol,
      type: inv.type as InvestmentType,
    }));

    const quotes = await this.quotesService.getMultipleQuotes(symbolsToUpdate);

    // Calculate investment summaries
    const investmentSummaries: InvestmentSummary[] = [];
    let totalValue = 0;
    let totalCost = 0;

    for (const investment of investments) {
      const quote = quotes.get(investment.symbol);
      const currentPrice = quote?.price || investment.currentPrice?.toNumber() || investment.averagePrice.toNumber();
      
      const quantity = investment.quantity.toNumber();
      const averagePrice = investment.averagePrice.toNumber();
      const investmentTotalCost = quantity * averagePrice;
      const investmentTotalValue = quantity * currentPrice;
      const gainLoss = investmentTotalValue - investmentTotalCost;
      const gainLossPercent = investmentTotalCost > 0 ? (gainLoss / investmentTotalCost) * 100 : 0;

      investmentSummaries.push({
        id: investment.id,
        symbol: investment.symbol,
        name: investment.name,
        type: investment.type,
        quantity,
        averagePrice,
        currentPrice,
        totalValue: investmentTotalValue,
        totalCost: investmentTotalCost,
        gainLoss,
        gainLossPercent,
        weight: 0, // Will be calculated after totals
        currency: investment.currency,
        broker: investment.broker,
        sector: investment.sector,
      });

      totalValue += investmentTotalValue;
      totalCost += investmentTotalCost;
    }

    // Calculate portfolio weights
    investmentSummaries.forEach(inv => {
      inv.weight = totalValue > 0 ? (inv.totalValue / totalValue) * 100 : 0;
    });

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      currency: 'BRL', // Default currency, could be made configurable
      lastUpdated: new Date(),
      investments: investmentSummaries,
    };
  }

  async getAssetAllocation(userId: string): Promise<AssetAllocation> {
    const portfolio = await this.getPortfolioSummary(userId);
    
    return {
      byType: this.calculateAllocation(portfolio.investments, 'type'),
      bySector: this.calculateAllocation(portfolio.investments, 'sector'),
      byBroker: this.calculateAllocation(portfolio.investments, 'broker'),
      byCurrency: this.calculateAllocation(portfolio.investments, 'currency'),
    };
  }

  private calculateAllocation(investments: InvestmentSummary[], field: keyof InvestmentSummary): AllocationItem[] {
    const groups = new Map<string, { value: number; count: number }>();
    const totalValue = investments.reduce((sum, inv) => sum + inv.totalValue, 0);

    investments.forEach(inv => {
      const key = (inv[field] as string) || 'Unknown';
      const existing = groups.get(key) || { value: 0, count: 0 };
      groups.set(key, {
        value: existing.value + inv.totalValue,
        count: existing.count + 1,
      });
    });

    return Array.from(groups.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      count: data.count,
    })).sort((a, b) => b.value - a.value);
  }

  async getRebalancingRecommendations(
    userId: string,
    targetAllocation: { [key: string]: number }
  ): Promise<RebalancingRecommendation> {
    const portfolio = await this.getPortfolioSummary(userId);
    const currentAllocation = this.calculateAllocation(portfolio.investments, 'type');
    
    const recommendations: RebalancingAction[] = [];
    let totalRebalanceAmount = 0;

    // Calculate rebalancing actions
    for (const investment of portfolio.investments) {
      const currentWeight = investment.weight;
      const targetWeight = targetAllocation[investment.type] || 0;
      const weightDifference = targetWeight - currentWeight;
      
      if (Math.abs(weightDifference) > 1) { // Only suggest if difference > 1%
        const suggestedAmount = (weightDifference / 100) * portfolio.totalValue;
        const action = weightDifference > 0 ? 'buy' : 'sell';
        const suggestedQuantity = Math.abs(suggestedAmount) / investment.currentPrice;

        recommendations.push({
          symbol: investment.symbol,
          action,
          currentWeight,
          targetWeight,
          suggestedAmount: Math.abs(suggestedAmount),
          suggestedQuantity,
        });

        totalRebalanceAmount += Math.abs(suggestedAmount);
      }
    }

    return {
      currentAllocation,
      targetAllocation: Object.entries(targetAllocation).map(([name, percentage]) => ({
        name,
        value: (percentage / 100) * portfolio.totalValue,
        percentage,
        count: portfolio.investments.filter(inv => inv.type === name).length,
      })),
      recommendations,
      totalRebalanceAmount,
    };
  }

  async updateCurrentPrices(userId?: string): Promise<void> {
    this.logger.log('Starting price update process');

    const whereClause = userId ? { userId } : {};
    const investments = await this.prisma.investment.findMany({
      where: whereClause,
      select: {
        id: true,
        symbol: true,
        type: true,
      },
    });

    if (investments.length === 0) {
      this.logger.log('No investments found for price update');
      return;
    }

    const symbolsToUpdate = investments.map(inv => ({
      symbol: inv.symbol,
      type: inv.type as InvestmentType,
    }));

    const quotes = await this.quotesService.getMultipleQuotes(symbolsToUpdate);
    
    let updatedCount = 0;
    for (const investment of investments) {
      const quote = quotes.get(investment.symbol);
      if (quote) {
        await this.prisma.investment.update({
          where: { id: investment.id },
          data: { 
            currentPrice: quote.price,
            updatedAt: new Date(),
          },
        });
        updatedCount++;
      }
    }

    this.logger.log(`Updated prices for ${updatedCount} out of ${investments.length} investments`);
  }
}