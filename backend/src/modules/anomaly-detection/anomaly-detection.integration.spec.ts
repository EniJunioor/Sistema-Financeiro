import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AnomalyDetectionModule } from './anomaly-detection.module';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { AlertService } from './services/alert.service';

describe('AnomalyDetection Integration', () => {
  let app: INestApplication;
  let anomalyDetectionService: AnomalyDetectionService;
  let alertService: AlertService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        BullModule.forRoot({
          redis: {
            host: 'localhost',
            port: 6379,
          },
        }),
        AnomalyDetectionModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    anomalyDetectionService = moduleFixture.get<AnomalyDetectionService>(AnomalyDetectionService);
    alertService = moduleFixture.get<AlertService>(AlertService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('End-to-End Anomaly Detection', () => {
    it('should detect anomaly in large transaction and create alert', async () => {
      // Create a test user
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      // Create some normal transactions to establish baseline
      const normalTransactions = [
        { amount: 50, description: 'Coffee shop', date: new Date() },
        { amount: 100, description: 'Grocery store', date: new Date() },
        { amount: 75, description: 'Gas station', date: new Date() },
      ];

      for (const transaction of normalTransactions) {
        await prismaService.transaction.create({
          data: {
            userId: user.id,
            type: 'expense',
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date,
          },
        });
      }

      // Analyze a large anomalous transaction
      const anomalousTransaction = {
        type: 'expense' as const,
        amount: 5000, // Much larger than normal
        description: 'Unknown merchant',
        date: new Date().toISOString(),
        location: 'Unknown location',
      };

      const result = await anomalyDetectionService.analyzeTransaction(
        user.id,
        anomalousTransaction,
      );

      // Verify anomaly was detected
      expect(result.isAnomaly).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.severity).toMatch(/medium|high|critical/);
      expect(result.riskScore).toBeGreaterThan(50);
      expect(result.reasons.length).toBeGreaterThan(0);

      // Verify alert was created (if severity is not low)
      if (result.severity !== 'low') {
        const alerts = await alertService.getUserAlerts(user.id);
        expect(alerts.length).toBeGreaterThan(0);
        
        const anomalyAlert = alerts.find(alert => 
          alert.type === 'fraud_detection' || alert.type === 'unusual_spending'
        );
        expect(anomalyAlert).toBeDefined();
        expect(anomalyAlert?.isAcknowledged).toBe(false);
      }

      // Clean up
      await prismaService.user.delete({ where: { id: user.id } });
    }, 30000);

    it('should calculate accurate risk score', async () => {
      // Create a test user
      const user = await prismaService.user.create({
        data: {
          email: 'risk-test@example.com',
          name: 'Risk Test User',
        },
      });

      // Create account
      const account = await prismaService.account.create({
        data: {
          userId: user.id,
          name: 'Test Account',
          type: 'checking',
          balance: 1000,
          lastSyncAt: new Date(),
        },
      });

      // Create some risky transactions (late night, large amounts)
      const riskyTransactions = [
        { 
          amount: 2000, 
          description: 'Late night purchase', 
          date: new Date(new Date().setHours(2, 0, 0, 0)) // 2 AM
        },
        { 
          amount: 1500, 
          description: 'Another large purchase', 
          date: new Date(new Date().setHours(23, 30, 0, 0)) // 11:30 PM
        },
      ];

      for (const transaction of riskyTransactions) {
        await prismaService.transaction.create({
          data: {
            userId: user.id,
            accountId: account.id,
            type: 'expense',
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date,
          },
        });
      }

      const riskScore = await anomalyDetectionService.calculateRiskScore(user.id);

      expect(riskScore.overallRisk).toBeGreaterThan(0);
      expect(riskScore.transactionRisk).toBeGreaterThan(0);
      expect(riskScore.timeRisk).toBeGreaterThan(0);
      expect(riskScore.accountRisk).toBeGreaterThanOrEqual(0);
      expect(riskScore.behaviorRisk).toBeGreaterThanOrEqual(0);
      expect(riskScore.locationRisk).toBeGreaterThanOrEqual(0);

      // Clean up
      await prismaService.user.delete({ where: { id: user.id } });
    }, 30000);
  });
});