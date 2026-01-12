import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { AlertService } from './alert.service';

@Injectable()
export class AnomalySchedulerService {
  private readonly logger = new Logger(AnomalySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anomalyDetectionService: AnomalyDetectionService,
    private readonly alertService: AlertService,
    @InjectQueue('anomaly-detection') private readonly anomalyQueue: Queue,
  ) {}

  /**
   * Monitor goals every 4 hours to check for risk
   */
  @Cron('0 */4 * * *', {
    name: 'monitor-goals-risk',
    timeZone: 'America/Sao_Paulo',
  })
  async monitorGoalsRisk(): Promise<void> {
    this.logger.log('Starting scheduled goal risk monitoring');
    
    try {
      await this.anomalyQueue.add('monitor-goals', {}, {
        priority: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      
      this.logger.log('Goal risk monitoring job scheduled successfully');
    } catch (error) {
      this.logger.error('Failed to schedule goal risk monitoring:', error);
    }
  }

  /**
   * Analyze recent transactions for anomalies every 2 hours
   */
  @Cron('0 */2 * * *', {
    name: 'analyze-recent-transactions',
    timeZone: 'America/Sao_Paulo',
  })
  async analyzeRecentTransactions(): Promise<void> {
    this.logger.log('Starting scheduled analysis of recent transactions');
    
    try {
      // Get all users who had transactions in the last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const recentTransactions = await this.prisma.transaction.findMany({
        where: {
          createdAt: { gte: twoHoursAgo },
        },
        select: {
          userId: true,
          id: true,
          amount: true,
          description: true,
          date: true,
          location: true,
          type: true,
        },
        distinct: ['userId'],
      });

      // Queue analysis for each user with recent transactions
      for (const transaction of recentTransactions) {
        await this.anomalyQueue.add('analyze-patterns', {
          userId: transaction.userId,
          transactionData: {
            type: transaction.type,
            amount: Number(transaction.amount),
            description: transaction.description,
            date: transaction.date.toISOString(),
            location: transaction.location,
          },
          result: null, // Will be analyzed by the processor
        }, {
          priority: 3,
          attempts: 2,
        });
      }
      
      this.logger.log(`Queued anomaly analysis for ${recentTransactions.length} users with recent transactions`);
    } catch (error) {
      this.logger.error('Failed to analyze recent transactions:', error);
    }
  }

