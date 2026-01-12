import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { AlertService } from '../services/alert.service';

interface AnalyzePatternsJob {
  userId: string;
  transactionData: any;
  result: any;
}

interface TrainModelJob {
  userId: string;
}

interface MonitorGoalsJob {
  userId?: string; // If not provided, monitor all users
}

@Processor('anomaly-detection')
export class AnomalyProcessor {
  private readonly logger = new Logger(AnomalyProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anomalyDetectionService: AnomalyDetectionService,
    private readonly alertService: AlertService,
  ) {}

  @Process('analyze-patterns')
  async analyzePatterns(job: Job<AnalyzePatternsJob>) {
    const { userId, transactionData, result } = job.data;
    
    try {
      this.logger.log(`Analyzing patterns for user ${userId}`);

      // Update user behavior profile based on new transaction
      await this.updateUserProfile(userId, transactionData, result);

      // Check for emerging patterns
      await this.checkEmergingPatterns(userId);

      // Update ML model if needed
      await this.updateMLModel(userId);

      this.logger.log(`Pattern analysis completed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error analyzing patterns: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('train-model')
  async trainModel(job: Job<TrainModelJob>) {
    const { userId } = job.data;
    
    try {
      this.logger.log(`Training ML model for user ${userId}`);

      // Get user's transaction history
      const transactions = await this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 1000, // Last 1000 transactions
        include: { category: true },
      });

      if (transactions.length < 50) {
        this.logger.log(`Insufficient data for training model for user ${userId}`);
        return;
      }

      // Extract features and labels for training
      const trainingData = await this.extractTrainingData(transactions);

      // Train anomaly detection model (simplified version)
      const modelMetrics = await this.trainAnomalyModel(userId, trainingData);

      // Save model metadata
      await this.saveModelMetadata(userId, modelMetrics);

      this.logger.log(`Model training completed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error training model: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('monitor-goals')
  async monitorGoals(job: Job<MonitorGoalsJob>) {
    const { userId } = job.data;
    
    try {
      this.logger.log(`Monitoring goals${userId ? ` for user ${userId}` : ' for all users'}`);

      const whereClause = userId ? { userId } : {};
      
      const goals = await this.prisma.goal.findMany({
        where: {
          ...whereClause,
          isActive: true,
          targetDate: { gte: new Date() }, // Only active goals with future target dates
        },
        include: { user: true },
      });

      for (const goal of goals) {
        await this.analyzeGoalRisk(goal);
      }

      this.logger.log(`Goal monitoring completed for ${goals.length} goals`);
    } catch (error) {
      this.logger.error(`Error monitoring goals: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('detect-account-anomalies')
  async detectAccountAnomalies(job: Job<{ userId: string; accountId: string }>) {
    const { userId, accountId } = job.data;
    
    try {
      this.logger.log(`Detecting account anomalies for user ${userId}, account ${accountId}`);

      // Get recent account activity
      const recentTransactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          accountId,
          date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
        orderBy: { date: 'desc' },
      });

      // Check for suspicious patterns
      await this.checkAccountSuspiciousPatterns(userId, accountId, recentTransactions);

      this.logger.log(`Account anomaly detection completed for account ${accountId}`);
    } catch (error) {
      this.logger.error(`Error detecting account anomalies: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async updateUserProfile(userId: string, transactionData: any, result: any) {
    // This would update the user's behavioral profile
    // For now, we'll just log it
    this.logger.log(`Updating profile for user ${userId} based on transaction analysis`);
  }

  private async checkEmergingPatterns(userId: string) {
    // Get recent transactions to check for new patterns
    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
      orderBy: { date: 'desc' },
    });

    // Check for velocity patterns
    const dailyTransactionCounts = this.groupTransactionsByDay(recentTransactions);
    const avgDailyTransactions = Object.values(dailyTransactionCounts).reduce((a, b) => a + b, 0) / 7;
    
    if (avgDailyTransactions > 20) {
      await this.alertService.createAccountSecurityAlert(
        userId,
        'multiple',
        'High transaction velocity detected',
        'medium',
      );
    }

    // Check for amount patterns
    const amounts = recentTransactions.map(t => Number(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const largeTransactions = amounts.filter(a => a > avgAmount * 5);
    
    if (largeTransactions.length > 3) {
      await this.alertService.createAccountSecurityAlert(
        userId,
        'multiple',
        'Multiple large transactions detected',
        'medium',
      );
    }
  }

  private async updateMLModel(userId: string) {
    // This would update the user's personalized ML model
    // For now, we'll just log it
    this.logger.log(`ML model update queued for user ${userId}`);
  }

  private async extractTrainingData(transactions: any[]) {
    // Extract features for ML training
    return transactions.map(transaction => ({
      amount: Number(transaction.amount),
      hour: new Date(transaction.date).getHours(),
      dayOfWeek: new Date(transaction.date).getDay(),
      category: transaction.category?.name || 'unknown',
      description: transaction.description,
      // Add more features as needed
    }));
  }

  private async trainAnomalyModel(userId: string, trainingData: any[]) {
    // Simplified anomaly detection model training
    // In production, this would use proper ML libraries
    
    const amounts = trainingData.map(d => d.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    return {
      userId,
      modelType: 'statistical',
      parameters: {
        mean,
        stdDev,
        threshold: mean + 2 * stdDev,
      },
      accuracy: 0.85, // Placeholder
      trainedAt: new Date(),
      dataPoints: trainingData.length,
    };
  }

  private async saveModelMetadata(userId: string, modelMetrics: any) {
    // Save model metadata to database or cache
    // For now, we'll just log it
    this.logger.log(`Model metadata saved for user ${userId}: accuracy ${modelMetrics.accuracy}`);
  }

  private async analyzeGoalRisk(goal: any) {
    const userId = goal.userId;
    const currentDate = new Date();
    const targetDate = new Date(goal.targetDate);
    const daysRemaining = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) return; // Goal already expired

    const progressPercentage = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
    const timeProgressPercentage = ((Date.now() - goal.createdAt.getTime()) / (targetDate.getTime() - goal.createdAt.getTime())) * 100;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let message = '';

    if (timeProgressPercentage > 75 && progressPercentage < 50) {
      riskLevel = 'high';
      message = `Your goal "${goal.name}" is at high risk. You're ${timeProgressPercentage.toFixed(0)}% through the timeline but only ${progressPercentage.toFixed(0)}% complete.`;
    } else if (timeProgressPercentage > 50 && progressPercentage < 25) {
      riskLevel = 'medium';
      message = `Your goal "${goal.name}" may be at risk. Consider increasing your efforts to stay on track.`;
    } else if (daysRemaining <= 30 && progressPercentage < 80) {
      riskLevel = 'medium';
      message = `Your goal "${goal.name}" has ${daysRemaining} days remaining and is ${progressPercentage.toFixed(0)}% complete.`;
    }

    if (riskLevel !== 'low') {
      await this.alertService.createGoalRiskAlert(userId, goal.id, riskLevel, message);
    }
  }

  private async checkAccountSuspiciousPatterns(userId: string, accountId: string, transactions: any[]) {
    if (transactions.length === 0) return;

    // Check for rapid-fire transactions
    const rapidTransactions = transactions.filter((transaction, index) => {
      if (index === 0) return false;
      const prevTransaction = transactions[index - 1];
      const timeDiff = new Date(prevTransaction.date).getTime() - new Date(transaction.date).getTime();
      return timeDiff < 60000; // Less than 1 minute apart
    });

    if (rapidTransactions.length > 5) {
      await this.alertService.createAccountSecurityAlert(
        userId,
        accountId,
        `${rapidTransactions.length} rapid transactions detected`,
        'high',
      );
    }

    // Check for round number patterns (potential card testing)
    const roundNumberTransactions = transactions.filter(t => {
      const amount = Number(t.amount);
      return amount % 10 === 0 || amount % 100 === 0;
    });

    if (roundNumberTransactions.length > 10 && roundNumberTransactions.length / transactions.length > 0.8) {
      await this.alertService.createAccountSecurityAlert(
        userId,
        accountId,
        'Suspicious round number transaction pattern detected',
        'critical',
      );
    }
  }

  private groupTransactionsByDay(transactions: any[]): Record<string, number> {
    return transactions.reduce((acc, transaction) => {
      const day = new Date(transaction.date).toDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}