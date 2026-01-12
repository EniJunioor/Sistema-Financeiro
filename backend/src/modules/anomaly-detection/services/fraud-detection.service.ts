import { Injectable, Logger } from '@nestjs/common';
import {
  MLModelFeatures,
  UserBehaviorProfile,
  FraudDetectionRule,
} from '../interfaces/anomaly.interface';

interface FraudDetectionResult {
  isFraud: boolean;
  confidence: number;
  primaryReason: 'amount' | 'frequency' | 'location' | 'merchant' | 'time' | 'pattern' | null;
  reasons: string[];
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);
  private readonly fraudRules: FraudDetectionRule[] = [];

  constructor() {
    this.initializeFraudRules();
  }

  async detectFraud(
    features: MLModelFeatures,
    profile: UserBehaviorProfile,
  ): Promise<FraudDetectionResult> {
    try {
      const results: Array<{
        rule: FraudDetectionRule;
        triggered: boolean;
        confidence: number;
      }> = [];

      // Apply all fraud detection rules
      for (const rule of this.fraudRules) {
        if (!rule.isActive) continue;

        const triggered = rule.condition(features, profile);
        const confidence = this.calculateRuleConfidence(rule, features, profile);

        results.push({
          rule,
          triggered,
          confidence: triggered ? confidence : 0,
        });
      }

      // Filter triggered rules
      const triggeredRules = results.filter(r => r.triggered);

      if (triggeredRules.length === 0) {
        return {
          isFraud: false,
          confidence: 0,
          primaryReason: null,
          reasons: [],
        };
      }

      // Calculate overall confidence
      const maxConfidence = Math.max(...triggeredRules.map(r => r.confidence));
      const avgConfidence = triggeredRules.reduce((sum, r) => sum + r.confidence, 0) / triggeredRules.length;
      const overallConfidence = (maxConfidence * 0.7) + (avgConfidence * 0.3);

      // Determine primary reason
      const primaryRule = triggeredRules.reduce((max, current) => 
        current.confidence > max.confidence ? current : max
      );

      const primaryReason = this.mapRuleToPrimaryReason(primaryRule.rule);

      return {
        isFraud: overallConfidence > 0.5,
        confidence: overallConfidence,
        primaryReason,
        reasons: triggeredRules.map(r => r.rule.description),
      };
    } catch (error) {
      this.logger.error(`Error in fraud detection: ${error.message}`, error.stack);
      return {
        isFraud: false,
        confidence: 0,
        primaryReason: null,
        reasons: [],
      };
    }
  }

  private initializeFraudRules(): void {
    this.fraudRules.push(
      // Large amount anomaly
      {
        id: 'large-amount-anomaly',
        name: 'Large Amount Anomaly',
        description: 'Transaction amount significantly exceeds user\'s typical spending',
        condition: (features, profile) => {
          return features.amount > profile.averageTransactionAmount * 5 &&
                 features.amountDeviationFromAverage > 3;
        },
        severity: 'high',
        isActive: true,
      },

      // Velocity fraud (too many transactions)
      {
        id: 'velocity-fraud',
        name: 'High Transaction Velocity',
        description: 'Unusually high number of transactions in short time period',
        condition: (features) => {
          return features.consecutiveTransactions > 10 ||
                 (features.consecutiveTransactions > 5 && features.timeSinceLastTransaction < 0.5);
        },
        severity: 'critical',
        isActive: true,
      },

      // Geographic anomaly
      {
        id: 'geographic-anomaly',
        name: 'Geographic Anomaly',
        description: 'Transaction in unusual location with large amount',
        condition: (features, profile) => {
          return features.isNewLocation && 
                 features.amount > profile.averageTransactionAmount * 2 &&
                 features.locationFrequency === 0;
        },
        severity: 'medium',
        isActive: true,
      },

      // Time-based anomaly
      {
        id: 'time-anomaly',
        name: 'Unusual Time Pattern',
        description: 'Transaction at highly unusual time with suspicious characteristics',
        condition: (features, profile) => {
          const isVeryLateOrEarly = features.hourOfDay < 4 || features.hourOfDay > 23;
          const isUnusualTime = !profile.typicalTransactionTimes.includes(features.hourOfDay);
          return isVeryLateOrEarly && isUnusualTime && 
                 features.amount > profile.averageTransactionAmount * 1.5;
        },
        severity: 'medium',
        isActive: true,
      },

      // New merchant with large amount
      {
        id: 'new-merchant-large-amount',
        name: 'New Merchant Large Transaction',
        description: 'Large transaction with previously unseen merchant',
        condition: (features, profile) => {
          return features.isNewMerchant && 
                 features.amount > profile.averageTransactionAmount * 3 &&
                 features.merchantFrequency === 0;
        },
        severity: 'medium',
        isActive: true,
      },

      // Round number fraud (common in card testing)
      {
        id: 'round-number-pattern',
        name: 'Round Number Pattern',
        description: 'Multiple round number transactions suggesting card testing',
        condition: (features) => {
          const isRoundNumber = features.amount % 10 === 0 || features.amount % 100 === 0;
          return isRoundNumber && features.consecutiveTransactions > 3 && features.amount < 50;
        },
        severity: 'high',
        isActive: true,
      },

      // Weekend large transaction anomaly
      {
        id: 'weekend-large-transaction',
        name: 'Weekend Large Transaction',
        description: 'Unusually large transaction during weekend',
        condition: (features, profile) => {
          return features.isWeekend && 
                 features.amount > profile.averageTransactionAmount * 4 &&
                 !profile.weeklyPattern.includes(features.dayOfWeek);
        },
        severity: 'low',
        isActive: true,
      },

      // Rapid successive transactions
      {
        id: 'rapid-successive-transactions',
        name: 'Rapid Successive Transactions',
        description: 'Multiple transactions within minutes',
        condition: (features) => {
          return features.timeSinceLastTransaction < 0.1 && // Less than 6 minutes
                 features.consecutiveTransactions > 2;
        },
        severity: 'high',
        isActive: true,
      },

      // Micro-transaction pattern (potential card testing)
      {
        id: 'micro-transaction-pattern',
        name: 'Micro Transaction Pattern',
        description: 'Pattern of very small transactions suggesting card validation',
        condition: (features, profile) => {
          return features.amount < 5 && 
                 features.consecutiveTransactions > 5 &&
                 features.amount < profile.averageTransactionAmount * 0.1;
        },
        severity: 'critical',
        isActive: true,
      },

      // Extreme deviation from normal behavior
      {
        id: 'extreme-behavior-deviation',
        name: 'Extreme Behavior Deviation',
        description: 'Transaction pattern completely outside normal behavior',
        condition: (features, profile) => {
          return features.amountDeviationFromAverage > 4 &&
                 features.isNewMerchant &&
                 features.isNewLocation &&
                 !profile.typicalTransactionTimes.includes(features.hourOfDay);
        },
        severity: 'critical',
        isActive: true,
      },
    );

    this.logger.log(`Initialized ${this.fraudRules.length} fraud detection rules`);
  }

  private calculateRuleConfidence(
    rule: FraudDetectionRule,
    features: MLModelFeatures,
    profile: UserBehaviorProfile,
  ): number {
    // Base confidence based on rule severity
    let confidence = 0;
    switch (rule.severity) {
      case 'critical':
        confidence = 0.9;
        break;
      case 'high':
        confidence = 0.75;
        break;
      case 'medium':
        confidence = 0.6;
        break;
      case 'low':
        confidence = 0.4;
        break;
    }

    // Adjust confidence based on specific features
    switch (rule.id) {
      case 'large-amount-anomaly':
        // Higher confidence for larger deviations
        confidence = Math.min(0.95, confidence + (features.amountDeviationFromAverage - 3) * 0.05);
        break;

      case 'velocity-fraud':
        // Higher confidence for more consecutive transactions
        confidence = Math.min(0.95, confidence + (features.consecutiveTransactions - 5) * 0.02);
        break;

      case 'geographic-anomaly':
        // Higher confidence if amount is much larger than average
        const amountMultiplier = features.amount / profile.averageTransactionAmount;
        confidence = Math.min(0.9, confidence + (amountMultiplier - 2) * 0.05);
        break;

      case 'time-anomaly':
        // Higher confidence for very unusual hours
        if (features.hourOfDay < 2 || features.hourOfDay > 23) {
          confidence += 0.1;
        }
        break;

      case 'extreme-behavior-deviation':
        // Very high confidence for extreme deviations
        confidence = Math.min(0.98, confidence + (features.amountDeviationFromAverage - 4) * 0.02);
        break;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private mapRuleToPrimaryReason(
    rule: FraudDetectionRule,
  ): 'amount' | 'frequency' | 'location' | 'merchant' | 'time' | 'pattern' {
    switch (rule.id) {
      case 'large-amount-anomaly':
        return 'amount';
      case 'velocity-fraud':
      case 'rapid-successive-transactions':
      case 'micro-transaction-pattern':
        return 'frequency';
      case 'geographic-anomaly':
        return 'location';
      case 'new-merchant-large-amount':
        return 'merchant';
      case 'time-anomaly':
      case 'weekend-large-transaction':
        return 'time';
      default:
        return 'pattern';
    }
  }

  // Method to add custom rules (for future extensibility)
  addCustomRule(rule: FraudDetectionRule): void {
    this.fraudRules.push(rule);
    this.logger.log(`Added custom fraud rule: ${rule.name}`);
  }

  // Method to disable/enable rules
  toggleRule(ruleId: string, isActive: boolean): void {
    const rule = this.fraudRules.find(r => r.id === ruleId);
    if (rule) {
      rule.isActive = isActive;
      this.logger.log(`${isActive ? 'Enabled' : 'Disabled'} fraud rule: ${rule.name}`);
    }
  }

  // Get all rules (for admin interface)
  getAllRules(): FraudDetectionRule[] {
    return [...this.fraudRules];
  }
}