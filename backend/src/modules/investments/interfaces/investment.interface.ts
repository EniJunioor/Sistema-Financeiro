export interface QuoteProvider {
  name: string;
  getQuote(symbol: string, type: string): Promise<QuoteData | null>;
  isSupported(symbol: string, type: string): boolean;
}

export interface QuoteData {
  symbol: string;
  price: number;
  currency: string;
  timestamp: Date;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  provider: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  currency: string;
  lastUpdated: Date;
  investments: InvestmentSummary[];
}

export interface InvestmentSummary {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  weight: number; // Portfolio weight percentage
  currency: string;
  broker?: string;
  sector?: string;
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
  periodStart: Date;
  periodEnd: Date;
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