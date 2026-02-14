'use client';

import { Card, CardContent } from '@/components/ui/card';

interface FinancialMetricsCardsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  balanceChange?: number;
  incomeChange?: number;
  expenseChange?: number;
  isLoading?: boolean;
}

export function FinancialMetricsCards({
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  balanceChange = 2.5,
  incomeChange = 2.5,
  expenseChange = 8,
  isLoading = false,
}: FinancialMetricsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-700 rounded animate-pulse w-24 mb-4" />
              <div className="h-8 bg-gray-700 rounded animate-pulse w-32 mb-2" />
              <div className="h-3 bg-gray-700 rounded animate-pulse w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Saldo Total',
      value: totalBalance,
      change: balanceChange,
    },
    {
      title: 'Renda Mensal',
      value: monthlyIncome,
      change: incomeChange,
    },
    {
      title: 'Despesa Mensal',
      value: monthlyExpense,
      change: expenseChange,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="bg-gray-800 border-gray-700 rounded-xl">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">{card.title}</h3>
            <div className="text-3xl font-bold text-white mb-3">
              {formatCurrency(card.value)}
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-md">
              <span className="text-xs font-medium text-green-400">+{card.change}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
