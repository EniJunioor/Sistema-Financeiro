'use client';

import { useState } from 'react';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { AccountTransaction } from '@/lib/accounts-api';

interface PendingTransactionsProps {
  transactions: AccountTransaction[];
  isLoading: boolean;
  accountId: string;
}

export function PendingTransactions({ 
  transactions, 
  isLoading, 
  accountId 
}: PendingTransactionsProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false);
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [processingTransactions, setProcessingTransactions] = useState<string[]>([]);

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(transactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleApproveTransaction = async (transactionId: string) => {
    setProcessingTransactions(prev => [...prev, transactionId]);
    
    try {
      // TODO: Implement API call to approve transaction
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Transação aprovada com sucesso!');
    } catch (error) {
      toast.error('Erro ao aprovar transação');
    } finally {
      setProcessingTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleRejectTransaction = async (transactionId: string) => {
    setProcessingTransactions(prev => [...prev, transactionId]);
    
    try {
      // TODO: Implement API call to reject transaction
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Transação rejeitada com sucesso!');
    } catch (error) {
      toast.error('Erro ao rejeitar transação');
    } finally {
      setProcessingTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleBulkApprove = async () => {
    setShowBulkApproveDialog(false);
    
    for (const transactionId of selectedTransactions) {
      await handleApproveTransaction(transactionId);
    }
    
    setSelectedTransactions([]);
  };

  const handleBulkReject = async () => {
    setShowBulkRejectDialog(false);
    
    for (const transactionId of selectedTransactions) {
      await handleRejectTransaction(transactionId);
    }
    
    setSelectedTransactions([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels = {
      income: 'Receita',
      expense: 'Despesa',
      transfer: 'Transferência',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors = {
      income: 'text-green-600',
      expense: 'text-red-600',
      transfer: 'text-blue-600',
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle>Transações Pendentes</CardTitle>
              {transactions.length > 0 && (
                <Badge variant="destructive">{transactions.length}</Badge>
              )}
            </div>
            {selectedTransactions.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkApproveDialog(true)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar ({selectedTransactions.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkRejectDialog(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar ({selectedTransactions.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma transação pendente</h3>
              <p className="text-muted-foreground">
                Todas as transações importadas foram processadas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  checked={selectedTransactions.length === transactions.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Selecionar todas ({transactions.length})
                </span>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={(checked) => 
                          handleSelectTransaction(transaction.id, checked as boolean)
                        }
                      />
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' :
                        transaction.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <span className={`text-sm font-semibold ${getTransactionTypeColor(transaction.type)}`}>
                          {transaction.type === 'income' ? '+' : 
                           transaction.type === 'expense' ? '-' : '↔'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{formatDate(transaction.date)}</span>
                          <Badge variant="outline" className="text-xs">
                            {getTransactionTypeLabel(transaction.type)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionTypeColor(transaction.type)}`}>
                          {transaction.type === 'expense' ? '-' : ''}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveTransaction(transaction.id)}
                          disabled={processingTransactions.includes(transaction.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectTransaction(transaction.id)}
                          disabled={processingTransactions.includes(transaction.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Approve Dialog */}
      <AlertDialog open={showBulkApproveDialog} onOpenChange={setShowBulkApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Transações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar {selectedTransactions.length} transação(ões) selecionada(s)?
              Elas serão adicionadas ao seu histórico financeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkApprove}>
              Aprovar Transações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Reject Dialog */}
      <AlertDialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Transações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar {selectedTransactions.length} transação(ões) selecionada(s)?
              Elas serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeitar Transações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}