  /**
   * Update user behavior profiles daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'update-behavior-profiles',
    timeZone: 'America/Sao_Paulo',
  })
  async updateBehaviorProfiles(): Promise<void> {
    this.logger.log('Starting scheduled behavior profile updates');
    
    try {
      // Get all active users
      const activeUsers = await this.prisma.user.findMany({
        where: {
          // Users who had transactions in the last 30 days
          transactions: {
            some: {
              date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
        },
        select: { id: true },
      });

      // Queue profile updates for each active user
      for (const user of activeUsers) {
        await this.anomalyQueue.add('train-model', {
          userId: user.id,
        }, {
          priority: 1, // Low priority
          attempts: 2,
          delay: Math.random() * 60000, // Random delay up to 1 minute to spread load
        });
      }
      
      this.logger.log(`Queued behavior profile updates for ${activeUsers.length} active users`);
    } catch (error) {
      this.logger.error('Failed to update behavior profiles:', error);
    }
  }

  /**
   * Monitor account anomalies every 30 minutes during business hours
   */
  @Cron('*/30 9-18 * * 1-5', {
    name: 'monitor-account-anomalies',
    timeZone: 'America/Sao_Paulo',
  })
  async monitorAccountAnomalies(): Promise<void> {
    this.logger.log('Starting scheduled account anomaly monitoring');
    
    try {
      // Get accounts with recent activity (last 4 hours)
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      
      const activeAccounts = await this.prisma.account.findMany({
        where: {
          transactions: {
            some: {
              date: { gte: fourHoursAgo },
            },
          },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      // Queue anomaly detection for each active account
      for (const account of activeAccounts) {
        await this.anomalyQueue.add('detect-account-anomalies', {
          userId: account.userId,
          accountId: account.id,
        }, {
          priority: 4,
          attempts: 2,
        });
      }
      
      this.logger.log(`Queued account anomaly detection for ${activeAccounts.length} active accounts`);
    } catch (error) {
      this.logger.error('Failed to monitor account anomalies:', error);
    }
  }

  /**
   * Generate weekly anomaly reports every Sunday at 8 AM
   */
  @Cron('0 8 * * 0', {
    name: 'generate-weekly-reports',
    timeZone: 'America/Sao_Paulo',
  })
  async generateWeeklyReports(): Promise<void> {
    this.logger.log('Starting weekly anomaly report generation');
    
    try {
      // Get all users with anomalies in the last week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const usersWithAnomalies = await this.prisma.notification.findMany({
        where: {
          createdAt: { gte: oneWeekAgo },
          type: { in: ['warning', 'error'] }, // Anomaly-related notifications
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      // Generate weekly summary for each user
      for (const user of usersWithAnomalies) {
        await this.generateWeeklySummary(user.userId);
      }
      
      this.logger.log(`Generated weekly anomaly reports for ${usersWithAnomalies.length} users`);
    } catch (error) {
      this.logger.error('Failed to generate weekly reports:', error);
    }
  }

  /**
   * Cleanup old anomaly data monthly
   */
  @Cron('0 2 1 * *', {
    name: 'cleanup-old-data',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanupOldData(): Promise<void> {
    this.logger.log('Starting monthly cleanup of old anomaly data');
    
    try {
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      // Clean up old notifications (keep only last 3 months)
      const deletedNotifications = await this.prisma.notification.deleteMany({
        where: {
          createdAt: { lt: threeMonthsAgo },
          type: { in: ['info', 'warning'] }, // Don't delete critical error notifications
        },
      });
      
      this.logger.log(`Cleaned up ${deletedNotifications.count} old notifications`);
      
      // Clean up completed queue jobs
      await this.anomalyQueue.clean(7 * 24 * 60 * 60 * 1000, 'completed'); // 7 days
      await this.anomalyQueue.clean(24 * 60 * 60 * 1000, 'failed'); // 1 day
      
      this.logger.log('Queue cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup old data:', error);
    }
  }

  /**
   * Manual trigger for immediate anomaly analysis
   */
  async triggerImmediateAnalysis(userId?: string): Promise<void> {
    this.logger.log(`Triggering immediate anomaly analysis${userId ? ` for user ${userId}` : ' for all users'}`);
    
    try {
      if (userId) {
        // Analyze specific user
        await this.anomalyQueue.add('train-model', { userId }, { priority: 10 });
        await this.anomalyQueue.add('monitor-goals', { userId }, { priority: 10 });
      } else {
        // Trigger all monitoring jobs
        await this.monitorGoalsRisk();
        await this.analyzeRecentTransactions();
        await this.monitorAccountAnomalies();
      }
      
      this.logger.log('Immediate anomaly analysis triggered successfully');
    } catch (error) {
      this.logger.error('Failed to trigger immediate analysis:', error);
      throw error;
    }
  }

  /**
   * Get anomaly monitoring statistics
   */
  async getMonitoringStats(): Promise<any> {
    try {
      const queueStats = {
        waiting: await this.anomalyQueue.getWaiting(),
        active: await this.anomalyQueue.getActive(),
        completed: await this.anomalyQueue.getCompleted(),
        failed: await this.anomalyQueue.getFailed(),
      };

      const recentAlerts = await this.prisma.notification.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          type: { in: ['warning', 'error'] },
        },
      });

      return {
        queue: {
          waiting: queueStats.waiting.length,
          active: queueStats.active.length,
          completed: queueStats.completed.length,
          failed: queueStats.failed.length,
        },
        alerts: {
          last24Hours: recentAlerts,
        },
        lastUpdate: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get monitoring stats:', error);
      throw error;
    }
  }

  private async generateWeeklySummary(userId: string): Promise<void> {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get user's anomalies from the last week
      const weeklyAnomalies = await this.prisma.notification.findMany({
        where: {
          userId,
          createdAt: { gte: oneWeekAgo },
          type: { in: ['warning', 'error'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (weeklyAnomalies.length === 0) return;

      // Calculate risk score
      const riskScore = await this.anomalyDetectionService.calculateRiskScore(userId);

      // Create weekly summary notification
      const summary = {
        totalAnomalies: weeklyAnomalies.length,
        highSeverityCount: weeklyAnomalies.filter(a => a.type === 'error').length,
        currentRiskScore: riskScore.overallRisk,
        topConcerns: weeklyAnomalies.slice(0, 3).map(a => a.title),
      };

      await this.alertService.createAccountSecurityAlert(
        userId,
        'summary',
        `Weekly Security Summary: ${summary.totalAnomalies} anomalies detected, risk score: ${summary.currentRiskScore}`,
        summary.highSeverityCount > 0 ? 'medium' : 'low',
      );

      this.logger.log(`Generated weekly summary for user ${userId}: ${summary.totalAnomalies} anomalies`);
    } catch (error) {
      this.logger.error(`Failed to generate weekly summary for user ${userId}:`, error);
    }
  }
}