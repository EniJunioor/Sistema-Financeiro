import { Test, TestingModule } from '@nestjs/testing';
import { DeduplicationService } from './deduplication.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('DeduplicationService', () => {
  let service: DeduplicationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeduplicationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DeduplicationService>(DeduplicationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSimilarity', () => {
    it('should detect exact matches with high confidence', () => {
      const transaction1 = {
        id: '1',
        amount: 100.00,
        description: 'Test Transaction',
        date: new Date('2024-01-15'),
        location: 'Test Location',
        accountId: 'account1',
      };

      const transaction2 = {
        id: '2',
        amount: 100.00,
        description: 'Test Transaction',
        date: new Date('2024-01-15'),
        location: 'Test Location',
        accountId: 'account1',
      };

      const settings = {
        userId: 'user1',
        dateToleranceDays: 3,
        amountTolerancePercent: 1.0,
        descriptionSimilarityThreshold: 0.8,
        autoMergeThreshold: 0.95,
        enabledCriteria: {
          date: true,
          amount: true,
          description: true,
          location: true,
          account: true,
        },
      };

      const result = (service as any).calculateSimilarity(transaction1, transaction2, settings);

      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.matchingCriteria).toContain('date');
      expect(result.matchingCriteria).toContain('amount');
      expect(result.matchingCriteria).toContain('description');
      expect(result.matchingCriteria).toContain('location');
      expect(result.matchingCriteria).toContain('account');
    });

    it('should detect partial matches with medium confidence', () => {
      const transaction1 = {
        id: '1',
        amount: 100.00,
        description: 'Test Transaction',
        date: new Date('2024-01-15'),
        location: 'Test Location',
        accountId: 'account1',
      };

      const transaction2 = {
        id: '2',
        amount: 100.50, // Slightly different amount
        description: 'Test Transaction Similar', // Similar description
        date: new Date('2024-01-16'), // Next day
        location: 'Different Location',
        accountId: 'account1',
      };

      const settings = {
        userId: 'user1',
        dateToleranceDays: 3,
        amountTolerancePercent: 1.0,
        descriptionSimilarityThreshold: 0.8,
        autoMergeThreshold: 0.95,
        enabledCriteria: {
          date: true,
          amount: true,
          description: true,
          location: true,
          account: true,
        },
      };

      const result = (service as any).calculateSimilarity(transaction1, transaction2, settings);

      expect(result.confidence).toBeGreaterThan(0.45);
      expect(result.confidence).toBeLessThan(0.9);
      expect(result.matchingCriteria).toContain('account');
    });

    it('should reject completely different transactions', () => {
      const transaction1 = {
        id: '1',
        amount: 100.00,
        description: 'Grocery Shopping',
        date: new Date('2024-01-15'),
        location: 'Supermarket',
        accountId: 'account1',
      };

      const transaction2 = {
        id: '2',
        amount: 500.00,
        description: 'Car Payment',
        date: new Date('2024-02-15'),
        location: 'Bank',
        accountId: 'account2',
      };

      const settings = {
        userId: 'user1',
        dateToleranceDays: 3,
        amountTolerancePercent: 1.0,
        descriptionSimilarityThreshold: 0.8,
        autoMergeThreshold: 0.95,
        enabledCriteria: {
          date: true,
          amount: true,
          description: true,
          location: true,
          account: true,
        },
      };

      const result = (service as any).calculateSimilarity(transaction1, transaction2, settings);

      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('calculateLevenshteinSimilarity', () => {
    it('should calculate correct similarity for identical strings', () => {
      const similarity = (service as any).calculateLevenshteinSimilarity('test', 'test');
      expect(similarity).toBe(1.0);
    });

    it('should calculate correct similarity for similar strings', () => {
      const similarity = (service as any).calculateLevenshteinSimilarity('test', 'tests');
      expect(similarity).toBeGreaterThanOrEqual(0.8);
    });

    it('should calculate correct similarity for different strings', () => {
      const similarity = (service as any).calculateLevenshteinSimilarity('test', 'completely different');
      expect(similarity).toBeLessThan(0.3);
    });
  });

  describe('calculateDateSimilarity', () => {
    it('should return 1.0 for same date', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-15');
      const similarity = (service as any).calculateDateSimilarity(date1, date2, 3);
      expect(similarity).toBe(1.0);
    });

    it('should return decreasing similarity for dates within tolerance', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      const similarity = (service as any).calculateDateSimilarity(date1, date2, 3);
      expect(similarity).toBeGreaterThan(0.6);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should return 0.0 for dates outside tolerance', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-20');
      const similarity = (service as any).calculateDateSimilarity(date1, date2, 3);
      expect(similarity).toBe(0.0);
    });
  });

  describe('calculateAmountSimilarity', () => {
    it('should return 1.0 for exact amounts', () => {
      const similarity = (service as any).calculateAmountSimilarity(100.00, 100.00, 1.0);
      expect(similarity).toBe(1.0);
    });

    it('should return high similarity for amounts within tolerance', () => {
      const similarity = (service as any).calculateAmountSimilarity(100.00, 100.50, 1.0);
      expect(similarity).toBeGreaterThan(0.5);
    });

    it('should return 0.0 for amounts outside tolerance', () => {
      const similarity = (service as any).calculateAmountSimilarity(100.00, 110.00, 1.0);
      expect(similarity).toBe(0.0);
    });
  });
});