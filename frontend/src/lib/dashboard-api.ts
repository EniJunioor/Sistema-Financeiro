import { apiClient } from './api';
import type { DashboardData, FinancialSummary, TrendAnalysis, PeriodComparison } from '@/types/dashboard';

export interface AnalyticsQuery {
  period?: '7d' | '30d' | '90d' | '1y' | 'current_month' | 'current_year' | 'custom';
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'category' | 'account';
  accountIds?: string[];
  categoryIds?: string[];
  transactionTypes?: string[];
}

export class DashboardAPI {
  static async getDashboardData(query: AnalyticsQuery = {}): Promise<DashboardData> {
    const response = await apiClient.get<DashboardData>('/reports/dashboard', { params: query });
    return response.data;
  }

  static async getFinancialSummary(query: AnalyticsQuery = {}): Promise<FinancialSummary> {
    const response = await apiClient.get<FinancialSummary>('/reports/financial-summary', { params: query });
    return response.data;
  }

  static async getTrendAnalysis(query: AnalyticsQuery = {}): Promise<TrendAnalysis> {
    const response = await apiClient.get<TrendAnalysis>('/reports/trends', { params: query });
    return response.data;
  }

  static async getPeriodComparison(query: AnalyticsQuery = {}): Promise<PeriodComparison> {
    const response = await apiClient.get<PeriodComparison>('/reports/period-comparison', { params: query });
    return response.data;
  }

  static async getFinancialOverview() {
    const response = await apiClient.get('/reports/overview');
    return response.data;
  }

  static async getCashFlowAnalysis(months: number = 12) {
    const response = await apiClient.get('/reports/cash-flow', { params: { months } });
    return response.data;
  }

  static async getSpendingPatterns() {
    const response = await apiClient.get('/reports/spending-patterns');
    return response.data;
  }

  static async getTransactionsByPeriod(query: AnalyticsQuery = {}) {
    const response = await apiClient.get('/reports/transactions-by-period', { params: query });
    return response.data;
  }
}