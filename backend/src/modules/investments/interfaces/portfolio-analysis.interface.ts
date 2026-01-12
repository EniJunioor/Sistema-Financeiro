import { PortfolioSummary, AllocationItem } from './investment.interface';

export interface PortfolioAnalysis {
  portfolio: PortfolioSummary;
  diversificationMetrics: DiversificationMetrics;
  riskMetrics: RiskMetrics;
  benchmarkComparison: BenchmarkComparison;
  correlationMatrix: CorrelationMatrix;
  lastUpdated: Date;
}

export interface DiversificationMetrics {
  herfindahlIndex: number; // Concentration index (0-1, lower is better diversified)
  effectiveNumberOfAssets: number; // Effective number of assets in portfolio
  diversificationRatio: number; // Ratio of weighted average volatility to portfolio volatility
  sectorConcentration: number; // Sector concentration index
  geographicConcentration: number; // Geographic concentration index
  concentrationRisk: 'low' | 'medium' | 'high';
  diversificationScore: number; // Overall diversification score (0-100)
}

export interface RiskMetrics {
  var95: VaRCalculation; // Value at Risk at 95% confidence
  var99: VaRCalculation; // Value at Risk at 99% confidence
  cvar95: number; // Conditional VaR at 95%
  cvar99: number; // Conditional VaR at 99%
  volatility: number; // Annualized volatility (%)
  downsideDeviation: number; // Downside deviation (%)
  maxDrawdown: number; // Maximum drawdown (%)
  sortinoRatio: number; // Sortino ratio
  beta: number; // Portfolio beta vs market
  riskScore: number; // Overall risk score (0-100)
}

export interface VaRCalculation {
  value: number; // VaR as percentage
  amount: number; // VaR in currency amount
  confidenceLevel: number; // Confidence level (95 or 99)
}

export interface BenchmarkComparison {
  comparisons: BenchmarkMetrics[];
  bestPerformingBenchmark: string;
  relativePerformance: number; // Average outperformance vs benchmarks
}

export interface BenchmarkMetrics {
  benchmarkName: string;
  benchmarkSymbol: string;
  correlation: number; // Correlation with benchmark
  alpha: number; // Alpha vs benchmark (%)
  beta: number; // Beta vs benchmark
  trackingError: number; // Tracking error (%)
  informationRatio: number; // Information ratio
  outperformance: number; // Outperformance vs benchmark (%)
}

export interface CorrelationMatrix {
  correlations: AssetCorrelation[];
  averageCorrelation: number;
}

export interface AssetCorrelation {
  asset1: string;
  asset2: string;
  correlation: number;
  weight1: number; // Portfolio weight of asset1
  weight2: number; // Portfolio weight of asset2
}

export interface OptimalAllocation {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  targetAllocations: TargetAllocation[];
  currentAllocation: AllocationItem[];
  rebalancingActions: AllocationAction[];
  expectedReturn: number; // Expected annual return (%)
  expectedRisk: number; // Expected annual risk (%)
  sharpeRatio: number; // Expected Sharpe ratio
}

export interface TargetAllocation {
  assetClass: string;
  percentage: number;
}

export interface AllocationAction {
  assetClass: string;
  currentPercentage: number;
  targetPercentage: number;
  difference: number;
  suggestedAmount: number;
  action: 'buy' | 'sell';
}

export interface RebalancingStrategy {
  recommendations: RebalancingRecommendation[];
  estimatedCosts: number;
  taxImplications: number;
  prioritizedActions: PrioritizedAction[];
  totalRebalanceAmount: number;
  implementationOrder: string[];
}

export interface RebalancingRecommendation {
  symbol: string;
  action: 'buy' | 'sell';
  currentWeight: number;
  targetWeight: number;
  suggestedAmount: number;
  suggestedQuantity: number;
}

export interface PrioritizedAction extends RebalancingRecommendation {
  priority: number; // Higher number = higher priority
}

// Risk tolerance profiles
export interface RiskProfile {
  name: 'conservative' | 'moderate' | 'aggressive';
  description: string;
  expectedReturn: number; // Annual expected return (%)
  expectedVolatility: number; // Annual expected volatility (%)
  maxDrawdown: number; // Maximum acceptable drawdown (%)
  timeHorizon: number; // Investment time horizon in years
  targetAllocations: TargetAllocation[];
}

// Portfolio optimization inputs
export interface OptimizationConstraints {
  minWeight?: { [symbol: string]: number }; // Minimum weight per asset
  maxWeight?: { [symbol: string]: number }; // Maximum weight per asset
  maxSectorWeight?: { [sector: string]: number }; // Maximum weight per sector
  excludeAssets?: string[]; // Assets to exclude from optimization
  riskBudget?: number; // Maximum portfolio risk
  turnoverLimit?: number; // Maximum turnover allowed
}

// Monte Carlo simulation results
export interface MonteCarloResults {
  scenarios: number;
  timeHorizon: number; // Years
  percentiles: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  probabilityOfLoss: number; // Probability of negative returns
  expectedValue: number;
  standardDeviation: number;
}

// Stress testing scenarios
export interface StressTestScenario {
  name: string;
  description: string;
  shocks: { [assetClass: string]: number }; // Percentage shocks by asset class
  portfolioImpact: number; // Expected portfolio impact (%)
  recoveryTime: number; // Expected recovery time in months
}

export interface StressTestResults {
  scenarios: StressTestScenario[];
  worstCaseScenario: string;
  averageImpact: number;
  resilience: 'low' | 'medium' | 'high';
}