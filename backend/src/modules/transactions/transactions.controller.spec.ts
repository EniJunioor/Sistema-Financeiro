import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { CategoryService } from './services/category.service';
import { MLCategorizationService } from './services/ml-categorization.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: TransactionsService;
  let categoryService: CategoryService;
  let mlService: MLCategorizationService;

  const mockTransactionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
    searchTransactions: jest.fn(),
  };

  const mockCategoryService = {
    findAll: jest.fn(),
    getHierarchy: jest.fn(),
  };

  const mockMLService = {
    suggestCategory: jest.fn(),
    getCategorizationStats: jest.fn(),
    learnFromUserFeedback: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
        {
          provide: MLCategorizationService,
          useValue: mockMLService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get<TransactionsService>(TransactionsService);
    categoryService = module.get<CategoryService>(CategoryService);
    mlService = module.get<MLCategorizationService>(MLCategorizationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction', async () => {
      const createDto = {
        type: 'expense' as const,
        amount: 100.50,
        description: 'Test transaction',
        date: '2024-01-15T10:30:00Z',
      };

      const mockTransaction = {
        id: 'test-id',
        userId: 'user-id',
        ...createDto,
        date: new Date(createDto.date),
        tags: [],
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = { user: { id: 'user-id' } };

      mockTransactionsService.create.mockResolvedValue(mockTransaction);

      const result = await controller.create(createDto, mockRequest);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionsService.create).toHaveBeenCalledWith(createDto, 'user-id');
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const filters = { page: 1, limit: 20 };
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        }
      };

      const mockRequest = { user: { id: 'user-id' } };

      mockTransactionsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(filters, mockRequest);

      expect(result).toEqual(mockResult);
      expect(mockTransactionsService.findAll).toHaveBeenCalledWith('user-id', filters);
    });
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Food', icon: '🍽️', color: '#10b981' },
        { id: '2', name: 'Transport', icon: '🚗', color: '#3b82f6' },
      ];

      mockCategoryService.findAll.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

      expect(result).toEqual(mockCategories);
      expect(mockCategoryService.findAll).toHaveBeenCalled();
    });
  });

  describe('suggestCategory', () => {
    it('should return category suggestion', async () => {
      const body = { description: 'Supermercado Extra', amount: 50.00 };
      const mockSuggestion = {
        categoryId: 'category-id',
        categoryName: 'Supermercado',
        confidence: 0.9,
        reason: 'Detected by keyword'
      };

      const mockRequest = { user: { id: 'user-id' } };

      mockMLService.suggestCategory.mockResolvedValue(mockSuggestion);

      const result = await controller.suggestCategory(body, mockRequest);

      expect(result).toEqual(mockSuggestion);
      expect(mockMLService.suggestCategory).toHaveBeenCalledWith(
        'Supermercado Extra',
        50.00,
        'user-id'
      );
    });
  });
});