import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { FraudDetectionService } from './fraud-detection.service';
import { AlertService } from './alert.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('AnomalyDetectionService', () => {
  let service: AnomalyDetectionService;
  let prismaService: PrismaService;
  let fraudDetectionService: FraudDetectionService;
  let alertService: AlertService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
  };

  const mockFraudDetectionService = {
    detectFraud: jest.fn(),
  };

  const mockAlertService = {
    createAnomalyAlert: jest.fn(),
    getUserAlerts: jest.fn(),
    acknowledgeAlert: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnomalyDetectionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FraudDetectionService,
          useValue: mockFraudDetectionService,
        },
        {
          provide: AlertService,
          useValue: mockAlertService,
        },
        {
          provide: getQueueToken('anomaly-detection'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<AnomalyDetectionService>(AnomalyDetectionService);
    prismaService = module.get<PrismaService>(PrismaService);
    fraudDetectionService = module.get<FraudDetectionService>(FraudDetectionService);
    alertService = module.get<AlertService>(AlertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeTransaction', () => {
    it('should analyze a transaction and return anomaly result', async () => {
      const userId = 'user-1';
      const transactionData = {
        type: 'expense' as const,
        amount: 1000,
        description: 'Large purchase',
        date: new Date().toISOString(),
        accountId: 'account-1',
      };

      // Mock user behavior profile
      mockPrismaService.transaction.findMany.mockResolvedValue([
        {
          amount: 100,
          description: 'Regular purchase',
          date: new Date(),
          location: 'Store A',
          category: { name: 'Shopping' },
        },
      ]);

      // Mock fraud detection result
      mockFraudDetectionService.detectFraud.mockResolvedValue({
        isFraud: false,
        confidence: 0.3,
        primaryReason: null,
        reasons: [],
      });

      const result = await service.analyzeTransaction(userId, transactionData);

      expect(result).toBeDefined();
      expect(result.isAnomaly).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.severity).toBeDefined();
      expect(result.riskScore).toBeDefined();
      expect(mockQueue.add).toHaveBeenCalledWith('analyze-patterns', {
        userId,
        transactionData,
        result,
      });
    });

    it('should create alert for high severity anomalies', async () => {
      const userId = 'user-1';
      const transactionData = {
        type: 'expense' as const,
        amount: 5000,
        description: 'Very large purchase',
        date: new Date().toISOString(),
        accountId: 'account-1',
      };

      // Mock user behavior profile with low average
      mockPrismaService.transaction.findMany.mockResolvedValue([
        {
          amount: 50,
          description: 'Small purchase',
          date: new Date(),
          location: 'Store A',
          category: { name: 'Shopping' },
        },
      ]);

      // Mock high confidence fraud detection
      mockFraudDetectionService.detectFraud.mockResolvedValue({
        isFraud: true,
        confidence: 0.9,
        primaryReason: 'amount',
        reasons: ['Transaction amount significantly exceeds user\'s typical spending'],
      });

      const result = await service.analyzeTransaction(userId, transactionData);

      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe('critical');
      expect(mockAlertService.createAnomalyAlert).toHaveBeenCalledWith(
        userId,
        result,
        transactionData,
      );
    });
  });

  describe('getUserBehaviorProfile', () => {
    it('should return default profile for new users', async () => {
      const userId = 'new-user';
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const profile = await service.getUserBehaviorProfile(userId);

      expect(profile.userId).toBe(userId);
      expect(profile.averageTransactionAmount).toBe(100);
      expect(profile.commonMerchants).toEqual([]);
    });

    it('should calculate profile from transaction history', async () => {
      const userId = 'user-1';
      const mockTransactions = [
        {
          amount: 100,
          description: 'STORE_A Purchase',
          date: new Date(),
          location: 'Location A',
          category: { name: 'Shopping' },
        },
        {
          amount: 200,
          description: 'STORE_B Purchase',
          date: new Date(),
          location: 'Location B',
          category: { name: 'Food' },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const profile = await service.getUserBehaviorProfile(userId);

      expect(profile.userId).toBe(userId);
      expect(profile.averageTransactionAmount).toBe(150);
      expect(profile.commonMerchants).toContain('STORE_A');
      expect(profile.commonMerchants).toContain('STORE_B');
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score components', async () => {
      const userId = 'user-1';
      
      // Mock user behavior profile
      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce([]) // For getUserBehaviorProfile
        .mockResolvedValueOnce([]); // For recent transactions

      mockPrismaService.account.findMany.mockResolvedValue([
        { id: 'account-1', lastSyncAt: new Date() },
      ]);

      const riskScore = await service.calculateRiskScore(userId);

      expect(riskScore).toBeDefined();
      expect(riskScore.overallRisk).toBeDefined();
      expect(riskScore.transactionRisk).toBeDefined();
      expect(riskScore.behaviorRisk).toBeDefined();
      expect(riskScore.accountRisk).toBeDefined();
      expect(riskScore.timeRisk).toBeDefined();
      expect(riskScore.locationRisk).toBeDefined();
    });
  });
});