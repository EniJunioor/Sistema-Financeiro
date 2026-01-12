import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { FraudDetectionService } from './fraud-detection.service';
import { AlertService } from './alert.service';
import { AnalyzeTransactionDto } from '../dto/analyze-transaction.dto';
import { AnomalyFiltersDto } from '../dto/anomaly-filters.dto';
import {
  AnomalyDetectionResult,
  UserBehaviorProfile,
  MLModelFeatures,
  RiskScoreComponents,
} from '../interfaces/anomaly.interface';

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly alertService: AlertService,
    @InjectQueue('anomaly-detection') private readonly anomalyQueue: Queue,
  ) {}

  async analyzeTransaction(
    userId: string,
    transactionData: AnalyzeTransactionDto,
  ): Promise<AnomalyDetectionResult> {
    try {
      this.logger.log(`Analyzing transaction for user ${userId}`);

      // Get user behavior profile
      const profile = await this.getUserBehaviorProfile(userId);
      
      // Extract features from transaction
      const features = await this.extractFeatures(userId, transactionData, profile);
      
      // Run fraud detection rules
      const fraudResult = await this.fraudDetectionService.detectFraud(features, profile);
      
      // Calculate anomaly score using statistical methods
      const statisticalScore = await this.calculateStatisticalAnomalyScore(features, profile);
      
      // Combine results
      const result: AnomalyDetectionResult = {
        isAnomaly: fraudResult.isFraud || statisticalScore > 0.7,
        confidence: Math.max(fraudResult.confidence, statisticalScore),
        severity: this.determineSeverity(Math.max(fraudResult.confidence, statisticalScore)),
        anomalyType: fraudResult.primaryReason || this.determineAnomalyType(features, profile),
        reasons: [...fraudResult.reasons, ...this.getStatisticalReasons(features, profile)],
        riskScore: Math.round(Math.max(fraudResult.confidence, statisticalScore) * 100),
        recommendations: this.generateRecommendations(fraudResult, statisticalScore, features),
      };

      // If anomaly detected, create alert
      if (result.isAnomaly && result.severity !== 'low') {
        await this.alertService.createAnomalyAlert(userId, result, transactionData);
      }

      // Queue background analysis for model improvement
      await this.anomalyQueue.add('analyze-patterns', {
        userId,
        transactionData,
        result,
      });

      return result;
    } catch (error) {
      this.logger.error(`Error analyzing transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    try {
      // Get user's transaction history for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: sixMonthsAgo },
        },
        include: {
          category: true,
        },
        orderBy: { date: 'desc' },
      });

      if (transactions.length === 0) {
        // Return default profile for new users
        return this.getDefaultProfile(userId);
      }

      const amounts = transactions.map(t => Number(t.amount));
      const merchants = transactions.map(t => this.extractMerchant(t.description)).filter(Boolean);
      const locations = transactions.map(t => t.location).filter(Boolean);
      const categories = transactions.map(t => t.category?.name).filter(Boolean);

      return {
        userId,
        averageTransactionAmount: amounts.reduce((a, b) => a + b, 0) / amounts.length,
        medianTransactionAmount: this.calculateMedian(amounts),
        standardDeviation: this.calculateStandardDeviation(amounts),
        commonMerchants: this.getTopItems(merchants, 10),
        commonLocations: this.getTopItems(locations, 10),
        commonCategories: this.getTopItems(categories, 10),
        typicalTransactionTimes: this.analyzeTransactionTimes(transactions),
        weeklyPattern: this.analyzeWeeklyPattern(transactions),
        monthlySpendingPattern: this.analyzeMonthlyPattern(transactions),
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error getting user behavior profile: ${error.message}`);
      return this.getDefaultProfile(userId);
    }
  }

  private async extractFeatures(
    userId: string,
    transactionData: AnalyzeTransactionDto,
    profile: UserBehaviorProfile,
  ): Promise<MLModelFeatures> {
    const transactionDate = new Date(transactionData.date);
    const merchant = this.extractMerchant(transactionData.description);
    
    // Get last transaction time
    const lastTransaction = await this.prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const timeSinceLastTransaction = lastTransaction
      ? (transactionDate.getTime() - lastTransaction.date.getTime()) / (1000 * 60 * 60)
      : 24;

    // Get consecutive transactions count
    const recentTransactions = await this.prisma.transaction.count({
      where: {
        userId,
        date: {
          gte: new Date(transactionDate.getTime() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    return {
      amount: transactionData.amount,
      hourOfDay: transactionDate.getHours(),
      dayOfWeek: transactionDate.getDay(),
      dayOfMonth: transactionDate.getDate(),
      isWeekend: transactionDate.getDay() === 0 || transactionDate.getDay() === 6,
      merchantFrequency: merchant ? profile.commonMerchants.indexOf(merchant) + 1 : 0,
      locationFrequency: transactionData.location ? profile.commonLocations.indexOf(transactionData.location) + 1 : 0,
      categoryFrequency: 1, // Would need category lookup
      timeSinceLastTransaction,
      amountDeviationFromAverage: Math.abs(transactionData.amount - profile.averageTransactionAmount) / profile.standardDeviation,
      isNewMerchant: merchant ? !profile.commonMerchants.includes(merchant) : false,
      isNewLocation: transactionData.location ? !profile.commonLocations.includes(transactionData.location) : false,
      consecutiveTransactions: recentTransactions,
    };
  }

  private async calculateStatisticalAnomalyScore(
    features: MLModelFeatures,
    profile: UserBehaviorProfile,
  ): Promise<number> {
    let score = 0;
    let factors = 0;

    // Amount anomaly (Z-score based)
    if (features.amountDeviationFromAverage > 2) {
      score += 0.3;
      factors++;
    } else if (features.amountDeviationFromAverage > 1.5) {
      score += 0.15;
      factors++;
    }

    // Time anomaly
    const typicalHours = profile.typicalTransactionTimes;
    if (typicalHours.length > 0 && !typicalHours.includes(features.hourOfDay)) {
      score += 0.2;
      factors++;
    }

    // New merchant/location
    if (features.isNewMerchant && features.amount > profile.averageTransactionAmount * 2) {
      score += 0.25;
      factors++;
    }

    if (features.isNewLocation && features.amount > profile.averageTransactionAmount * 1.5) {
      score += 0.2;
      factors++;
    }

    // Frequency anomaly
    if (features.consecutiveTransactions > 5) {
      score += 0.3;
      factors++;
    }

    // Weekend large transactions
    if (features.isWeekend && features.amount > profile.averageTransactionAmount * 3) {
      score += 0.15;
      factors++;
    }

    return factors > 0 ? Math.min(score / factors, 1) : 0;
  }

  private determineSeverity(confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  private determineAnomalyType(
    features: MLModelFeatures,
    profile: UserBehaviorProfile,
  ): 'amount' | 'frequency' | 'location' | 'merchant' | 'time' | 'pattern' {
    if (features.amountDeviationFromAverage > 2) return 'amount';
    if (features.consecutiveTransactions > 5) return 'frequency';
    if (features.isNewLocation) return 'location';
    if (features.isNewMerchant) return 'merchant';
    if (!profile.typicalTransactionTimes.includes(features.hourOfDay)) return 'time';
    return 'pattern';
  }

  private getStatisticalReasons(features: MLModelFeatures, profile: UserBehaviorProfile): string[] {
    const reasons: string[] = [];

    if (features.amountDeviationFromAverage > 2) {
      reasons.push(`Transaction amount is ${features.amountDeviationFromAverage.toFixed(1)} standard deviations from your average`);
    }

    if (features.isNewMerchant) {
      reasons.push('Transaction with a new merchant');
    }

    if (features.isNewLocation) {
      reasons.push('Transaction in a new location');
    }

    if (features.consecutiveTransactions > 5) {
      reasons.push(`${features.consecutiveTransactions} transactions in the last hour`);
    }

    if (!profile.typicalTransactionTimes.includes(features.hourOfDay)) {
      reasons.push(`Transaction at unusual time (${features.hourOfDay}:00)`);
    }

    return reasons;
  }

  private generateRecommendations(
    fraudResult: any,
    statisticalScore: number,
    features: MLModelFeatures,
  ): string[] {
    const recommendations: string[] = [];

    if (fraudResult.isFraud) {
      recommendations.push('Consider verifying this transaction with your bank');
      recommendations.push('Review your account for any other suspicious activity');
    }

    if (statisticalScore > 0.7) {
      recommendations.push('Monitor your account closely for the next few days');
    }

    if (features.isNewMerchant && features.amount > 1000) {
      recommendations.push('Verify the merchant and keep receipts for large purchases');
    }

    if (features.consecutiveTransactions > 5) {
      recommendations.push('Consider setting up transaction limits for added security');
    }

    return recommendations;
  }

  async getUserAnomalies(userId: string, filters: AnomalyFiltersDto) {
    // This would typically query a dedicated anomalies table
    // For now, we'll return alerts as anomalies
    return this.alertService.getUserAlerts(userId);
  }

  async calculateRiskScore(userId: string): Promise<RiskScoreComponents> {
    const profile = await this.getUserBehaviorProfile(userId);
    
    // Get recent transactions for analysis
    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
    });

    const transactionRisk = this.calculateTransactionRisk(recentTransactions, profile);
    const behaviorRisk = this.calculateBehaviorRisk(profile);
    const accountRisk = await this.calculateAccountRisk(userId);
    const timeRisk = this.calculateTimeRisk(recentTransactions);
    const locationRisk = this.calculateLocationRisk(recentTransactions, profile);

    const overallRisk = Math.round(
      (transactionRisk * 0.3 + behaviorRisk * 0.2 + accountRisk * 0.2 + timeRisk * 0.15 + locationRisk * 0.15)
    );

    return {
      transactionRisk,
      behaviorRisk,
      accountRisk,
      timeRisk,
      locationRisk,
      overallRisk,
    };
  }

  async trainUserModel(userId: string) {
    // Queue model training job
    await this.anomalyQueue.add('train-model', { userId });
    return { message: 'Model training initiated' };
  }

  // Helper methods
  private getDefaultProfile(userId: string): UserBehaviorProfile {
    return {
      userId,
      averageTransactionAmount: 100,
      medianTransactionAmount: 50,
      standardDeviation: 50,
      commonMerchants: [],
      commonLocations: [],
      commonCategories: [],
      typicalTransactionTimes: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      weeklyPattern: [1, 2, 3, 4, 5],
      monthlySpendingPattern: Array.from({ length: 31 }, (_, i) => i + 1),
      lastUpdated: new Date(),
    };
  }

  private extractMerchant(description: string): string | null {
    // Simple merchant extraction - in production, this would be more sophisticated
    const words = description.split(' ');
    return words.length > 0 ? words[0].toUpperCase() : null;
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateStandardDeviation(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private getTopItems(items: string[], count: number): string[] {
    const frequency = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([item]) => item);
  }

  private analyzeTransactionTimes(transactions: any[]): number[] {
    const hours = transactions.map(t => new Date(t.date).getHours());
    return [...new Set(hours)].sort((a, b) => a - b);
  }

  private analyzeWeeklyPattern(transactions: any[]): number[] {
    const days = transactions.map(t => new Date(t.date).getDay());
    return [...new Set(days)].sort((a, b) => a - b);
  }

  private analyzeMonthlyPattern(transactions: any[]): number[] {
    const days = transactions.map(t => new Date(t.date).getDate());
    return [...new Set(days)].sort((a, b) => a - b);
  }

  private calculateTransactionRisk(transactions: any[], profile: UserBehaviorProfile): number {
    if (transactions.length === 0) return 0;

    let riskScore = 0;
    const largeTransactions = transactions.filter(t => Number(t.amount) > profile.averageTransactionAmount * 2);
    
    riskScore += (largeTransactions.length / transactions.length) * 30;
    
    return Math.min(Math.round(riskScore), 100);
  }

  private calculateBehaviorRisk(profile: UserBehaviorProfile): number {
    // Lower risk for users with established patterns
    const patternScore = Math.max(0, 50 - profile.commonMerchants.length * 2);
    return Math.min(Math.round(patternScore), 100);
  }

  private async calculateAccountRisk(userId: string): Promise<number> {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
    });

    let riskScore = 0;
    
    // Risk increases with more accounts (potential for more attack vectors)
    riskScore += Math.min(accounts.length * 5, 25);
    
    // Risk increases if accounts haven't been synced recently
    const staleAccounts = accounts.filter(acc => 
      !acc.lastSyncAt || 
      (new Date().getTime() - acc.lastSyncAt.getTime()) > 7 * 24 * 60 * 60 * 1000
    );
    
    riskScore += (staleAccounts.length / accounts.length) * 25;
    
    return Math.min(Math.round(riskScore), 100);
  }

  private calculateTimeRisk(transactions: any[]): number {
    if (transactions.length === 0) return 0;

    const nightTransactions = transactions.filter(t => {
      const hour = new Date(t.date).getHours();
      return hour < 6 || hour > 22;
    });

    return Math.min(Math.round((nightTransactions.length / transactions.length) * 100), 100);
  }

  private calculateLocationRisk(transactions: any[], profile: UserBehaviorProfile): number {
    if (transactions.length === 0) return 0;

    const unknownLocationTransactions = transactions.filter(t => 
      t.location && !profile.commonLocations.includes(t.location)
    );

    return Math.min(Math.round((unknownLocationTransactions.length / transactions.length) * 100), 100);
  }
}