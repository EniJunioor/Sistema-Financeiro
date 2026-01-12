import { api } from './api';
import type {
  Investment,
  PortfolioSummary,
  AssetAllocation,
  PerformanceMetrics,
  RiskMetrics,
  DiversificationMetrics,
  BenchmarkComparison,
  RebalancingRecommendation,
  CreateInvestmentDto,
  UpdateInvestmentDto,
  InvestmentFilters,
  PortfolioAnalysis,
  InvestmentType
} from '@/types/investment';

export interface InvestmentStats {
  totalInvestments: number;
  totalTransactions: number;
  typeDistribution: Record<string, number>;
  brokerDistribution: Record<string, number>;
  sectorDistribution: Record<string, number>;
}

export const investmentsApi = {
  // Investment CRUD operations
  async getInvestments(filters?: InvestmentFilters): Promise<Investment[]> {
    const params = new URLSearchParams();
    if (filters?.types?.length) {
      filters.types.forEach(type => params.append('types', type));
    }
    if (filters?.broker) params.append('broker', filters.broker);
    if (filters?.sector) params.append('sector', filters.sector);
    if (filters?.currency) params.append('currency', filters.currency);

    const queryString = params.toString();
    const url = queryString ? `/investments?${queryString}` : '/investments';
    
    const response = await api.get<Investment[]>(url);
    return response.data;
  },

  async getInvestment(id: string): Promise<Investment> {
    const response = await api.get<Investment>(`/investments/${id}`);
    return response.data;
  },

  async createInvestment(data: CreateInvestmentDto): Promise<Investment> {
    const response = await api.post<Investment>('/investments', data);
    return response.data;
  },

  async updateInvestment(id: string, data: UpdateInvestmentDto): Promise<Investment> {
    const response = await api.patch<Investment>(`/investments/${id}`, data);
    return response.data;
  },

  async deleteInvestment(id: string): Promise<void> {
    await api.delete(`/investments/${id}`);
  },

  // Portfolio operations
  async getPortfolio(filters?: InvestmentFilters): Promise<PortfolioSummary> {
    const params = new URLSearchParams();
    if (filters?.types?.length) {
      filters.types.forEach(type => params.append('types', type));
    }
    if (filters?.broker) params.append('broker', filters.broker);
    if (filters?.sector) params.append('sector', filters.sector);
    if (filters?.currency) params.append('currency', filters.currency);

    const queryString = params.toString();
    const url = queryString ? `/investments/portfolio?${queryString}` : '/investments/portfolio';
    
    const response = await api.get<PortfolioSummary>(url);
    return response.data;
  },

  async getAssetAllocation(): Promise<AssetAllocation> {
    const response = await api.get<AssetAllocation>('/investments/allocation');
    return response.data;
  },

  async getPerformanceMetrics(startDate?: string, endDate?: string): Promise<PerformanceMetrics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = queryString ? `/investments/performance?${queryString}` : '/investments/performance';
    
    const response = await api.get<PerformanceMetrics>(url);
    return response.data;
  },

  async getInvestmentStats(): Promise<InvestmentStats> {
    const response = await api.get<InvestmentStats>('/investments/stats');
    return response.data;
  },

  // Analysis operations
  async getDiversificationMetrics(): Promise<DiversificationMetrics> {
    const response = await api.get<DiversificationMetrics>('/investments/analysis/diversification');
    return response.data;
  },

  async getRiskMetrics(): Promise<RiskMetrics> {
    const response = await api.get<RiskMetrics>('/investments/analysis/risk');
    return response.data;
  },

  async getBenchmarkComparison(): Promise<BenchmarkComparison> {
    const response = await api.get<BenchmarkComparison>('/investments/analysis/benchmarks');
    return response.data;
  },

  async getPortfolioAnalysis(): Promise<PortfolioAnalysis> {
    const [portfolio, diversification, risk, benchmarks] = await Promise.all([
      this.getPortfolio(),
      this.getDiversificationMetrics(),
      this.getRiskMetrics(),
      this.getBenchmarkComparison()
    ]);

    return {
      portfolio,
      diversificationMetrics: diversification,
      riskMetrics: risk,
      benchmarkComparison: benchmarks,
      lastUpdated: new Date().toISOString()
    };
  },

  // Rebalancing operations
  async getRebalancingRecommendations(targetAllocation: Record<string, number>): Promise<RebalancingRecommendation> {
    const response = await api.post<RebalancingRecommendation>('/investments/rebalance', targetAllocation);
    return response.data;
  },

  async getOptimalAllocation(riskTolerance: 'conservative' | 'moderate' | 'aggressive') {
    const response = await api.post('/investments/analysis/optimal-allocation', { riskTolerance });
    return response.data;
  },

  // Quote operations
  async updateQuotes(): Promise<void> {
    await api.post('/investments/quotes/update');
  },

  // Utility operations
  async getSupportedTypes(): Promise<InvestmentType[]> {
    const response = await api.get<InvestmentType[]>('/investments/types');
    return response.data;
  },

  // Transaction operations
  async addTransaction(data: {
    investmentId: string;
    type: 'buy' | 'sell' | 'dividend';
    quantity: number;
    price: number;
    fees?: number;
    date: string;
  }) {
    const response = await api.post('/investments/transactions', data);
    return response.data;
  }
};