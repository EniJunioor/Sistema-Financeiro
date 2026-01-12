'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePerformanceMetrics } from '@/hooks/use-investments';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface PerformanceChartProps {
  className?: string;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export function PerformanceChart({ className }: PerformanceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('6M');
  
  // Calculate date range based on selection
  const getDateRange = (range: TimeRange) => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'ALL':
        return { startDate: undefined, endDate: undefined };
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const { startDate, endDate } = getDateRange(timeRange);
  const { data: performance, isLoading, error } = usePerformanceMetrics(startDate, endDate);

  // Generate mock historical data for the chart
  const generateChartData = () => {
    if (!performance) return [];
    
    const days = timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '6M' ? 180 : 365;
    const data = [];
    const startValue = 100000; // Starting portfolio value
    const totalReturn = performance.totalReturnPercent / 100;
    
    for (let i = 0; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Simulate portfolio growth with some volatility
      const progress = i / days;
      const baseValue = startValue * (1 + totalReturn * progress);
      const volatility = Math.sin(i * 0.1) * (startValue * 0.02); // 2% volatility
      const value = baseValue + volatility;
      
      data.push({
        date: date.toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric',
          ...(timeRange === '1Y' || timeRange === 'ALL' ? { year: '2-digit' } : {})
        }),
        value: Math.round(value),
        return: ((value - startValue) / startValue) * 100
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Performance da Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !performance) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Performance da Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Erro ao carregar dados de performance
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = performance.totalReturn >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Valor: {formatCurrency(data.value)}
          </p>
          <p className={`text-sm ${data.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Retorno: {formatPercentage(data.return)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Performance da Carteira</span>
          <div className="flex items-center space-x-2">
            {['1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range as TimeRange)}
              >
                {range}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Retorno Total</p>
              <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(performance.totalReturn)}
              </p>
              <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
                {formatPercentage(performance.totalReturnPercent)}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Retorno Anualizado</p>
              <p className={`text-lg font-bold ${performance.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(performance.annualizedReturn)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Volatilidade</p>
              <p className="text-lg font-bold text-orange-600">
                {formatPercentage(performance.volatility)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
              <p className="text-lg font-bold">
                {performance.sharpeRatio.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value, { compact: true })}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0088FE"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Drawdown Máximo</p>
              <p className="text-sm font-medium text-red-600">
                {formatPercentage(performance.maxDrawdown)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Melhor Dia</p>
              <p className="text-sm font-medium text-green-600">
                {formatPercentage(performance.bestDay)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pior Dia</p>
              <p className="text-sm font-medium text-red-600">
                {formatPercentage(performance.worstDay)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
              <p className="text-sm font-medium">
                {formatPercentage(performance.winRate)}
              </p>
            </div>
          </div>

          {/* Period Info */}
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Período: {new Date(performance.periodStart).toLocaleDateString('pt-BR')} - {new Date(performance.periodEnd).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}