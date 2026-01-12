'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Eye,
  Lightbulb
} from 'lucide-react';
import { useAIForecast } from '@/hooks/use-ai-forecast';
import { AIForecastChart } from '@/components/charts/ai-forecast-chart';
import { CategoryForecastChart } from '@/components/charts/category-forecast-chart';
import { AnomalyDetectionChart } from '@/components/charts/anomaly-detection-chart';

interface AIForecastDashboardProps {
  className?: string;
  historicalData?: any[];
}

export function AIForecastDashboard({ className, historicalData = [] }: AIForecastDashboardProps) {
  const [forecastMonths, setForecastMonths] = useState(6);
  const [selectedPeriod, setSelectedPeriod] = useState('6m');

  // Calculate date range based on selected period
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (selectedPeriod) {
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '2y':
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const { startDate, endDate } = getDateRange();

  const {
    forecast,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useAIForecast({
    forecastMonths,
    startDate,
    endDate,
    includeAnomalies: true,
    includeSeasonalAdjustments: true,
    includeCategoryForecasts: true,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleForecastMonthsChange = (months: number) => {
    setForecastMonths(months);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar previsões: {error.message}
              {error.message.includes('Insufficient historical data') && (
                <div className="mt-2">
                  <p className="text-sm">
                    É necessário pelo menos 6 meses de dados históricos para gerar previsões precisas.
                    Continue usando a plataforma para acumular mais dados.
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <div>
                <CardTitle>Previsões com Inteligência Artificial</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Análises preditivas baseadas em seus padrões financeiros
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {forecast && (
                <Badge variant="outline" className="text-purple-600">
                  Confiança: {(forecast.confidenceScore * 100).toFixed(0)}%
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || isRefetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mt-4">
            {/* Period Selection */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Período de análise:</span>
              <div className="flex gap-1">
                {[
                  { value: '3m', label: '3M' },
                  { value: '6m', label: '6M' },
                  { value: '1y', label: '1A' },
                  { value: '2y', label: '2A' },
                ].map((period) => (
                  <Button
                    key={period.value}
                    variant={selectedPeriod === period.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePeriodChange(period.value)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Forecast Months */}
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Previsão:</span>
              <div className="flex gap-1">
                {[3, 6, 9, 12].map((months) => (
                  <Button
                    key={months}
                    variant={forecastMonths === months ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleForecastMonthsChange(months)}
                  >
                    {months}M
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      )}

      {/* Forecast Content */}
      {forecast && !isLoading && (
        <>
          {/* Main Forecast Chart */}
          <AIForecastChart 
            forecast={forecast} 
            historicalData={historicalData}
            className="col-span-full"
          />

          {/* Secondary Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Category Forecasts */}
            {forecast.categoryForecasts.length > 0 && (
              <CategoryForecastChart 
                forecasts={forecast.categoryForecasts}
              />
            )}

            {/* Anomaly Detection */}
            <AnomalyDetectionChart 
              anomalies={forecast.anomalies}
            />
          </div>

          {/* Insights Section */}
          {forecast.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Insights da IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {forecast.insights.map((insight, index) => (
                    <Alert key={index} className="border-l-4 border-l-blue-500">
                      <AlertDescription className="text-sm">
                        {insight}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seasonal Adjustments */}
          {forecast.seasonalAdjustments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Padrões Sazonais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {forecast.seasonalAdjustments.map((adjustment) => (
                    <div 
                      key={adjustment.month} 
                      className="p-3 bg-gray-50 rounded-lg text-center"
                    >
                      <div className="font-medium text-sm">{adjustment.monthName}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {adjustment.adjustmentPercentage > 0 ? '+' : ''}
                        {adjustment.adjustmentPercentage.toFixed(1)}%
                      </div>
                      <div className="mt-2">
                        <Badge 
                          variant="outline" 
                          className={
                            adjustment.adjustmentPercentage > 10 ? 'text-red-600 bg-red-50' :
                            adjustment.adjustmentPercentage < -10 ? 'text-green-600 bg-green-50' :
                            'text-gray-600 bg-gray-50'
                          }
                        >
                          {adjustment.adjustmentPercentage > 10 ? 'Alto' :
                           adjustment.adjustmentPercentage < -10 ? 'Baixo' : 'Normal'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Padrões sazonais ajudam a entender variações regulares nos seus gastos ao longo do ano.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Model Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>Precisão do Modelo: {(forecast.modelAccuracy * 100).toFixed(0)}%</span>
                  <span>Confiança Geral: {(forecast.confidenceScore * 100).toFixed(0)}%</span>
                  <span>Período de Previsão: {forecast.forecastPeriodMonths} meses</span>
                </div>
                <span>
                  Atualizado: {new Date(forecast.generatedAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default AIForecastDashboard;