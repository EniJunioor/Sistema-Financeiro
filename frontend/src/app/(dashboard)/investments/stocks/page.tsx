'use client';

import { InvestmentsList } from '@/components/investments/investments-list';
import { InvestmentForm } from '@/components/investments/investment-form';
import { useInvestments } from '@/hooks/use-investments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

export default function StocksPage() {
  const { data: investments } = useInvestments({ types: ['stock'] });

  const stocksData = investments?.filter(inv => inv.type === 'stock') || [];
  const totalValue = stocksData.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalGainLoss = stocksData.reduce((sum, inv) => sum + inv.gainLoss, 0);
  const totalGainLossPercent = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;
  const isPositive = totalGainLoss >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ações</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas posições em ações
          </p>
        </div>
        <InvestmentForm 
          trigger={
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <span>Adicionar Ação</span>
            </button>
          }
        />
      </div>

      {/* Stocks Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stocksData.length} ações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganho/Perda</CardTitle>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalGainLoss)}
            </div>
            <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(totalGainLossPercent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Ação</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stocksData.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {stocksData.sort((a, b) => b.gainLossPercent - a.gainLossPercent)[0]?.symbol}
                </div>
                <p className="text-xs text-green-600">
                  {formatPercentage(stocksData.sort((a, b) => b.gainLossPercent - a.gainLossPercent)[0]?.gainLossPercent || 0)}
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pior Ação</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stocksData.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {stocksData.sort((a, b) => a.gainLossPercent - b.gainLossPercent)[0]?.symbol}
                </div>
                <p className="text-xs text-red-600">
                  {formatPercentage(stocksData.sort((a, b) => a.gainLossPercent - b.gainLossPercent)[0]?.gainLossPercent || 0)}
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stocks List */}
      <InvestmentsList />
    </div>
  );
}