import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AnalyticsQueryDto, PeriodPreset } from '../dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;
  let cacheManager: any;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
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

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFinancialSummary', () => {
    const userId = 'test-user-id';
    const mockTransactions = [
      {
        id: '1',
        type: 'income',
        amount: 5000,
        description: 'Salary',
        date: new Date('2024-01-15'),
        accountId: 'acc1',
        categoryId: 'cat1',
        category: { id: 'cat1', name: 'Salary' },
        account: { id: 'acc1', name: 'Checking' },
      },
      {
        id: '2',
        type: 'expense',
        amount: 1500,
        description: 'Rent',
        date: new Date('2024-01-01'),
        accountId: 'acc1',
        categoryId: 'cat2',
        category: { id: 'cat2', name: 'Housing' },
        account: { id: 'acc1', name: 'Checking' },
      },
      {
        id: '3',
        type: 'expense',
        amount: 500,
        description: 'Groceries',
        date: new Date('2024-01-10'),
        accountId: 'acc1',
        categoryId: 'cat3',
        category: { id: 'cat3', name: 'Food' },
        account: { id: 'acc1', name: 'Checking' },
      },
    ];

    const mockAccounts = [
      {
        id: 'acc1',
        name: 'Checking',
        type: 'checking',
        balance: 10000,
        isActive: true,
      },
    ];

    beforeEach(() => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);
    });

    it('should return financial summary with correct calculations', async () => {
      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
      };

      const result = await service.getFinancialSummary(userId, query);

      expect(result).toBeDefined();
      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpenses).toBe(2000); // 1500 + 500
      expect(result.netIncome).toBe(3000); // 5000 - 2000
      expect(result.totalBalance).toBe(10000);
      expect(result.transactionCount).toBe(3);
      expect(result.averageTransactionAmount).toBeCloseTo(2333.33, 2); // (5000 + 1500 + 500) / 3
      expect(result.largestExpense).toBe(1500);
      expect(result.largestIncome).toBe(5000);
    });

    it('should return category breakdown correctly', async () => {
      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
      };

      const result = await service.getFinancialSummary(userId, query);

      expect(result.categoryBreakdown).toHaveLength(2); // Housing and Food categories
      
      const housingCategory = result.categoryBreakdown.find(c => c.categoryName === 'Housing');
      expect(housingCategory).toBeDefined();
      expect(housingCategory?.amount).toBe(1500);
      expect(housingCategory?.percentage).toBe(75); // 1500 / 2000 * 100

      const foodCategory = result.categoryBreakdown.find(c => c.categoryName === 'Food');
      expect(foodCategory).toBeDefined();
      expect(foodCategory?.amount).toBe(500);
      expect(foodCategory?.percentage).toBe(25); // 500 / 2000 * 100
    });

    it('should return account summary correctly', async () => {
      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
      };

      const result = await service.getFinancialSummary(userId, query);

      expect(result.accountSummary).toHaveLength(1);
      
      const accountSummary = result.accountSummary[0];
      expect(accountSummary.accountId).toBe('acc1');
      expect(accountSummary.accountName).toBe('Checking');
      expect(accountSummary.balance).toBe(10000);
      expect(accountSummary.totalIncome).toBe(5000);
      expect(accountSummary.totalExpenses).toBe(2000);
      expect(accountSummary.netChange).toBe(3000);
    });

    it('should use cache when available', async () => {
      const cachedResult = {
        totalIncome: 1000,
        totalExpenses: 500,
        netIncome: 500,
      };
      
      mockCacheManager.get.mockResolvedValue(cachedResult);

      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
      };

      const result = await service.getFinancialSummary(userId, query);

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.transaction.findMany).not.toHaveBeenCalled();
    });

    it('should cache the result after calculation', async () => {
      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
      };

      await service.getFinancialSummary(userId, query);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('financial-summary'),
        expect.any(Object),
        300, // 5 minutes cache
      );
    });

    it('should handle empty transactions gracefully', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);

      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
      };

      const result = await service.getFinancialSummary(userId, query);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netIncome).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.averageTransactionAmount).toBe(0);
      expect(result.categoryBreakdown).toHaveLength(0);
    });

    it('should filter by account IDs when provided', async () => {
      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
        accountIds: ['acc1'],
      };

      await service.getFinancialSummary(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId,
          accountId: { in: ['acc1'] },
        }),
        include: expect.any(Object),
      });
    });

    it('should filter by category IDs when provided', async () => {
      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
        categoryIds: ['cat1', 'cat2'],
      };

      await service.getFinancialSummary(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId,
          categoryId: { in: ['cat1', 'cat2'] },
        }),
        include: expect.any(Object),
      });
    });

    it('should filter by transaction types when provided', async () => {
      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
        transactionTypes: ['expense'],
      };

      await service.getFinancialSummary(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId,
          type: { in: ['expense'] },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('getTransactionsByPeriod', () => {
    const userId = 'test-user-id';

    it('should return aggregated transactions by period', async () => {
      const mockResult = [
        {
          period: '2024-01',
          type: 'income',
          total_amount: 5000,
          transaction_count: 2,
        },
        {
          period: '2024-01',
          type: 'expense',
          total_amount: 2000,
          transaction_count: 5,
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.$queryRaw.mockResolvedValue(mockResult);

      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
      };

      const result = await service.getTransactionsByPeriod(userId, query);

      expect(result).toEqual(mockResult);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('transactions-by-period'),
        mockResult,
        300,
      );
    });

    it('should use cache when available', async () => {
      const cachedResult = [{ period: '2024-01', type: 'income' }];
      mockCacheManager.get.mockResolvedValue(cachedResult);

      const query: AnalyticsQueryDto = {
        period: PeriodPreset.CURRENT_MONTH,
      };

      const result = await service.getTransactionsByPeriod(userId, query);

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
    });
  });
});