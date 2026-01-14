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

// Dados fictícios para visualização
const mockInvestments: Investment[] = [
  {
    id: '1',
    symbol: 'PETR4',
    name: 'Petrobras PN',
    type: 'stock',
    quantity: 500,
    averagePrice: 31.70,
    currentPrice: 32.45,
    totalValue: 16225.00,
    totalCost: 15850.00,
    gainLoss: 375.00,
    gainLossPercent: 2.5,
    weight: 12.9,
    currency: 'BRL',
    sector: 'Energia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    symbol: 'VALE3',
    name: 'Vale ON',
    type: 'stock',
    quantity: 300,
    averagePrice: 69.65,
    currentPrice: 68.90,
    totalValue: 20670.00,
    totalCost: 20895.00,
    gainLoss: -225.00,
    gainLossPercent: -1.2,
    weight: 16.5,
    currency: 'BRL',
    sector: 'Mineração',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
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
    id: '4',
    symbol: 'ITUB4',
    name: 'Itaú Unibanco PN',
    type: 'stock',
    quantity: 400,
    averagePrice: 28.40,
    currentPrice: 29.15,
    totalValue: 11660.00,
    totalCost: 11360.00,
    gainLoss: 300.00,
    gainLossPercent: 2.6,
    weight: 9.3,
    currency: 'BRL',
    sector: 'Financeiro',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    symbol: 'BBDC4',
    name: 'Bradesco PN',
    type: 'stock',
    quantity: 350,
    averagePrice: 15.80,
    currentPrice: 16.20,
    totalValue: 5670.00,
    totalCost: 5530.00,
    gainLoss: 140.00,
    gainLossPercent: 2.5,
    weight: 4.5,
    currency: 'BRL',
    sector: 'Financeiro',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    symbol: 'ABEV3',
    name: 'Ambev ON',
    type: 'stock',
    quantity: 600,
    averagePrice: 12.90,
    currentPrice: 13.25,
    totalValue: 7950.00,
    totalCost: 7740.00,
    gainLoss: 210.00,
    gainLossPercent: 2.7,
    weight: 6.3,
    currency: 'BRL',
    sector: 'Consumo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const allocationByCategory = [
  { name: 'Ações', percentage: 45, color: 'bg-gray-900' },
  { name: 'Fundos Imobiliários', percentage: 25, color: 'bg-gray-700' },
  { name: 'Renda Fixa', percentage: 20, color: 'bg-gray-500' },
  { name: 'Fundos de Ações', percentage: 10, color: 'bg-gray-300' },
];

const categoryLabels: Record<string, string> = {
  stock: 'Ações',
  fund: 'FII',
  etf: 'ETF',
  crypto: 'Cripto',
  bond: 'Renda Fixa',
  derivative: 'Derivativo',
};

export default function PortfolioPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const investments = mockInvestments;

  // Calcular totais
  const totalValue = investments.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalCost = investments.reduce((sum, inv) => sum + inv.totalCost, 0);
  const totalGainLoss = investments.reduce((sum, inv) => sum + inv.gainLoss, 0);
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const totalInvested = totalCost;
  const uniqueAssets = investments.length;

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

  // Filtrar investimentos
  const filteredInvestments = useMemo(() => {
    if (!searchTerm) return investments;
    return investments.filter(
      inv =>
        inv.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [investments, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carteira de Investimentos</h1>
          <p className="text-gray-600 mt-1">Gerencie seus investimentos e acompanhe o desempenho</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-black hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Novo Investimento
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
            <p className="text-xs text-gray-500 mt-2">Ativos diferentes</p>
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
              {allocationByCategory.map((item) => (
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

      {/* Portfolio Positions Table */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Posições em Carteira</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar ativo..."
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
                  <TableHead className="font-semibold text-gray-700">ATIVO</TableHead>
                  <TableHead className="font-semibold text-gray-700">CATEGORIA</TableHead>
                  <TableHead className="font-semibold text-gray-700">QUANTIDADE</TableHead>
                  <TableHead className="font-semibold text-gray-700">PREÇO ATUAL</TableHead>
                  <TableHead className="font-semibold text-gray-700">VALOR TOTAL</TableHead>
                  <TableHead className="font-semibold text-gray-700">VARIAÇÃO</TableHead>
                  <TableHead className="font-semibold text-gray-700">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestments.map((investment) => (
                  <TableRow key={investment.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-700">{investment.symbol}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{investment.name}</div>
                          <div className="text-xs text-gray-500">{investment.symbol}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50">
                        {categoryLabels[investment.type] || investment.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {investment.quantity.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {formatCurrency(investment.currentPrice)}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {formatCurrency(investment.totalValue)}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 font-medium ${
                        investment.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {investment.gainLossPercent >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {formatPercentage(investment.gainLossPercent)}
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
