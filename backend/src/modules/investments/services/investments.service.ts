import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { QuotesService } from './quotes.service';
import { PortfolioService } from './portfolio.service';
import { PerformanceService } from './performance.service';
import { PortfolioAnalysisService } from './portfolio-analysis.service';
import { CreateInvestmentDto, UpdateInvestmentDto, InvestmentType } from '../dto';
import { CreateInvestmentTransactionDto } from '../dto/investment-transaction.dto';
import { PortfolioFiltersDto } from '../dto/portfolio-filters.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quotesService: QuotesService,
    private readonly portfolioService: PortfolioService,
    private readonly performanceService: PerformanceService,
    private readonly portfolioAnalysisService: PortfolioAnalysisService,
  ) {}

  async create(createInvestmentDto: CreateInvestmentDto, userId: string) {
    // Check if investment already exists for this user
    const existingInvestment = await this.prisma.investment.findFirst({
      where: {
        userId,
        symbol: createInvestmentDto.symbol,
        type: createInvestmentDto.type,
      },
    });

    if (existingInvestment) {
      throw new BadRequestException(`Investment ${createInvestmentDto.symbol} already exists`);
    }

    // Get current quote for the investment
    const quote = await this.quotesService.getQuote(
      createInvestmentDto.symbol,
      createInvestmentDto.type as InvestmentType
    );

    const investment = await this.prisma.investment.create({
      data: {
        ...createInvestmentDto,
        userId,
        currentPrice: quote?.price || createInvestmentDto.averagePrice,
      },
    });

    // Create initial buy transaction
    await this.prisma.investmentTransaction.create({
      data: {
        investmentId: investment.id,
        type: 'buy',
        quantity: createInvestmentDto.quantity,
        price: createInvestmentDto.averagePrice,
        date: new Date(),
      },
    });

    this.logger.log(`Created investment ${investment.symbol} for user ${userId}`);
    return investment;
  }

  async findAll(userId: string, filters?: PortfolioFiltersDto) {
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

    return this.prisma.investment.findMany({
      where: whereClause,
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 5, // Last 5 transactions
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const investment = await this.prisma.investment.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!investment) {
      throw new NotFoundException(`Investment with ID ${id} not found`);
    }

    return investment;
  }

  async update(id: string, updateInvestmentDto: UpdateInvestmentDto, userId: string) {
    const investment = await this.findOne(id, userId);

    return this.prisma.investment.update({
      where: { id },
      data: updateInvestmentDto,
    });
  }

  async remove(id: string, userId: string) {
    const investment = await this.findOne(id, userId);

    // Check if there are any transactions
    const transactionCount = await this.prisma.investmentTransaction.count({
      where: { investmentId: id },
    });

    if (transactionCount > 1) {
      throw new BadRequestException('Cannot delete investment with multiple transactions. Consider selling instead.');
    }

    await this.prisma.investment.delete({
      where: { id },
    });

    this.logger.log(`Deleted investment ${investment.symbol} for user ${userId}`);
    return { message: 'Investment deleted successfully' };
  }

  async addTransaction(createTransactionDto: CreateInvestmentTransactionDto, userId: string) {
    const investment = await this.findOne(createTransactionDto.investmentId, userId);

    const transaction = await this.prisma.investmentTransaction.create({
      data: {
        ...createTransactionDto,
        date: new Date(createTransactionDto.date),
      },
    });

    // Update investment average price and quantity based on transaction
    await this.updateInvestmentFromTransaction(investment.id, transaction);

    this.logger.log(`Added ${transaction.type} transaction for ${investment.symbol}`);
    return transaction;
  }

  private async updateInvestmentFromTransaction(investmentId: string, transaction: any) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        transactions: {
          where: { type: { in: ['buy', 'sell'] } },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!investment) return;

    let totalQuantity = 0;
    let totalCost = 0;

    // Recalculate from all buy/sell transactions
    for (const tx of investment.transactions) {
      const quantity = tx.quantity.toNumber();
      const price = tx.price.toNumber();
      const fees = tx.fees?.toNumber() || 0;

      if (tx.type === 'buy') {
        totalCost += (quantity * price) + fees;
        totalQuantity += quantity;
      } else if (tx.type === 'sell') {
        const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        totalCost -= quantity * avgPrice;
        totalQuantity -= quantity;
      }
    }

    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    await this.prisma.investment.update({
      where: { id: investmentId },
      data: {
        quantity: Math.max(0, totalQuantity),
        averagePrice: Math.max(0, averagePrice),
      },
    });
  }

  async getPortfolio(userId: string, filters?: PortfolioFiltersDto) {
    return this.portfolioService.getPortfolioSummary(userId, filters);
  }

  async getAssetAllocation(userId: string) {
    return this.portfolioService.getAssetAllocation(userId);
  }

  async getPerformanceMetrics(userId: string, startDate?: Date, endDate?: Date) {
    return this.performanceService.calculatePerformanceMetrics(userId, startDate, endDate);
  }

  async getInvestmentPerformance(investmentId: string, userId: string) {
    const investment = await this.findOne(investmentId, userId);
    return this.performanceService.calculateInvestmentPerformance(investmentId);
  }

  async getRebalancingRecommendations(userId: string, targetAllocation: { [key: string]: number }) {
    return this.portfolioService.getRebalancingRecommendations(userId, targetAllocation);
  }

  async getPortfolioAnalysis(userId: string, filters?: PortfolioFiltersDto) {
    return this.portfolioAnalysisService.getPortfolioAnalysis(userId);
  }

  async getDiversificationMetrics(userId: string) {
    return this.portfolioAnalysisService.calculateDiversificationMetrics(userId);
  }

  async getRiskMetrics(userId: string) {
    return this.portfolioAnalysisService.calculateRiskMetrics(userId);
  }

  async getBenchmarkComparison(userId: string) {
    return this.portfolioAnalysisService.calculateBenchmarkComparison(userId);
  }

  async getOptimalAllocation(userId: string, riskTolerance: 'conservative' | 'moderate' | 'aggressive') {
    return this.portfolioAnalysisService.suggestOptimalAllocation(userId, riskTolerance);
  }

  async getAdvancedRebalancingStrategy(userId: string, targetAllocation: { [key: string]: number }) {
    return this.portfolioAnalysisService.getRebalancingStrategy(userId, targetAllocation);
  }

  async updateQuotes(userId?: string) {
    return this.portfolioService.updateCurrentPrices(userId);
  }

  // Scheduled task to update quotes every 2 hours during market hours
  @Cron('0 */2 9-17 * * 1-5', {
    name: 'update-investment-quotes',
    timeZone: 'America/Sao_Paulo',
  })
  async handleQuoteUpdate() {
    this.logger.log('Starting scheduled quote update');
    try {
      await this.updateQuotes();
      this.logger.log('Scheduled quote update completed successfully');
    } catch (error) {
      this.logger.error('Scheduled quote update failed', error.stack);
    }
  }

  // Get supported investment types
  getSupportedTypes(): InvestmentType[] {
    return Object.values(InvestmentType);
  }

  // Get investment statistics
  async getInvestmentStats(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      include: {
        transactions: true,
      },
    });

    const stats = {
      totalInvestments: investments.length,
      totalTransactions: investments.reduce((sum, inv) => sum + inv.transactions.length, 0),
      typeDistribution: {} as Record<string, number>,
      brokerDistribution: {} as Record<string, number>,
      sectorDistribution: {} as Record<string, number>,
    };

    investments.forEach(inv => {
      // Type distribution
      stats.typeDistribution[inv.type] = (stats.typeDistribution[inv.type] || 0) + 1;
      
      // Broker distribution
      if (inv.broker) {
        stats.brokerDistribution[inv.broker] = (stats.brokerDistribution[inv.broker] || 0) + 1;
      }
      
      // Sector distribution
      if (inv.sector) {
        stats.sectorDistribution[inv.sector] = (stats.sectorDistribution[inv.sector] || 0) + 1;
      }
    });

    return stats;
  }
}