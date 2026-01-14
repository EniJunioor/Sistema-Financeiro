'use client';

import { useState } from 'react';
import { Plus, Download, List, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodSelector } from '@/components/dashboard/period-selector';
import { FinancialOverviewChart } from '@/components/charts/financial-overview-chart';
import { CategoryBreakdownChart } from '@/components/charts/category-breakdown-chart';
import { TransactionList } from '@/components/transactions/transaction-list';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { useTransactions } from '@/hooks/use-transactions';
import { useDashboard } from '@/hooks/use-dashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Transaction, CreateTransactionData, TransactionFilters } from '@/types/transaction';
import type { AnalyticsQuery } from '@/lib/dashboard-api';

export default function TransactionsDashboardPage() {
  const [period, setPeriod] = useState<AnalyticsQuery['period']>('30d');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

  // Get dashboard data for summary
  const { dashboardData, isLoading: isDashboardLoading, query, setPeriod: setDashboardPeriod, setCustomDateRange } = useDashboard({ period });
  
  // Get transactions
  const filters: TransactionFilters = {
    limit: 10,
    page: 1,
    ...(typeFilter !== 'all' && { type: typeFilter }),
  };
  
  const {
    transactions,
    pagination,
    isLoading: isTransactionsLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
  } = useTransactions(filters);

  const isLoading = isDashboardLoading || isTransactionsLoading;

  // Calculate stats from transactions
  const totalTransactions = pagination?.total || 0;
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpenses;

  const handlePeriodChange = (newPeriod: AnalyticsQuery['period']) => {
    setPeriod(newPeriod);
    setDashboardPeriod(newPeriod);
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    setCustomDateRange(startDate, endDate);
  };

  const handleCreateTransaction = async (data: CreateTransactionData) => {
    try {
      await createTransaction(data);
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const handleUpdateTransaction = async (data: CreateTransactionData) => {
    if (!editingTransaction) return;
    try {
      await updateTransaction({ ...data, id: editingTransaction.id });
      setEditingTransaction(null);
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormDialogOpen(true);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setViewingTransaction(transaction);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const summary = dashboardData?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    totalBalance: 0,
    transactionCount: 0,
    categoryBreakdown: [],
    accountSummary: [],
    periodStart: '',
    periodEnd: '',
  };

  const trends = dashboardData?.trends || {
    monthlyTrends: [],
    predictions: [],
    volatility: 0,
    growthRate: 0,
    seasonality: [],
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        <Button 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => {
            setEditingTransaction(null);
            setIsFormDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <PeriodSelector
          currentPeriod={period}
          startDate={query.startDate}
          endDate={query.endDate}
          onPeriodChange={handlePeriodChange}
          onCustomDateChange={handleCustomDateChange}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Transações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <List className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-gray-500 mt-1">
              {transactions.length} exibidas
            </p>
          </CardContent>
        </Card>

        {/* Saldo Geral */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        {/* Receitas Totais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {transactions.filter(t => t.type === 'income').length} transações
            </p>
          </CardContent>
        </Card>

        {/* Despesas Totais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {transactions.filter(t => t.type === 'expense').length} transações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialOverviewChart
          data={trends.monthlyTrends}
          isLoading={isLoading}
        />
        <CategoryBreakdownChart
          data={summary.categoryBreakdown}
          isLoading={isLoading}
          title="Distribuição por Categoria"
          description="Gastos por categoria"
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(totalIncome / 30)}</div>
            <p className="text-xs text-gray-500 mt-1">Receitas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maior Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {transactions.filter(t => t.type === 'income').length > 0
                ? formatCurrency(Math.max(...transactions.filter(t => t.type === 'income').map(t => t.amount)))
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">No período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maior Despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">
              {transactions.filter(t => t.type === 'expense').length > 0
                ? formatCurrency(Math.max(...transactions.filter(t => t.type === 'expense').map(t => Math.abs(t.amount))))
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">No período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">Transações</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Últimas movimentações financeiras</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={typeFilter === 'income' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('income')}
            >
              Receitas
            </Button>
            <Button
              variant={typeFilter === 'expense' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('expense')}
            >
              Despesas
            </Button>
            <Button
              variant={typeFilter === 'transfer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('transfer')}
            >
              Transferências
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionList
            transactions={transactions}
            isLoading={isTransactionsLoading}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onView={handleViewTransaction}
          />
        </CardContent>
      </Card>

      {/* Transaction Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            initialData={editingTransaction || undefined}
            onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
            onCancel={() => {
              setIsFormDialogOpen(false);
              setEditingTransaction(null);
            }}
            isLoading={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}