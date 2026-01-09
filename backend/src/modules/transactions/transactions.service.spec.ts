import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TransactionsService } from './services/transactions.service';
import { MLCategorizationService } from './services/ml-categorization.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: PrismaService;
  let mlService: MLCategorizationService;
  let cacheManager: any;

  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
  };

  const mockMLService = {
    suggestCategory: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MLCategorizationService,
          useValue: mockMLService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get<PrismaService>(PrismaService);
    mlService = module.get<MLCategorizationService>(MLCategorizationService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction successfully', async () => {
      const createDto: CreateTransactionDto = {
        type: 'expense',
        amount: 100.50,
        description: 'Test transaction',
        date: '2024-01-15T10:30:00Z',
      };

      const mockTransaction = {
        id: 'test-id',
        userId: 'user-id',
        type: 'expense',
        amount: 100.50,
        description: 'Test transaction',
        date: new Date('2024-01-15T10:30:00Z'),
        tags: null,
        attachments: null,
        account: null,
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
      mockMLService.suggestCategory.mockResolvedValue(null);

      const result = await service.create(createDto, 'user-id');

      expect(result).toEqual({
        ...mockTransaction,
        amount: 100.50,
        tags: [],
        attachments: [],
      });
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          accountId: undefined,
          categoryId: undefined,
          type: 'expense',
          amount: 100.50,
          description: 'Test transaction',
          date: new Date('2024-01-15T10:30:00Z'),
          location: undefined,
          tags: null,
          isRecurring: false,
          recurringRule: undefined,
          attachments: null,
          metadata: undefined,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            }
          }
        }
      });
    });

    it('should auto-categorize transaction when no category provided', async () => {
      const createDto: CreateTransactionDto = {
        type: 'expense',
        amount: 50.00,
        description: 'Supermercado Extra',
        date: '2024-01-15T10:30:00Z',
      };

      const mockSuggestion = {
        categoryId: 'category-id',
        categoryName: 'Supermercado',
        confidence: 0.9,
        reason: 'Detected by keyword'
      };

      const mockTransaction = {
        id: 'test-id',
        userId: 'user-id',
        categoryId: 'category-id',
        type: 'expense',
        amount: 50.00,
        description: 'Supermercado Extra',
        date: new Date('2024-01-15T10:30:00Z'),
        tags: null,
        attachments: null,
        account: null,
        category: {
          id: 'category-id',
          name: 'Supermercado',
          icon: '🛒',
          color: '#ef4444',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMLService.suggestCategory.mockResolvedValue(mockSuggestion);
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create(createDto, 'user-id');

      expect(mockMLService.suggestCategory).toHaveBeenCalledWith(
        'Supermercado Extra',
        50.00,
        'user-id'
      );
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoryId: 'category-id',
          }),
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const filters = { page: 1, limit: 20 };
      const mockTransactions = [
        {
          id: 'test-id-1',
          userId: 'user-id',
          type: 'expense',
          amount: 100.50,
          description: 'Test transaction 1',
          date: new Date(),
          tags: null,
          attachments: null,
          account: null,
          category: null,
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.transaction.count.mockResolvedValue(1);
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.findAll('user-id', filters);

      expect(result).toEqual({
        data: [
          {
            ...mockTransactions[0],
            amount: 100.50,
            tags: [],
            attachments: [],
          }
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      });
    });
  });
});