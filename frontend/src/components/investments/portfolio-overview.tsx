'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio, useUpdateQuotes } from '@/hooks/use-investments';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, PieChart, Target } from 'lucide-react';

interface PortfolioOverviewProps {
  className?: string;
}

export function PortfolioOverview({ className }: PortfolioOverviewProps) {
  const { data: portfolio, isLoading, error } = usePortfolio();
  const updateQuotes = useUpdateQuotes();

  if (isLoading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Erro ao carregar dados da carteira
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio || portfolio.investments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Nenhum investimento encontrado. Adicione seu primeiro investimento para começar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = portfolio.totalGainLoss >= 0;
  const lastUpdated = new Date(portfolio.lastUpdated);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral da Carteira</h2>
          <p className="text-sm text-muted-foreground">
            Última atualização: {lastUpdated.toLocaleString('pt-BR')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQuotes.mutate()}
          disabled={updateQuotes.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${updateQuotes.isPending ? 'animate-spin' : ''}`} />
          Atualizar Cotações
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolio.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Custo: {formatCurrency(portfolio.totalCost)}
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
              {formatCurrency(portfolio.totalGainLoss)}
            </div>
            <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(portfolio.totalGainLossPercent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversificação</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.investments.length}</div>
            <p className="text-xs text-muted-foreground">
              Ativos na carteira
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={isPositive ? 'default' : 'destructive'}>
                {isPositive ? 'Positiva' : 'Negativa'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Resultado geral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Posições</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolio.investments
              .sort((a, b) => b.weight - a.weight)
              .slice(0, 5)
              .map((investment) => (
                <div key={investment.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{investment.symbol}</p>
                      <p className="text-sm text-muted-foreground">{investment.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(investment.totalValue)}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-muted-foreground">
                        {formatPercentage(investment.weight)}
                      </p>
                      <Badge
                        variant={investment.gainLoss >= 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {formatPercentage(investment.gainLossPercent)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}