import { Test, TestingModule } from '@nestjs/testing';
import { MLCategorizationService } from './services/ml-categorization.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('MLCategorizationService', () => {
  let service: MLCategorizationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MLCategorizationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MLCategorizationService>(MLCategorizationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('suggestCategory', () => {
    it('should suggest category based on user history', async () => {
      const mockUserTransactions = [
        {
          id: '1',
          description: 'Supermercado Extra',
          category: {
            id: 'category-1',
            name: 'Supermercado',
          }
        }
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockUserTransactions);

      const result = await service.suggestCategory('Supermercado Extra compras', 100, 'user-id');

      expect(result).toEqual({
        categoryId: 'category-1',
        categoryName: 'Supermercado',
        confidence: 0.95,
        reason: 'Baseado no histórico do usuário'
      });
    });

    it('should suggest category based on keywords', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.category.findFirst.mockResolvedValue({
        id: 'category-2',
        name: 'Supermercado',
      });

      const result = await service.suggestCategory('Compras no supermercado', 100, 'user-id');

      expect(result).toEqual({
        categoryId: 'category-2',
        categoryName: 'Supermercado',
        confidence: 0.9,
        reason: 'Detectado pela palavra-chave: supermercado'
      });
    });

    it('should suggest category based on amount for high values', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      
      // Mock the sequence of calls: first for rules (returns null), then for amount-based (returns Aluguel)
      mockPrismaService.category.findFirst.mockImplementation((query) => {
        if (query.where.name === 'Aluguel') {
          return Promise.resolve({
            id: 'category-3',
            name: 'Aluguel',
          });
        }
        return Promise.resolve(null);
      });

      const result = await service.suggestCategory('Pagamento mensal', 1500, 'user-id');

      expect(result).toEqual({
        categoryId: 'category-3',
        categoryName: 'Aluguel',
        confidence: 0.6,
        reason: 'Valor alto, possivelmente aluguel ou conta importante'
      });
    });

    it('should return default category when no match found', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      
      // Mock to return null for all categories except 'Outros'
      mockPrismaService.category.findFirst.mockImplementation((query) => {
        if (query.where.name === 'Outros') {
          return Promise.resolve({
            id: 'category-default',
            name: 'Outros',
          });
        }
        return Promise.resolve(null);
      });

      const result = await service.suggestCategory('Random description', 50, 'user-id');

      expect(result).toEqual({
        categoryId: 'category-default',
        categoryName: 'Outros',
        confidence: 0.3,
        reason: 'Categoria padrão - não foi possível determinar automaticamente'
      });
    });

    it('should return null when no categories exist', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.category.findFirst.mockResolvedValue(null);

      const result = await service.suggestCategory('Random description', 50, 'user-id');

      expect(result).toBeNull();
    });
  });

  describe('getCategorizationStats', () => {
    it('should return categorization statistics', async () => {
      mockPrismaService.transaction.count
        .mockResolvedValueOnce(100) // Total transactions
        .mockResolvedValueOnce(80); // Categorized transactions

      mockPrismaService.transaction.groupBy.mockResolvedValue([
        { categoryId: 'cat-1', _count: { categoryId: 30 } },
        { categoryId: 'cat-2', _count: { categoryId: 25 } },
      ]);

      mockPrismaService.category.findUnique
        .mockResolvedValueOnce({ name: 'Food' })
        .mockResolvedValueOnce({ name: 'Transport' });

      const result = await service.getCategorizationStats('user-id');

      expect(result).toEqual({
        totalTransactions: 100,
        categorizedTransactions: 80,
        categorizationRate: 80,
        topCategories: [
          { name: 'Food', count: 30 },
          { name: 'Transport', count: 25 },
        ]
      });
    });
  });
});