'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { CategoryForecast } from '@/types/dashboard';

interface CategoryForecastChartProps {
  forecasts: CategoryForecast[];
  className?: string;
}

export function CategoryForecastChart({ forecasts, className }: CategoryForecastChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600 bg-red-50';
      case 'decreasing':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10b981'; // green
    if (confidence >= 0.6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const chartData = forecasts.map((forecast) => ({
    name: forecast.categoryName.length > 15 
      ? forecast.categoryName.substring(0, 15) + '...' 
      : forecast.categoryName,
    fullName: forecast.categoryName,
    predicted: forecast.predictedAmount,
    historical: forecast.historicalAverage,
    recommended: forecast.recommendedBudget,
    confidence: forecast.confidence,
    trend: forecast.trend,
    volatility: forecast.volatility,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-medium mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-purple-600">
              Previsão: {formatCurrency(data.predicted)}
            </p>
            <p className="text-blue-600">
              Média Histórica: {formatCurrency(data.historical)}
            </p>
            <p className="text-green-600">
              Orçamento Recomendado: {formatCurrency(data.recommended)}
            </p>
            <p className="text-gray-600">
              Confiança: {(data.confidence * 100).toFixed(0)}%
            </p>
            <p className="text-gray-600">
              Volatilidade: {(data.volatility * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Previsão por Categoria
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Chart */}
        <div className="h-64 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              
              <Bar dataKey="historical" fill="#3b82f6" name="Média Histórica" opacity={0.6} />
              <Bar dataKey="predicted" fill="#8b5cf6" name="Previsão IA">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getConfidenceColor(entry.confidence)} />
                ))}
              </Bar>
              <Bar dataKey="recommended" fill="#10b981" name="Orçamento Recomendado" opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700">Detalhes por Categoria:</h4>
          <div className="grid gap-3">
            {forecasts.slice(0, 5).map((forecast) => (
              <div key={forecast.categoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{forecast.categoryName}</span>
                    {getTrendIcon(forecast.trend)}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getTrendColor(forecast.trend)}`}
                    >
                      {forecast.trend === 'increasing' ? 'Crescendo' : 
                       forecast.trend === 'decreasing' ? 'Diminuindo' : 'Estável'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>Previsão: {formatCurrency(forecast.predictedAmount)}</span>
                    <span>Recomendado: {formatCurrency(forecast.recommendedBudget)}</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Confiança</span>
                      <span>{(forecast.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={forecast.confidence * 100} 
                      className="h-1"
                    />
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-sm font-medium">
                    {formatCurrency(forecast.predictedAmount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    vs {formatCurrency(forecast.historicalAverage)}
                  </div>
                  {forecast.volatility > 0.3 && (
                    <Badge variant="outline" className="text-xs text-orange-600 bg-orange-50 mt-1">
                      Alta Volatilidade
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {forecasts.length > 5 && (
            <p className="text-xs text-gray-500 text-center">
              Mostrando top 5 categorias. Total: {forecasts.length} categorias analisadas.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CategoryForecastChart;