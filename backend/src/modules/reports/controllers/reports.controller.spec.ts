import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ReportsController } from './reports.controller';
import { ReportsService } from '../services/reports.service';
import { AnalyticsService } from '../services/analytics.service';
import { TrendsService } from '../services/trends.service';
import { AIForecastingService } from '../services/ai-forecasting.service';
import { ReportGeneratorService } from '../services/report-generator.service';
import { ReportSchedulerService } from '../services/report-scheduler.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AnalyticsQueryDto, PeriodPreset } from '../dto';

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: ReportsService;
  let analyticsService: AnalyticsService;
  let trendsService: TrendsService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockReportsService = {
    getDashboardData: jest.fn(),
    getFinancialOverview: jest.fn(),
    getCashFlowAnalysis: jest.fn(),
    getSpendingPatterns: jest.fn(),
  };

  const mockAnalyticsService = {
    getFinancialSummary: jest.fn(),
    getTransactionsByPeriod: jest.fn(),
  };

  const mockTrendsService = {
    getTrendAnalysis: jest.fn(),
    getPeriodComparison: jest.fn(),
  };

  const mockAIForecastingService = {
    generateAIForecast: jest.fn(),
  };

  const mockReportGeneratorService = {
    generateReport: jest.fn(),
  };

  const mockReportSchedulerService = {
    scheduleReport: jest.fn(),
    getScheduledReports: jest.fn(),
    getScheduledReport: jest.fn(),
    updateScheduledReport: jest.fn(),
    toggleScheduledReport: jest.fn(),
    deleteScheduledReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: TrendsService,
          useValue: mockTrendsService,
        },
        {
          provide: AIForecastingService,
          useValue: mockAIForecastingService,
        },
        {
          provide: ReportGeneratorService,
          useValue: mockReportGeneratorService,
        },
        {
          provide: ReportSchedulerService,
          useValue: mockReportSchedulerService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get<ReportsService>(ReportsService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    trendsService = module.get<TrendsService>(TrendsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardData', () => {
    it('should return dashboard data', async () => {
      const mockDashboardData = {
        summary: {
          totalIncome: 5000,
          totalExpenses: 2000,
          netIncome: 3000,
        },
        trends: {
          historicalData: [],
          projections: [],
        },
        comparison: {
          income: { current: 5000, previous: 4000 },
        },
      };

      mockReportsService.getDashboardData.mockResolvedValue(mockDashboardData);

      const req = { user: { id: 'user-id' } };
      const query: AnalyticsQueryDto = { period: PeriodPreset.CURRENT_MONTH };

      const result = await controller.getDashboardData(req, query);

      expect(result).toEqual(mockDashboardData);
      expect(mockReportsService.getDashboardData).toHaveBeenCalledWith('user-id', query);
    });
  });

  describe('getFinancialSummary', () => {
    it('should return financial summary', async () => {
      const mockSummary = {
        totalIncome: 5000,
        totalExpenses: 2000,
        netIncome: 3000,
        totalBalance: 10000,
        transactionCount: 10,
        averageTransactionAmount: 700,
        largestExpense: 1500,
        largestIncome: 5000,
        categoryBreakdown: [],
        accountSummary: [],
        periodStart: new Date(),
        periodEnd: new Date(),
      };

      mockAnalyticsService.getFinancialSummary.mockResolvedValue(mockSummary);

      const req = { user: { id: 'user-id' } };
      const query: AnalyticsQueryDto = { period: PeriodPreset.CURRENT_MONTH };

      const result = await controller.getFinancialSummary(req, query);

      expect(result).toEqual(mockSummary);
      expect(mockAnalyticsService.getFinancialSummary).toHaveBeenCalledWith('user-id', query);
    });
  });

  describe('getTrendAnalysis', () => {
    it('should return trend analysis', async () => {
      const mockTrends = {
        historicalData: [],
        projections: [],
        incomeTrend: 'positive' as const,
        expenseTrend: 'stable' as const,
        incomeGrowthRate: 5.2,
        expenseGrowthRate: 2.1,
        seasonalPatterns: [],
        periodStart: new Date(),
        periodEnd: new Date(),
      };

      mockTrendsService.getTrendAnalysis.mockResolvedValue(mockTrends);

      const req = { user: { id: 'user-id' } };
      const query: AnalyticsQueryDto = { period: PeriodPreset.LAST_YEAR };

      const result = await controller.getTrendAnalysis(req, query);

      expect(result).toEqual(mockTrends);
      expect(mockTrendsService.getTrendAnalysis).toHaveBeenCalledWith('user-id', query);
    });
  });

  describe('getPeriodComparison', () => {
    it('should return period comparison', async () => {
      const mockComparison = {
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        previousPeriodStart: new Date(),
        previousPeriodEnd: new Date(),
        income: {
          current: 5000,
          previous: 4000,
          change: 1000,
          changePercentage: 25,
          trend: 'up' as const,
        },
        expenses: {
          current: 2000,
          previous: 2200,
          change: -200,
          changePercentage: -9.09,
          trend: 'down' as const,
        },
        netIncome: {
          current: 3000,
          previous: 1800,
          change: 1200,
          changePercentage: 66.67,
          trend: 'up' as const,
        },
        transactionCount: {
          current: 15,
          previous: 12,
          change: 3,
          changePercentage: 25,
          trend: 'up' as const,
        },
        averageTransactionAmount: {
          current: 466.67,
          previous: 516.67,
          change: -50,
          changePercentage: -9.68,
          trend: 'down' as const,
        },
        categoryComparison: [],
        healthScore: 75,
        insights: ['Your income increased significantly!'],
      };

      mockTrendsService.getPeriodComparison.mockResolvedValue(mockComparison);

      const req = { user: { id: 'user-id' } };
      const query: AnalyticsQueryDto = { period: PeriodPreset.CURRENT_MONTH };

      const result = await controller.getPeriodComparison(req, query);

      expect(result).toEqual(mockComparison);
      expect(mockTrendsService.getPeriodComparison).toHaveBeenCalledWith('user-id', query);
    });
  });

  describe('getFinancialOverview', () => {
    it('should return financial overview', async () => {
      const mockOverview = {
        totalBalance: 10000,
        monthlyIncome: 5000,
        monthlyExpenses: 2000,
        savingsRate: 60,
        topCategories: [
          { name: 'Housing', amount: 1500, percentage: 75 },
          { name: 'Food', amount: 500, percentage: 25 },
        ],
        recentTransactions: [],
      };

      mockReportsService.getFinancialOverview.mockResolvedValue(mockOverview);

      const req = { user: { id: 'user-id' } };

      const result = await controller.getFinancialOverview(req);

      expect(result).toEqual(mockOverview);
      expect(mockReportsService.getFinancialOverview).toHaveBeenCalledWith('user-id');
    });
  });

  describe('getCashFlowAnalysis', () => {
    it('should return cash flow analysis', async () => {
      const mockCashFlow = {
        cashFlowData: [],
        averageMonthlyIncome: 5000,
        averageMonthlyExpenses: 2000,
        volatilityScore: 500,
        projectedBalance: 15000,
      };

      mockReportsService.getCashFlowAnalysis.mockResolvedValue(mockCashFlow);

      const req = { user: { id: 'user-id' } };

      const result = await controller.getCashFlowAnalysis(req, 12);

      expect(result).toEqual(mockCashFlow);
      expect(mockReportsService.getCashFlowAnalysis).toHaveBeenCalledWith('user-id', 12);
    });

    it('should use default months when not provided', async () => {
      const mockCashFlow = {
        cashFlowData: [],
        averageMonthlyIncome: 5000,
        averageMonthlyExpenses: 2000,
        volatilityScore: 500,
        projectedBalance: 15000,
      };

      mockReportsService.getCashFlowAnalysis.mockResolvedValue(mockCashFlow);

      const req = { user: { id: 'user-id' } };

      const result = await controller.getCashFlowAnalysis(req);

      expect(result).toEqual(mockCashFlow);
      expect(mockReportsService.getCashFlowAnalysis).toHaveBeenCalledWith('user-id', 12);
    });
  });

  describe('getSpendingPatterns', () => {
    it('should return spending patterns', async () => {
      const mockPatterns = {
        dailyAverages: [],
        monthlyPatterns: [],
        categoryTrends: [],
      };

      mockReportsService.getSpendingPatterns.mockResolvedValue(mockPatterns);

      const req = { user: { id: 'user-id' } };

      const result = await controller.getSpendingPatterns(req);

      expect(result).toEqual(mockPatterns);
      expect(mockReportsService.getSpendingPatterns).toHaveBeenCalledWith('user-id');
    });
  });

  describe('getTransactionsByPeriod', () => {
    it('should return transactions by period', async () => {
      const mockTransactions = [
        {
          period: '2024-01',
          type: 'income',
          total_amount: 5000,
          transaction_count: 2,
        },
      ];

      mockAnalyticsService.getTransactionsByPeriod.mockResolvedValue(mockTransactions);

      const req = { user: { id: 'user-id' } };
      const query: AnalyticsQueryDto = { period: PeriodPreset.CURRENT_MONTH };

      const result = await controller.getTransactionsByPeriod(req, query);

      expect(result).toEqual(mockTransactions);
      expect(mockAnalyticsService.getTransactionsByPeriod).toHaveBeenCalledWith('user-id', query);
    });
  });
});