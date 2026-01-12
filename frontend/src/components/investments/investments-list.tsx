'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvestments, useDeleteInvestment } from '@/hooks/use-investments';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { Search, Filter, MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Investment, InvestmentType, InvestmentFilters } from '@/types/investment';

const investmentTypeLabels: Record<InvestmentType, string> = {
  stock: 'Ações',
  fund: 'Fundos',
  etf: 'ETFs',
  crypto: 'Criptomoedas',
  bond: 'Renda Fixa',
  derivative: 'Derivativos',
};

const investmentTypeColors: Record<InvestmentType, string> = {
  stock: 'bg-blue-100 text-blue-800',
  fund: 'bg-green-100 text-green-800',
  etf: 'bg-purple-100 text-purple-800',
  crypto: 'bg-orange-100 text-orange-800',
  bond: 'bg-gray-100 text-gray-800',
  derivative: 'bg-red-100 text-red-800',
};

interface InvestmentsListProps {
  className?: string;
}

export function InvestmentsList({ className }: InvestmentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<InvestmentFilters>({});
  const [sortBy, setSortBy] = useState<'symbol' | 'value' | 'gainLoss' | 'weight'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: investments, isLoading, error } = useInvestments(filters);
  const deleteInvestment = useDeleteInvestment();

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedInvestments = investments
    ?.filter((investment) =>
      investment.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investment.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'symbol':
          return sortOrder === 'asc' 
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        case 'value':
          aValue = a.totalValue;
          bValue = b.totalValue;
          break;
        case 'gainLoss':
          aValue = a.gainLossPercent;
          bValue = b.gainLossPercent;
          break;
        case 'weight':
          aValue = a.weight;
          bValue = b.weight;
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }) || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteInvestment.mutateAsync(id);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Lista de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Lista de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Erro ao carregar investimentos
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!investments || investments.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Lista de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Nenhum investimento encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Lista de Investimentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por símbolo ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.types?.[0] || 'all'}
              onValueChange={(value) => 
                setFilters(prev => ({
                  ...prev,
                  types: value === 'all' ? undefined : [value as InvestmentType]
                }))
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(investmentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('symbol')}
                  >
                    Ativo
                    {sortBy === 'symbol' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Preço Atual</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('value')}
                  >
                    Valor Total
                    {sortBy === 'value' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('gainLoss')}
                  >
                    Ganho/Perda
                    {sortBy === 'gainLoss' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('weight')}
                  >
                    Peso
                    {sortBy === 'weight' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedInvestments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{investment.symbol}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-32">
                          {investment.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={investmentTypeColors[investment.type]}>
                        {investmentTypeLabels[investment.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {investment.quantity.toLocaleString('pt-BR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 8
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(investment.currentPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(investment.totalValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {investment.gainLoss >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={investment.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatPercentage(investment.gainLossPercent)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(investment.gainLoss)}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(investment.weight)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o investimento {investment.symbol}? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(investment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedInvestments.length === 0 && searchTerm && (
            <p className="text-center text-muted-foreground py-4">
              Nenhum investimento encontrado para &quot;{searchTerm}&quot;
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}