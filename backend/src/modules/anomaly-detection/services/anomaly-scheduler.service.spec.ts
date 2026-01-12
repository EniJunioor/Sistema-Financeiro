import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { AnomalySchedulerService } from './anomaly-scheduler.service';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { AlertService } from './alert.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('AnomalySchedulerService', () => {
  let service: AnomalySchedulerService;
  let mockQueue: any;
  let mockPrismaService: any;
  let mockAnomalyDetectionService: any;
  let mockAlertService: any;

  beforeEach(async () => {
    // Mock queue
    mockQueue = {
      add: jest.fn().mockResolvedValue({}),
      getWaiting: jest.fn().mockResolvedValue([]),
      getActive: jest.fn().mockResolvedValue([]),
      getCompleted: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
      clean: jest.fn().mockResolvedValue(0),
    };

    // Mock PrismaService
    mockPrismaService = {
      transaction: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      account: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    // Mock AnomalyDetectionService
    mockAnomalyDetectionService = {
      calculateRiskScore: jest.fn().mockResolvedValue({
        overallRisk: 25,
        transactionRisk: 20,
        behaviorRisk: 15,
        accountRisk: 10,
        timeRisk: 5,
        locationRisk: 0,
      }),
    };

    // Mock AlertService
    mockAlertService = {
      createAccountSecurityAlert: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        BullModule.registerQueue({
          name: 'anomaly-detection',
        }),
      ],
      providers: [
        AnomalySchedulerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AnomalyDetectionService,
          useValue: mockAnomalyDetectionService,
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

    service = module.get<AnomalySchedulerService>(AnomalySchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('monitorGoalsRisk', () => {
    it('should queue goal monitoring job', async () => {
      await service.monitorGoalsRisk();

      expect(mockQueue.add).toHaveBeenCalledWith(
        'monitor-goals',
        {},
        expect.objectContaining({
          priority: 5,
          attempts: 3,
        }),
      );
    });
  });

  describe('analyzeRecentTransactions', () => {
    it('should queue analysis for users with recent transactions', async () => {
      const mockTransactions = [
        {
          userId: 'user1',
          id: 'tx1',
          amount: 100,
          description: 'Test transaction',
          date: new Date(),
          location: 'Test location',
          type: 'expense',
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      await service.analyzeRecentTransactions();

      expect(mockQueue.add).toHaveBeenCalledWith(
        'analyze-patterns',
        expect.objectContaining({
          userId: 'user1',
          transactionData: expect.objectContaining({
            type: 'expense',
            amount: 100,
            description: 'Test transaction',
          }),
        }),
        expect.objectContaining({
          priority: 3,
          attempts: 2,
        }),
      );
    });
  });

  describe('updateBehaviorProfiles', () => {
    it('should queue profile updates for active users', async () => {
      const mockUsers = [{ id: 'user1' }, { id: 'user2' }];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.updateBehaviorProfiles();

      expect(mockQueue.add).toHaveBeenCalledTimes(2);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'train-model',
        { userId: 'user1' },
        expect.objectContaining({
          priority: 1,
          attempts: 2,
        }),
      );
    });
  });

  describe('getMonitoringStats', () => {
    it('should return monitoring statistics', async () => {
      const stats = await service.getMonitoringStats();

      expect(stats).toHaveProperty('queue');
      expect(stats).toHaveProperty('alerts');
      expect(stats).toHaveProperty('lastUpdate');
      expect(stats.queue).toHaveProperty('waiting', 0);
      expect(stats.queue).toHaveProperty('active', 0);
      expect(stats.queue).toHaveProperty('completed', 0);
      expect(stats.queue).toHaveProperty('failed', 0);
    });
  });

  describe('triggerImmediateAnalysis', () => {
    it('should trigger analysis for specific user', async () => {
      const userId = 'test-user';
      
      await service.triggerImmediateAnalysis(userId);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'train-model',
        { userId },
        { priority: 10 },
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'monitor-goals',
        { userId },
        { priority: 10 },
      );
    });

    it('should trigger analysis for all users when no userId provided', async () => {
      // Mock the methods that will be called
      jest.spyOn(service, 'monitorGoalsRisk').mockResolvedValue();
      jest.spyOn(service, 'analyzeRecentTransactions').mockResolvedValue();
      jest.spyOn(service, 'monitorAccountAnomalies').mockResolvedValue();

      await service.triggerImmediateAnalysis();

      expect(service.monitorGoalsRisk).toHaveBeenCalled();
      expect(service.analyzeRecentTransactions).toHaveBeenCalled();
      expect(service.monitorAccountAnomalies).toHaveBeenCalled();
    });
  });
});