'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, Brain } from 'lucide-react';
import { AIForecast, ForecastChartData } from '@/types/dashboard';

interface AIForecastChartProps {
  forecast: AIForecast;
  historicalData?: any[];
  className?: string;
}

export function AIForecastChart({ forecast, historicalData = [], className }: AIForecastChartProps) {
  const [selectedView, setSelectedView] = useState<'spending' | 'income' | 'both'>('both');
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);

  // Prepare chart data combining historical and forecast data
  const prepareChartData = (): ForecastChartData[] => {
    const data: ForecastChartData[] = [];

    // Add historical data
    historicalData.forEach((item) => {
      if (selectedView === 'spending' || selectedView === 'both') {
        data.push({
          date: item.date,
          historical: item.expenses,
          predicted: 0,
          lowerBound: 0,
          upperBound: 0,
          confidence: 1,
          type: 'expense',
        });
      }
      if (selectedView === 'income' || selectedView === 'both') {
        data.push({
          date: item.date,
          historical: item.income,
          predicted: 0,
          lowerBound: 0,
          upperBound: 0,
          confidence: 1,
          type: 'income',
        });
      }
    });

    // Add forecast data
    if (selectedView === 'spending' || selectedView === 'both') {
      forecast.spendingPredictions.forEach((prediction) => {
        data.push({
          date: prediction.date,
          predicted: prediction.predictedAmount,
          lowerBound: prediction.lowerBound,
          upperBound: prediction.upperBound,
          confidence: prediction.confidence,
          type: 'expense',
        });
      });
    }

    if (selectedView === 'income' || selectedView === 'both') {
      forecast.incomePredictions.forEach((prediction) => {
        data.push({
          date: prediction.date,
          predicted: prediction.predictedAmount,
          lowerBound: prediction.lowerBound,
          upperBound: prediction.upperBound,
          confidence: prediction.confidence,
          type: 'income',
        });
      });
    }

    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const chartData = prepareChartData();
  const today = new Date().toISOString().split('T')[0];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric',
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          {data.historical && (
            <p className="text-blue-600">
              Histórico: {formatCurrency(data.historical)}
            </p>
          )}
          {data.predicted > 0 && (
            <>
              <p className="text-purple-600">
                Previsão: {formatCurrency(data.predicted)}
              </p>
              {showConfidenceInterval && (
                <>
                  <p className="text-gray-500 text-sm">
                    Intervalo: {formatCurrency(data.lowerBound)} - {formatCurrency(data.upperBound)}
                  </p>
                  <p className={`text-sm ${getConfidenceColor(data.confidence)}`}>
                    Confiança: {(data.confidence * 100).toFixed(0)}%
                  </p>
                </>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Previsões com IA
          </CardTitle>
          <Badge variant="outline" className="text-purple-600">
            Confiança: {(forecast.confidenceScore * 100).toFixed(0)}%
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedView === 'both' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('both')}
          >
            Ambos
          </Button>
          <Button
            variant={selectedView === 'spending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('spending')}
          >
            Gastos
          </Button>
          <Button
            variant={selectedView === 'income' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('income')}
          >
            Receitas
          </Button>
          <Button
            variant={showConfidenceInterval ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowConfidenceInterval(!showConfidenceInterval)}
          >
            Intervalo de Confiança
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Reference line for today */}
              <ReferenceLine 
                x={today} 
                stroke="#666" 
                strokeDasharray="2 2" 
                label="Hoje"
              />

              {/* Historical data */}
              <Line
                type="monotone"
                dataKey="historical"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Histórico"
                connectNulls={false}
              />

              {/* Predicted data */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                name="Previsão IA"
                connectNulls={false}
              />

              {/* Confidence interval */}
              {showConfidenceInterval && (
                <>
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="#8b5cf6"
                    fillOpacity={0.1}
                    name="Limite Superior"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="none"
                    fill="#8b5cf6"
                    fillOpacity={0.1}
                    name="Limite Inferior"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        {forecast.insights.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Insights da IA:</h4>
            {forecast.insights.slice(0, 3).map((insight, index) => (
              <Alert key={index} className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {insight}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Model Info */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Precisão do Modelo: {(forecast.modelAccuracy * 100).toFixed(0)}%</span>
          <span>
            Gerado em: {new Date(forecast.generatedAt).toLocaleString('pt-BR')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIForecastChart;