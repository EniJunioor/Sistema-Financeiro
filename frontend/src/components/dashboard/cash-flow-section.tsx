'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, MoreVertical } from 'lucide-react';

interface CashFlowSectionProps {
  data?: any[];
  isLoading?: boolean;
}

export function CashFlowSection({ data, isLoading }: CashFlowSectionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('semanal');
  const [activeTab, setActiveTab] = useState<'receita' | 'despesa' | 'economia'>('receita');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Mock data - substituir com dados reais
  const mockData = [
    { name: 'Seg', value: 12000 },
    { name: 'Ter', value: 15000 },
    { name: 'Qua', value: 10000 },
    { name: 'Qui', value: 18000 },
    { name: 'Sex', value: 14000 },
    { name: 'Sáb', value: 16200 },
    { name: 'Dom', value: 11000 },
  ];

  const chartData = data || mockData;
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700 rounded-xl">
        <CardHeader>
          <div className="h-6 bg-gray-700 rounded animate-pulse w-32" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-white mb-2">Fluxo de Caixa</CardTitle>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px] bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('receita')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'receita'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Receita
          </button>
          <button
            onClick={() => setActiveTab('despesa')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'despesa'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Despesa
          </button>
          <button
            onClick={() => setActiveTab('economia')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'economia'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Economia
          </button>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#F97316"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
