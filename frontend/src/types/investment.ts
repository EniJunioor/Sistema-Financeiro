export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  weight: number;
  currency: string;
  broker?: string;
  sector?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentTransaction {
  id: string;
  investmentId: string;
  type: 'buy' | 'sell' | 'dividend';
  quantity: number;
  price: number;
  fees?: number;
  date: string;
  createdAt: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  currency: string;
  lastUpdated: string;
  investments: Investment[];
}

export interface AssetAllocation {
  byType: AllocationItem[];
  bySector: AllocationItem[];
  byBroker: AllocationItem[];
  byCurrency: AllocationItem[];
}

export interface AllocationItem {
  name: string;
  value: number;
  percentage: number;
  count: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestDay: number;
  worstDay: number;
  winRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface RiskMetrics {
  var95: VaRCalculation;
  var99: VaRCalculation;
  cvar95: number;
  cvar99: number;
  volatility: number;
  downsideDeviation: number;
  maxDrawdown: number;
  sortinoRatio: number;
  beta: number;
  riskScore: number;
}

export interface VaRCalculation {
  value: number;
  amount: number;
  confidenceLevel: number;
}

export interface DiversificationMetrics {
  herfindahlIndex: number;
  effectiveNumberOfAssets: number;
  diversificationRatio: number;
  sectorConcentration: number;
  geographicConcentration: number;
  concentrationRisk: 'low' | 'medium' | 'high';
  diversificationScore: number;
}

export interface BenchmarkComparison {
  comparisons: BenchmarkMetrics[];
  bestPerformingBenchmark: string;
  relativePerformance: number;
}

export interface BenchmarkMetrics {
  benchmarkName: string;
  benchmarkSymbol: string;
  correlation: number;
  alpha: number;
  beta: number;
  trackingError: number;
  informationRatio: number;
  outperformance: number;
}

export interface RebalancingRecommendation {
  currentAllocation: AllocationItem[];
  targetAllocation: AllocationItem[];
  recommendations: RebalancingAction[];
  totalRebalanceAmount: number;
}

export interface RebalancingAction {
  symbol: string;
  action: 'buy' | 'sell';
  currentWeight: number;
  targetWeight: number;
  suggestedAmount: number;
  suggestedQuantity: number;
}

export type InvestmentType = 'stock' | 'fund' | 'etf' | 'crypto' | 'bond' | 'derivative';

export interface CreateInvestmentDto {
  symbol: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  averagePrice: number;
  currency?: string;
  broker?: string;
  sector?: string;
}

export interface UpdateInvestmentDto {
  name?: string;
  broker?: string;
  sector?: string;
}

export interface InvestmentFilters {
  types?: InvestmentType[];
  broker?: string;
  sector?: string;
  currency?: string;
}

export interface PortfolioAnalysis {
  portfolio: PortfolioSummary;
  diversificationMetrics: DiversificationMetrics;
  riskMetrics: RiskMetrics;
  benchmarkComparison: BenchmarkComparison;
  lastUpdated: string;
}