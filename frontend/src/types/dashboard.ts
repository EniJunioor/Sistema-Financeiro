export interface DashboardData {
  summary: FinancialSummary;
  trends: TrendAnalysis;
  periodComparison: PeriodComparison;
  recentTransactions: Transaction[];
  goals: Goal[];
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  totalBalance: number;
  transactionCount: number;
  averageTransactionAmount: number;
  largestExpense: number;
  largestIncome: number;
  categoryBreakdown: CategoryBreakdown[];
  accountSummary: AccountSummary[];
  periodStart: string;
  periodEnd: string;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color?: string;
}

export interface AccountSummary {
  accountId: string;
  accountName: string;
  accountType: string;
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}

export interface TrendAnalysis {
  monthlyTrends: MonthlyTrend[];
  predictions: Prediction[];
  volatility: number;
  growthRate: number;
  seasonality: SeasonalityData[];
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  netIncome: number;
  transactionCount: number;
}

export interface Prediction {
  month: string;
  predictedIncome: number;
  predictedExpenses: number;
  confidence: number;
}

export interface SeasonalityData {
  period: string;
  averageIncome: number;
  averageExpenses: number;
  variance: number;
}

export interface PeriodComparison {
  current: PeriodData;
  previous: PeriodData;
  changes: {
    incomeChange: number;
    expenseChange: number;
    netIncomeChange: number;
    balanceChange: number;
    incomeChangePercent: number;
    expenseChangePercent: number;
    netIncomeChangePercent: number;
    balanceChangePercent: number;
  };
  insights: string[];
}

export interface PeriodData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  totalBalance: number;
  transactionCount: number;
  periodStart: string;
  periodEnd: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  type: 'savings' | 'spending_limit' | 'investment';
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  progress: number;
  isActive: boolean;
  categoryId?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  categoryName?: string;
  accountName?: string;
  accountType?: 'checking' | 'savings' | 'credit_card' | 'investment';
  categoryColor?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  income?: number;
  expenses?: number;
  netIncome?: number;
}

export interface PeriodOption {
  value: string;
  label: string;
  startDate?: string;
  endDate?: string;
}

export interface WebSocketMessage {
  type: 'transaction_created' | 'transaction_updated' | 'transaction_deleted' | 'balance_updated';
  data: any;
  timestamp: string;
}

// AI Forecasting Types
export interface AIForecast {
  spendingPredictions: SpendingPrediction[];
  incomePredictions: IncomePrediction[];
  categoryForecasts: CategoryForecast[];
  anomalies: AnomalyDetection[];
  seasonalAdjustments: SeasonalAdjustment[];
  confidenceScore: number;
  modelAccuracy: number;
  insights: string[];
  forecastPeriodMonths: number;
  generatedAt: string;
}

export interface SpendingPrediction {
  date: string;
  predictedAmount: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  factors: string[];
}

export interface IncomePrediction {
  date: string;
  predictedAmount: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  growthRate: number;
}

export interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  predictedAmount: number;
  historicalAverage: number;
  volatility: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendedBudget: number;
}

export interface AnomalyDetection {
  date: string;
  actualAmount: number;
  expectedAmount: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  type: 'spike' | 'drop';
  confidence: number;
}

export interface SeasonalAdjustment {
  month: number;
  monthName: string;
  seasonalFactor: number;
  adjustment: number;
  adjustmentPercentage: number;
  confidence: number;
}

export interface ForecastChartData {
  date: string;
  historical?: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  type: 'income' | 'expense';
}