'use client';

import { TrendingUp, TrendingDown, ArrowUpDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Account } from '@/types/transaction';
import type { AccountTransaction } from '@/lib/accounts-api';

interface AccountStatsProps {
  account: Account;
  transactions: AccountTransaction[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export function AccountStats({ account, transactions, dateRange }: AccountStatsProps) {
  const calculateStats = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const transfers = transactions
      .filter(t => t.type === 'transfer')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netFlow = income - expenses;

    return {
      income,
      expenses,
      transfers,
      netFlow,
      totalTransactions: transactions.length,
    };
  };

  const stats = calculateStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: account.currency || 'BRL',
    }).format(amount);
  };

  const formatDateRange = () => {
    const start = new Date(dateRange.startDate).toLocaleDateString('pt-BR');
    const end = new Date(dateRange.endDate).toLocaleDateString('pt-BR');
    return `${start} - ${end}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.income)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDateRange()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.expenses)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDateRange()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fluxo Líquido</CardTitle>
          <ArrowUpDown className={`h-4 w-4 ${stats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.netFlow)}
          </div>
          <p className="text-xs text-muted-foreground">
            Receitas - Despesas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transações</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalTransactions}
          </div>
          <p className="text-xs text-muted-foreground">
            Total no período
          </p>
        </CardContent>
      </Card>
    </div>
  );
}