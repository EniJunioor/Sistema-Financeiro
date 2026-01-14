'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import type { Investment } from '@/types/investment';

// Dados fictícios para visualização - Apenas Fundos
const mockFunds: Investment[] = [
  {
    id: '3',
    symbol: 'HGLG11',
    name: 'CSHG Logística',
    type: 'fund',
    quantity: 200,
    averagePrice: 155.50,
    currentPrice: 156.80,
    totalValue: 31360.00,
    totalCost: 31100.00,
    gainLoss: 260.00,
    gainLossPercent: 0.8,
    weight: 25.0,
    currency: 'BRL',
    sector: 'Fundos Imobiliários',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    symbol: 'XPML11',
    name: 'XP Malls',
    type: 'fund',
    quantity: 150,
    averagePrice: 98.50,
    currentPrice: 99.20,
    totalValue: 14880.00,
    totalCost: 14775.00,
    gainLoss: 105.00,
    gainLossPercent: 0.7,
    weight: 11.9,
    currency: 'BRL',
    sector: 'Fundos Imobiliários',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    symbol: 'HABT11',
    name: 'Habitat',
    type: 'fund',
    quantity: 180,
    averagePrice: 112.30,
    currentPrice: 113.10,
    totalValue: 20358.00,
    totalCost: 20214.00,
    gainLoss: 144.00,
    gainLossPercent: 0.7,
    weight: 16.2,
    currency: 'BRL',
    sector: 'Fundos Imobiliários',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '9',
    symbol: 'BTLG11',
    name: 'BTG Pactual Logística',
    type: 'fund',
    quantity: 120,
    averagePrice: 125.40,
    currentPrice: 126.20,
    totalValue: 15144.00,
    totalCost: 15048.00,
    gainLoss: 96.00,
    gainLossPercent: 0.6,
    weight: 12.1,
    currency: 'BRL',
    sector: 'Fundos Imobiliários',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const allocationByType = [
  { name: 'Fundos Imobiliários', percentage: 100, color: 'bg-gray-700' },
];

const categoryLabels: Record<string, string> = {
  stock: 'Ações',
  fund: 'FII',
  etf: 'ETF',
  crypto: 'Cripto',
  bond: 'Renda Fixa',
  derivative: 'Derivativo',
};

export default function FundsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const funds = mockFunds;

  // Calcular totais
  const totalValue = funds.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalCost = funds.reduce((sum, inv) => sum + inv.totalCost, 0);
  const totalGainLoss = funds.reduce((sum, inv) => sum + inv.gainLoss, 0);
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const totalInvested = totalCost;
  const uniqueAssets = funds.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Filtrar fundos
  const filteredFunds = useMemo(() => {
    if (!searchTerm) return funds;
    return funds.filter(
      fund =>
        fund.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [funds, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fundos</h1>
          <p className="text-gray-600 mt-1">Gerencie seus fundos de investimento e acompanhe o desempenho</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-black hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fundo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Valor Total */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Valor Total</CardTitle>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-sm text-green-600">{formatPercentage(totalGainLossPercent)} este mês</span>
            </div>
          </CardContent>
        </Card>

        {/* Rendimento */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Rendimento</CardTitle>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalGainLoss)}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-sm text-green-600">{formatPercentage(totalGainLossPercent)} no período</span>
            </div>
          </CardContent>
        </Card>

        {/* Investido */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Investido</CardTitle>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-400 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-gray-500 mt-2">Capital aplicado</p>
          </CardContent>
        </Card>

        {/* Diversificação */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Diversificação</CardTitle>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{uniqueAssets}</div>
            <p className="text-xs text-gray-500 mt-2">Fundos diferentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation and Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alocação por Categoria */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Alocação por Categoria</CardTitle>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allocationByType.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Performance (12 meses)</CardTitle>
            <div className="flex items-center gap-2">
              <select className="text-sm border border-gray-200 rounded px-2 py-1 bg-white">
                <option>12 meses</option>
                <option>6 meses</option>
                <option>3 meses</option>
                <option>1 mês</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Gráfico de Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funds Positions Table */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Posições em Fundos</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar fundo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="bg-white hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">FUNDO</TableHead>
                  <TableHead className="font-semibold text-gray-700">CATEGORIA</TableHead>
                  <TableHead className="font-semibold text-gray-700">QUANTIDADE</TableHead>
                  <TableHead className="font-semibold text-gray-700">PREÇO ATUAL</TableHead>
                  <TableHead className="font-semibold text-gray-700">VALOR TOTAL</TableHead>
                  <TableHead className="font-semibold text-gray-700">VARIAÇÃO</TableHead>
                  <TableHead className="font-semibold text-gray-700">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFunds.map((fund) => (
                  <TableRow key={fund.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-700">{fund.symbol}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{fund.name}</div>
                          <div className="text-xs text-gray-500">{fund.symbol}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50">
                        {categoryLabels[fund.type] || fund.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {fund.quantity.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {formatCurrency(fund.currentPrice)}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {formatCurrency(fund.totalValue)}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 font-medium ${
                        fund.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {fund.gainLossPercent >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {formatPercentage(fund.gainLossPercent)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
