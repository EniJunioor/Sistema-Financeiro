'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionList } from '@/components/transactions/transaction-list';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { TransactionFilters } from '@/components/transactions/transaction-filters';
import { TransactionPagination } from '@/components/transactions/transaction-pagination';
import { useTransactions } from '@/hooks/use-transactions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Transaction, CreateTransactionData, TransactionFilters as TFilters } from '@/types/transaction';

export default function TransfersPage() {
  const [filters, setFilters] = useState<TFilters>({
    type: 'transfer',
    page: 1,
    limit: 20,
  });
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

  const totalTransferred = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setEditingTransaction(null);
            setIsFormDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nova Transferência
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transferido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalTransferred)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pagination?.total || 0} transferências
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo entre Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Fluxo líquido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quantidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pagination?.total || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Transferências no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
      />

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Transferências</CardTitle>
          <CardDescription>
            {pagination ? `${pagination.total} transferências encontradas` : 'Carregando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionList
            transactions={transactions}
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