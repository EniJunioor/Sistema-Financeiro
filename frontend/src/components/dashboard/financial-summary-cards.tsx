'use client';

import { TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinancialSummary, PeriodComparison } from '@/types/dashboard';

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
  comparison?: PeriodComparison;
  isLoading?: boolean;
}

export function FinancialSummaryCards({ summary, comparison, isLoading }: FinancialSummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-3 w-3" />;
    if (value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Activity className="h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-32 mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Saldo Total',
      value: summary.totalBalance,
      change: comparison?.changes.balanceChangePercent,
      icon: DollarSign,
      description: 'Saldo atual em todas as contas',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
    },
    {
      title: 'Receitas',
      value: summary.totalIncome,
      change: comparison?.changes.incomeChangePercent,
      icon: TrendingUp,
      description: 'Total de receitas no período',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-600',
    },
    {
      title: 'Despesas',
      value: summary.totalExpenses,
      change: comparison?.changes.expenseChangePercent,
      icon: CreditCard,
      description: 'Total de despesas no período',
      invertChange: true, // For expenses, negative change is good
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-red-600',
    },
    {
      title: 'Saldo Líquido',
      value: summary.netIncome,
      change: comparison?.changes.netIncomeChangePercent,
      icon: PiggyBank,
      description: 'Receitas menos despesas',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const hasChange = card.change !== undefined && card.change !== null;
        const changeValue = card.change || 0;
        const displayChange = card.invertChange ? -changeValue : changeValue;
        
        return (
          <Card key={card.title} className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            {/* Gradient accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradientFrom} ${card.gradientTo}`} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4">
              <CardTitle className="text-sm font-medium text-gray-700">
                {card.title}
              </CardTitle>
              <div className={`${card.iconBg} p-2 rounded-lg`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(card.value)}
              </div>
              {hasChange && (
                <div className={`flex items-center space-x-1 text-xs font-medium ${getChangeColor(displayChange)}`}>
                  {getChangeIcon(displayChange)}
                  <span>{formatPercentage(displayChange)} em relação ao período anterior</span>
                </div>
              )}
              {!hasChange && (
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}