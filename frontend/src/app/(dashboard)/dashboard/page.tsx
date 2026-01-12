'use client';

import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/use-dashboard';
import { FinancialSummaryCards } from '@/components/dashboard/financial-summary-cards';
import { PeriodSelector } from '@/components/dashboard/period-selector';
import { FinancialOverviewChart } from '@/components/charts/financial-overview-chart';
import { CategoryBreakdownChart } from '@/components/charts/category-breakdown-chart';
import { ExpenseTrendChart } from '@/components/charts/expense-trend-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { GoalsProgress } from '@/components/dashboard/goals-progress';
import { RealtimeStatus } from '@/components/dashboard/realtime-status';
import { AIForecastDashboard } from '@/components/dashboard/ai-forecast-dashboard';

function DashboardContent() {
  const {
    dashboardData,
    isLoading,
    error,
    refetch,
    query,
    setPeriod,
    setCustomDateRange,
  } = useDashboard({ period: '30d' });

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Visão geral das suas finanças
            </p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                API não disponível
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Usando dados de demonstração. Para dados reais, faça login ou verifique se o backend está rodando.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mock data for development - replace with real data when backend is connected
  const mockSummary = {
    totalIncome: 12234,
    totalExpenses: 8573,
    netIncome: 3661,
    totalBalance: 45231.89,
    transactionCount: 47,
    averageTransactionAmount: 182.5,
    largestExpense: 1200,
    largestIncome: 5000,
    categoryBreakdown: [
      { categoryId: '1', categoryName: 'Alimentação', amount: 2500, percentage: 29.2, transactionCount: 15, color: '#ef4444' },
      { categoryId: '2', categoryName: 'Transporte', amount: 1800, percentage: 21.0, transactionCount: 8, color: '#3b82f6' },
      { categoryId: '3', categoryName: 'Moradia', amount: 1500, percentage: 17.5, transactionCount: 3, color: '#10b981' },
      { categoryId: '4', categoryName: 'Lazer', amount: 1200, percentage: 14.0, transactionCount: 12, color: '#f59e0b' },
      { categoryId: '5', categoryName: 'Saúde', amount: 800, percentage: 9.3, transactionCount: 4, color: '#8b5cf6' },
      { categoryId: '6', categoryName: 'Outros', amount: 773, percentage: 9.0, transactionCount: 5, color: '#06b6d4' },
    ],
    accountSummary: [],
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
  };

  const mockTrends = {
    monthlyTrends: [
      { month: '2023-07', income: 10000, expenses: 7500, netIncome: 2500, transactionCount: 35 },
      { month: '2023-08', income: 11000, expenses: 8200, netIncome: 2800, transactionCount: 42 },
      { month: '2023-09', income: 10500, expenses: 7800, netIncome: 2700, transactionCount: 38 },
      { month: '2023-10', income: 12000, expenses: 8500, netIncome: 3500, transactionCount: 45 },
      { month: '2023-11', income: 11500, expenses: 8000, netIncome: 3500, transactionCount: 40 },
      { month: '2023-12', income: 13000, expenses: 9200, netIncome: 3800, transactionCount: 48 },
      { month: '2024-01', income: 12234, expenses: 8573, netIncome: 3661, transactionCount: 47 },
    ],
    predictions: [],
    volatility: 0.15,
    growthRate: 0.08,
    seasonality: [],
  };

  const mockComparison = {
    current: {
      totalIncome: 12234,
      totalExpenses: 8573,
      netIncome: 3661,
      totalBalance: 45231.89,
      transactionCount: 47,
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
    },
    previous: {
      totalIncome: 11500,
      totalExpenses: 8000,
      netIncome: 3500,
      totalBalance: 41570,
      transactionCount: 40,
      periodStart: '2023-12-01',
      periodEnd: '2023-12-31',
    },
    changes: {
      incomeChange: 734,
      expenseChange: 573,
      netIncomeChange: 161,
      balanceChange: 3661.89,
      incomeChangePercent: 6.4,
      expenseChangePercent: 7.2,
      netIncomeChangePercent: 4.6,
      balanceChangePercent: 8.8,
    },
    insights: [
      'Suas receitas aumentaram 6.4% em relação ao período anterior',
      'Os gastos também cresceram 7.2%, mas ainda dentro do esperado',
      'Seu saldo líquido teve um crescimento saudável de 4.6%',
    ],
  };

  const mockTransactions = [
    {
      id: '1',
      type: 'expense' as const,
      amount: 127.50,
      description: 'Supermercado Extra',
      date: new Date().toISOString(),
      categoryName: 'Alimentação',
      accountName: 'Conta Corrente',
      categoryColor: '#ef4444',
    },
    {
      id: '2',
      type: 'income' as const,
      amount: 5000,
      description: 'Salário',
      date: new Date(Date.now() - 86400000).toISOString(),
      categoryName: 'Salário',
      accountName: 'Conta Corrente',
      categoryColor: '#10b981',
    },
    {
      id: '3',
      type: 'expense' as const,
      amount: 89.30,
      description: 'Conta de Luz - CPFL',
      date: new Date(Date.now() - 172800000).toISOString(),
      categoryName: 'Moradia',
      accountName: 'Conta Corrente',
      categoryColor: '#3b82f6',
    },
    {
      id: '4',
      type: 'expense' as const,
      amount: 45.90,
      description: 'Uber',
      date: new Date(Date.now() - 259200000).toISOString(),
      categoryName: 'Transporte',
      accountName: 'Cartão de Crédito',
      categoryColor: '#f59e0b',
    },
    {
      id: '5',
      type: 'expense' as const,
      amount: 250.00,
      description: 'Farmácia Drogasil',
      date: new Date(Date.now() - 345600000).toISOString(),
      categoryName: 'Saúde',
      accountName: 'Conta Corrente',
      categoryColor: '#8b5cf6',
    },
  ];

  const mockGoals = [
    {
      id: '1',
      name: 'Reserva de Emergência',
      description: 'Meta de 6 meses de gastos para emergências',
      type: 'savings' as const,
      targetAmount: 10000,
      currentAmount: 7500,
      progress: 75,
      targetDate: '2024-06-30',
      isActive: true,
    },
    {
      id: '2',
      name: 'Viagem de Férias',
      description: 'Economizar para viagem de fim de ano',
      type: 'savings' as const,
      targetAmount: 5000,
      currentAmount: 2250,
      progress: 45,
      targetDate: '2024-12-01',
      isActive: true,
    },
    {
      id: '3',
      name: 'Carro Novo',
      description: 'Entrada para financiamento do carro',
      type: 'savings' as const,
      targetAmount: 30000,
      currentAmount: 6000,
      progress: 20,
      targetDate: '2025-03-01',
      isActive: true,
    },
  ];

  // Use real data if available, otherwise use mock data
  const summary = (dashboardData && dashboardData.summary) || mockSummary;
  const trends = (dashboardData && dashboardData.trends) || mockTrends;
  const comparison = (dashboardData && dashboardData.periodComparison) || mockComparison;
  const transactions = (dashboardData && dashboardData.recentTransactions) || mockTransactions;
  const goals = (dashboardData && dashboardData.goals) || mockGoals;

  // Show demo data notice when using mock data
  const isUsingMockData = !dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Visão geral das suas finanças
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <RealtimeStatus />
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Demo Data Notice */}
      {isUsingMockData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 mr-3">ℹ️</div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Dados de Demonstração
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Você está visualizando dados de exemplo. Para ver seus dados reais, faça login ou conecte suas contas bancárias.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <PeriodSelector
            currentPeriod={query.period}
            startDate={query.startDate}
            endDate={query.endDate}
            onPeriodChange={setPeriod}
            onCustomDateChange={setCustomDateRange}
          />
        </div>
        
        {/* Summary Cards */}
        <div className="lg:col-span-3">
          <FinancialSummaryCards
            summary={summary}
            comparison={comparison}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialOverviewChart
          data={trends.monthlyTrends}
          isLoading={isLoading}
        />
        <ExpenseTrendChart
          data={trends.monthlyTrends}
          isLoading={isLoading}
        />
      </div>

      {/* Category Breakdown and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CategoryBreakdownChart
          data={summary.categoryBreakdown}
          isLoading={isLoading}
        />
        <RecentTransactions
          transactions={transactions}
          isLoading={isLoading}
        />
        <GoalsProgress />
      </div>

      {/* AI Forecasting Section */}
      <div className="mt-8">
        <AIForecastDashboard 
          historicalData={trends.monthlyTrends}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}