'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Wallet,
  DollarSign,
  RefreshCw,
  LineChart
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
import { InvestmentForm } from '@/components/investments/investment-form';
import { InvestmentActionsMenu } from '@/components/investments/investment-actions-menu';
import { useInvestments, usePortfolio, useAssetAllocation, useUpdateQuotes } from '@/hooks/use-investments';
import { Skeleton } from '@/components/ui/skeleton';

const categoryLabels: Record<string, string> = {
  stock: 'Ações',
  fund: 'FII',
  etf: 'ETF',
  crypto: 'Cripto',
  bond: 'Renda Fixa',
  derivative: 'Derivativo',
};

const categoryColors: Record<string, string> = {
  stock: 'bg-blue-500',
  fund: 'bg-purple-500',
  etf: 'bg-green-500',
  crypto: 'bg-orange-500',
  bond: 'bg-yellow-500',
  derivative: 'bg-red-500',
};

const sectorColors: Record<string, string> = {
  'Energia': 'bg-blue-500',
  'Mineração': 'bg-gray-700',
  'Financeiro': 'bg-green-500',
  'Consumo': 'bg-yellow-500',
  'Industrial': 'bg-orange-500',
  'Tecnologia': 'bg-purple-500',
  'Saúde': 'bg-pink-500',
  'Imobiliário': 'bg-indigo-500',
  'Telecomunicações': 'bg-cyan-500',
  'Materiais': 'bg-amber-500',
  'Utilidades': 'bg-teal-500',
};

export default function StocksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: allInvestments = [], isLoading: investmentsLoading } = useInvestments();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio({ types: ['stock'] });
  const { data: allocation, isLoading: allocationLoading } = useAssetAllocation();
  const updateQuotes = useUpdateQuotes();

  // Filtrar apenas ações
  const stocks = useMemo(() => {
    return allInvestments.filter(inv => inv.type === 'stock');
  }, [allInvestments]);

  // Calcular totais
  const totalValue = portfolio?.totalValue || stocks.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalCost = portfolio?.totalCost || stocks.reduce((sum, inv) => sum + inv.totalCost, 0);
  const totalGainLoss = portfolio?.totalGainLoss || stocks.reduce((sum, inv) => sum + inv.gainLoss, 0);
  const totalGainLossPercent = portfolio?.totalGainLossPercent || (totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0);
  const totalInvested = totalCost;
  const uniqueAssets = stocks.length;

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

  // Filtrar ações
  const filteredStocks = useMemo(() => {
    if (!searchTerm) return stocks;
    return stocks.filter(
      stock =>
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stocks, searchTerm]);

  // Preparar alocação por setor
  const allocationBySector = useMemo(() => {
    const sectorMap = new Map<string, number>();
    stocks.forEach(stock => {
      if (stock.sector) {
        const current = sectorMap.get(stock.sector) || 0;
        sectorMap.set(stock.sector, current + stock.totalValue);
      }
    });
    
    const total = Array.from(sectorMap.values()).reduce((sum, val) => sum + val, 0);
    if (total === 0) return [];

    return Array.from(sectorMap.entries())
      .map(([sector, value]) => ({
        name: sector,
        percentage: (value / total) * 100,
        color: sectorColors[sector] || 'bg-gray-500',
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [stocks]);

  const handleExport = () => {
    const headers = ['Símbolo', 'Nome', 'Setor', 'Quantidade', 'Preço Atual', 'Valor Total', 'Variação %'];
    const rows = stocks.map(stock => [
      stock.symbol,
      stock.name,
      stock.sector || '-',
      stock.quantity.toString(),
      stock.currentPrice.toFixed(2),
      stock.totalValue.toFixed(2),
      stock.gainLossPercent.toFixed(2) + '%',
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `acoes-investimentos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (investmentsLoading || portfolioLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ações</h1>
          <p className="text-gray-600 mt-1">Gerencie suas ações e acompanhe o desempenho</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-white hover:bg-gray-50 border-gray-200"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2 text-gray-600" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            className="bg-white hover:bg-gray-50 border-gray-200"
            onClick={() => updateQuotes.mutate()}
            disabled={updateQuotes.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 text-gray-600 ${updateQuotes.isPending ? 'animate-spin' : ''}`} />
            Atualizar Cotações
          </Button>
          <InvestmentForm
            defaultType="stock"
            trigger={
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nova Ação
              </Button>
            }
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Valor Total */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Valor Total</CardTitle>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
            <div className="flex items-center gap-1 mt-2">
              {totalGainLossPercent >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-sm ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(totalGainLossPercent)} este mês
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Rendimento */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Rendimento</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalGainLoss)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {totalGainLossPercent >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-sm ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(totalGainLossPercent)} no período
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Investido */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Investido</CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-gray-500 mt-2">Capital aplicado</p>
          </CardContent>
        </Card>

        {/* Diversificação */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Diversificação</CardTitle>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <LineChart className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{uniqueAssets}</div>
            <p className="text-xs text-gray-500 mt-2">Ações diferentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation and Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alocação por Setor */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Alocação por Setor</CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <PieChart className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {allocationLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-6" />
                ))}
              </div>
            ) : allocationBySector.length > 0 ? (
              <div className="space-y-4">
                {allocationBySector.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma alocação disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Performance (12 meses)</CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Gráfico de Performance</p>
                <p className="text-xs text-gray-400 mt-1">Em breve: visualização interativa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stocks Positions Table */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Posições em Ações</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="bg-white hover:bg-gray-50 border-gray-200">
                <Filter className="h-4 w-4 mr-2 text-gray-600" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStocks.length === 0 ? (
            <div className="text-center py-12">
              <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Nenhuma ação encontrada</p>
              <p className="text-sm text-gray-500 mb-4">Adicione sua primeira ação para começar</p>
              <InvestmentForm
                defaultType="stock"
                trigger={
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ação
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">AÇÃO</TableHead>
                    <TableHead className="font-semibold text-gray-700">SETOR</TableHead>
                    <TableHead className="font-semibold text-gray-700">QUANTIDADE</TableHead>
                    <TableHead className="font-semibold text-gray-700">PREÇO ATUAL</TableHead>
                    <TableHead className="font-semibold text-gray-700">VALOR TOTAL</TableHead>
                    <TableHead className="font-semibold text-gray-700">VARIAÇÃO</TableHead>
                    <TableHead className="font-semibold text-gray-700">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.map((stock) => (
                    <TableRow key={stock.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${categoryColors[stock.type] || 'bg-blue-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className="text-xs font-semibold text-white">{stock.symbol}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{stock.name}</div>
                            <div className="text-xs text-gray-500">{stock.symbol}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50">
                          {stock.sector || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {stock.quantity.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {formatCurrency(stock.currentPrice)}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {formatCurrency(stock.totalValue)}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 font-medium ${
                          stock.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.gainLossPercent >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatPercentage(stock.gainLossPercent)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <InvestmentActionsMenu investment={stock} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
