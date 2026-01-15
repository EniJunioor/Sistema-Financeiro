'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  ArrowRightLeft, 
  DollarSign,
  Calendar,
  Repeat,
  Search,
  Download,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TransactionList } from '@/components/transactions/transaction-list';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { TransactionFilters } from '@/components/transactions/transaction-filters';
import { TransactionPagination } from '@/components/transactions/transaction-pagination';
import { useTransactions } from '@/hooks/use-transactions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction, CreateTransactionData, TransactionFilters as TFilters } from '@/types/transaction';

export default function TransferenciasPage() {
  const [filters, setFilters] = useState<TFilters>({
    type: 'transfer',
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const {
    transactions,
    pagination,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
  } = useTransactions(filters);

  // Calcular estatísticas
  const totalTransferred = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const averageTransfer = transactions.length > 0 ? totalTransferred / transactions.length : 0;
  const thisMonthTransfers = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);
  const lastMonthTransfers = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);
  const transferChange = lastMonthTransfers > 0 
    ? ((thisMonthTransfers - lastMonthTransfers) / lastMonthTransfers) * 100 
    : 0;

  const handleFiltersChange = (newFilters: TFilters) => {
    setFilters({ ...newFilters, type: 'transfer', page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleItemsPerPageChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  const handleCreateTransaction = async (data: CreateTransactionData) => {
    try {
      await createTransaction({ ...data, type: 'transfer' });
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const handleUpdateTransaction = async (data: CreateTransactionData) => {
    if (!editingTransaction) return;
    try {
      await updateTransaction({ ...data, id: editingTransaction.id });
      setEditingTransaction(null);
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormDialogOpen(true);
  };

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

  // Filtrar transações por busca
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  if (isLoading && transactions.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Transferências</h1>
          <p className="text-gray-600 mt-1">Gerencie transferências entre suas contas</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-white hover:bg-gray-50 border-gray-200"
            onClick={() => {
              // TODO: Implementar exportação
            }}
          >
            <Download className="h-4 w-4 mr-2 text-gray-600" />
            Exportar
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              setEditingTransaction(null);
              setIsFormDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Transferência
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Transferido */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Transferido</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalTransferred)}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-gray-600">
                {formatPercentage(transferChange)} vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transferências do Mês */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Este Mês</CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonthTransfers)}</div>
            <p className="text-xs text-gray-500 mt-2">Transferências do mês atual</p>
          </CardContent>
        </Card>

        {/* Média por Transferência */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Média por Transferência</CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(averageTransfer)}</div>
            <p className="text-xs text-gray-500 mt-2">Média de {transactions.length} transferências</p>
          </CardContent>
        </Card>

        {/* Quantidade */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Quantidade</CardTitle>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Repeat className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pagination?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-2">Transferências registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Filtros e Busca</CardTitle>
            </div>
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar transferência..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
          />
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Lista de Transferências</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {pagination ? `${pagination.total} transferências encontradas` : 'Carregando...'}
          </p>
        </CardHeader>
        <CardContent>
          <TransactionList
            transactions={filteredTransactions}
            isLoading={isLoading}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onView={handleEditTransaction}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <TransactionPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Transaction Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Editar Transferência' : 'Nova Transferência'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            initialData={editingTransaction || undefined}
            onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
            onCancel={() => {
              setIsFormDialogOpen(false);
              setEditingTransaction(null);
            }}
            isLoading={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
