'use client';

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { AnomalyDetection } from '@/types/dashboard';

interface AnomalyDetectionChartProps {
  anomalies: AnomalyDetection[];
  className?: string;
}

export function AnomalyDetectionChart({ anomalies, className }: AnomalyDetectionChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ef4444'; // red
      case 'medium':
        return '#f59e0b'; // yellow
      case 'low':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-700 bg-green-100 border-green-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'spike' ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
  };

  // Prepare chart data
  const chartData = anomalies.map((anomaly, index) => ({
    x: new Date(anomaly.date).getTime(),
    y: anomaly.actualAmount,
    expected: anomaly.expectedAmount,
    deviationAbs: Math.abs(anomaly.deviation),
    severity: anomaly.severity,
    type: anomaly.type,
    confidence: anomaly.confidence,
    date: anomaly.date,
    actualAmount: anomaly.actualAmount,
    expectedAmount: anomaly.expectedAmount,
    deviation: anomaly.deviation,
  }));

  // Calculate average expected amount for reference line
  const avgExpected = anomalies.length > 0 
    ? anomalies.reduce((sum, a) => sum + a.expectedAmount, 0) / anomalies.length 
    : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-medium mb-2">{formatDate(data.date)}</p>
          <div className="space-y-1 text-sm">
            <p className="text-red-600">
              Valor Real: {formatCurrency(data.actualAmount)}
            </p>
            <p className="text-blue-600">
              Valor Esperado: {formatCurrency(data.expectedAmount)}
            </p>
            <p className="text-gray-600">
              Desvio: {formatCurrency(Math.abs(data.deviation))}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={getSeverityBadgeClass(data.severity)}>
                {data.severity === 'high' ? 'Alta' : 
                 data.severity === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {getTypeIcon(data.type)}
                {data.type === 'spike' ? 'Pico' : 'Queda'}
              </Badge>
            </div>
            <p className="text-gray-600">
              Confiança: {(data.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Group anomalies by severity for summary
  const anomalySummary = anomalies.reduce((acc, anomaly) => {
    acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-orange-600" />
          Detecção de Anomalias
        </CardTitle>
        
        {/* Summary badges */}
        <div className="flex gap-2 mt-2">
          {Object.entries(anomalySummary).map(([severity, count]) => (
            <Badge key={severity} className={getSeverityBadgeClass(severity)}>
              {severity === 'high' ? 'Alta' : 
               severity === 'medium' ? 'Média' : 'Baixa'}: {count}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma anomalia detectada nos dados recentes.</p>
            <p className="text-sm mt-1">Isso indica padrões de gastos consistentes.</p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-64 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    dataKey="x"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => formatDate(new Date(value).toISOString())}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    type="number"
                    dataKey="y"
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Reference line for average expected */}
                  <ReferenceLine 
                    y={avgExpected} 
                    stroke="#6b7280" 
                    strokeDasharray="2 2"
                    label="Média Esperada"
                  />

                  <Scatter 
                    data={chartData} 
                    fill="#8b5cf6"
                  >
                    {chartData.map((entry, index) => (
                      <circle
                        key={index}
                        cx={entry.x}
                        cy={entry.y}
                        r={entry.severity === 'high' ? 8 : entry.severity === 'medium' ? 6 : 4}
                        fill={getSeverityColor(entry.severity)}
                        fillOpacity={0.7}
                        stroke={getSeverityColor(entry.severity)}
                        strokeWidth={2}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Anomaly List */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Anomalias Detectadas:</h4>
              {anomalies.slice(0, 5).map((anomaly, index) => (
                <Alert key={index} className="py-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {formatDate(anomaly.date)}
                          </span>
                          <Badge className={getSeverityBadgeClass(anomaly.severity)}>
                            {anomaly.severity === 'high' ? 'Alta' : 
                             anomaly.severity === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getTypeIcon(anomaly.type)}
                            {anomaly.type === 'spike' ? 'Pico' : 'Queda'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          Valor: {formatCurrency(anomaly.actualAmount)} 
                          (esperado: {formatCurrency(anomaly.expectedAmount)})
                        </p>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          Desvio de {formatCurrency(Math.abs(anomaly.deviation))} 
                          • Confiança: {(anomaly.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}

              {anomalies.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  Mostrando 5 de {anomalies.length} anomalias detectadas.
                </p>
              )}
            </div>
          </>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Como funciona:</strong> A IA analisa seus padrões de gastos históricos 
            e identifica transações que desviam significativamente do comportamento esperado. 
            Isso pode indicar gastos excepcionais, erros ou mudanças nos hábitos financeiros.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AnomalyDetectionChart;