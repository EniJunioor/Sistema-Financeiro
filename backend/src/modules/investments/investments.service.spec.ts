import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentsService } from './services/investments.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QuotesService } from './services/quotes.service';
import { PortfolioService } from './services/portfolio.service';
import { PerformanceService } from './services/performance.service';
import { PortfolioAnalysisService } from './services/portfolio-analysis.service';
import { CreateInvestmentDto, InvestmentType } from './dto';

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    investment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    investmentTransaction: {
      create: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockQuotesService = {
    getQuote: jest.fn(),
    getMultipleQuotes: jest.fn(),
  };

  const mockPortfolioService = {
    getPortfolioSummary: jest.fn(),
    getAssetAllocation: jest.fn(),
    getRebalancingRecommendations: jest.fn(),
    updateCurrentPrices: jest.fn(),
  };

  const mockPerformanceService = {
    calculatePerformanceMetrics: jest.fn(),
    calculateInvestmentPerformance: jest.fn(),
  };

  const mockPortfolioAnalysisService = {
    getPortfolioAnalysis: jest.fn(),
    calculateDiversificationMetrics: jest.fn(),
    calculateRiskMetrics: jest.fn(),
    calculateBenchmarkComparison: jest.fn(),
    calculateCorrelationMatrix: jest.fn(),
    suggestOptimalAllocation: jest.fn(),
    getRebalancingStrategy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QuotesService, useValue: mockQuotesService },
        { provide: PortfolioService, useValue: mockPortfolioService },
        { provide: PerformanceService, useValue: mockPerformanceService },
        { provide: PortfolioAnalysisService, useValue: mockPortfolioAnalysisService },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new investment', async () => {
      const createInvestmentDto: CreateInvestmentDto = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: InvestmentType.STOCK,
        quantity: 10,
        averagePrice: 150.00,
        currency: 'USD',
        broker: 'Test Broker',
        sector: 'Technology',
      };

      const userId = 'user-123';
      const mockQuote = { price: 155.00, currency: 'USD', timestamp: new Date(), provider: 'Yahoo Finance' };
      const mockInvestment = { id: 'inv-123', ...createInvestmentDto, userId, currentPrice: 155.00 };

      mockPrismaService.investment.findFirst.mockResolvedValue(null);
      mockQuotesService.getQuote.mockResolvedValue(mockQuote);
      mockPrismaService.investment.create.mockResolvedValue(mockInvestment);
      mockPrismaService.investmentTransaction.create.mockResolvedValue({});

      const result = await service.create(createInvestmentDto, userId);

      expect(result).toEqual(mockInvestment);
      expect(mockPrismaService.investment.findFirst).toHaveBeenCalledWith({
        where: { userId, symbol: 'AAPL', type: 'stock' },
      });
      expect(mockQuotesService.getQuote).toHaveBeenCalledWith('AAPL', InvestmentType.STOCK);
      expect(mockPrismaService.investment.create).toHaveBeenCalled();
      expect(mockPrismaService.investmentTransaction.create).toHaveBeenCalled();
    });

    it('should throw error if investment already exists', async () => {
      const createInvestmentDto: CreateInvestmentDto = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: InvestmentType.STOCK,
        quantity: 10,
        averagePrice: 150.00,
      };

      const userId = 'user-123';
      const existingInvestment = { id: 'inv-123', symbol: 'AAPL', type: 'stock', userId };

      mockPrismaService.investment.findFirst.mockResolvedValue(existingInvestment);

      await expect(service.create(createInvestmentDto, userId)).rejects.toThrow(
        'Investment AAPL already exists'
      );
    });
  });

  describe('getSupportedTypes', () => {
    it('should return all supported investment types', () => {
      const types = service.getSupportedTypes();
      expect(types).toEqual(Object.values(InvestmentType));
      expect(types).toContain(InvestmentType.STOCK);
      expect(types).toContain(InvestmentType.CRYPTO);
      expect(types).toContain(InvestmentType.ETF);
    });
  });

  describe('findAll', () => {
    it('should return investments for user', async () => {
      const userId = 'user-123';
      const mockInvestments = [
        { id: 'inv-1', symbol: 'AAPL', type: 'stock', userId, transactions: [] },
        { id: 'inv-2', symbol: 'BTC', type: 'crypto', userId, transactions: [] },
      ];

      mockPrismaService.investment.findMany.mockResolvedValue(mockInvestments);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockInvestments);
      expect(mockPrismaService.investment.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          transactions: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});