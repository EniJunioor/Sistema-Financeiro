export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  confidence: number; // 0-1 scale
  severity: 'low' | 'medium' | 'high' | 'critical';
  anomalyType: 'amount' | 'frequency' | 'location' | 'merchant' | 'time' | 'pattern';
  reasons: string[];
  riskScore: number; // 0-100 scale
  recommendations: string[];
}

export interface UserBehaviorProfile {
  userId: string;
  averageTransactionAmount: number;
  medianTransactionAmount: number;
  standardDeviation: number;
  commonMerchants: string[];
  commonLocations: string[];
  commonCategories: string[];
  typicalTransactionTimes: number[]; // Hours of day (0-23)
  weeklyPattern: number[]; // Days of week (0-6)
  monthlySpendingPattern: number[]; // Days of month (1-31)
  lastUpdated: Date;
}

export interface AnomalyAlert {
  id: string;
  userId: string;
  transactionId?: string;
  type: 'fraud_detection' | 'unusual_spending' | 'goal_risk' | 'account_security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: Record<string, any>;
  isAcknowledged: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
}

export interface MLModelFeatures {
  amount: number;
  hourOfDay: number;
  dayOfWeek: number;
  dayOfMonth: number;
  isWeekend: boolean;
  merchantFrequency: number;
  locationFrequency: number;
  categoryFrequency: number;
  timeSinceLastTransaction: number; // in hours
  amountDeviationFromAverage: number;
  isNewMerchant: boolean;
  isNewLocation: boolean;
  consecutiveTransactions: number;
}

export interface FraudDetectionRule {
  id: string;
  name: string;
  description: string;
  condition: (features: MLModelFeatures, profile: UserBehaviorProfile) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
}

export interface RiskScoreComponents {
  transactionRisk: number;
  behaviorRisk: number;
  accountRisk: number;
  timeRisk: number;
  locationRisk: number;
  overallRisk: number;
}