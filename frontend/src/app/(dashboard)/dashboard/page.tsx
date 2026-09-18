'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/use-dashboard';
import { AccountHeaderSection } from '@/components/dashboard/account-header-section';
import { FinancialMetricsCards } from '@/components/dashboard/financial-metrics-cards';
import { CashFlowSection } from '@/components/dashboard/cash-flow-section';
import { SubscriptionsSection } from '@/components/dashboard/subscriptions-section';

function DashboardContent() {
  const router = useRouter();
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
      <div className="space-y-4 md:space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <div className="flex items-start sm:items-center">
            <div className="text-red-600 mr-2 sm:mr-3 text-lg sm:text-xl flex-shrink-0">⚠️</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-medium text-red-800">
                Não foi possível carregar o dashboard
              </h3>
              <p className="text-xs sm:text-sm text-red-700 mt-1">
                {(error as Error)?.message ??
                  'Verifique sua conexão ou se o backend está rodando.'}
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 text-xs sm:text-sm font-medium text-red-800 underline underline-offset-2 hover:text-red-900"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enquanto a primeira carga não chega, os componentes filhos exibem seus
  // próprios skeletons a partir de isLoading — por isso os zeros abaixo nunca
  // aparecem como número real na tela.
  const summary = dashboardData?.summary;
  const trends = dashboardData?.trends;
  const comparison = dashboardData?.periodComparison;

  const cashFlowData = (trends?.monthlyTrends ?? []).map((trend) => ({
    name: new Date(trend.month).toLocaleDateString('pt-BR', { weekday: 'short' }),
    value: trend.netIncome,
  }));

  return (
    <div className="space-y-6 md:space-y-8 pb-6 md:pb-8 bg-gray-900 min-h-screen -m-4 md:-m-6 p-4 md:p-6">
      {/* Account Header Section */}
      <AccountHeaderSection
        onManageBalance={() => router.push('/accounts')}
        onNewPayment={() => router.push('/transactions')}
      />

      {/* Financial Metrics Cards */}
      <FinancialMetricsCards
        totalBalance={summary?.totalBalance ?? 0}
        monthlyIncome={summary?.totalIncome ?? 0}
        monthlyExpense={summary?.totalExpenses ?? 0}
        balanceChange={comparison?.changes.balanceChangePercent}
        incomeChange={comparison?.changes.incomeChangePercent}
        expenseChange={comparison?.changes.expenseChangePercent}
        isLoading={isLoading}
      />

      {/* Cash Flow and Subscriptions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <CashFlowSection data={cashFlowData} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <SubscriptionsSection onAdd={() => router.push('/subscriptions')} />
        </div>
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