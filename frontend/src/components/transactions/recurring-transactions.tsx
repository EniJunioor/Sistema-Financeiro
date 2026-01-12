'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import { TransactionsAPI } from '@/lib/transactions-api';
import type { RecurringTransaction, QueueStats } from '@/types/transaction';

interface RecurringTransactionsProps {
  recurringTransactions: RecurringTransaction[];
  onUpdate: () => void;
  onEdit: (transaction: RecurringTransaction) => void;
}

export function RecurringTransactions({ 
  recurringTransactions, 
  onUpdate, 
  onEdit 
}: RecurringTransactionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getFrequencyLabel = (frequency: string, interval: number) => {
    const labels = {
      daily: interval === 1 ? 'Diário' : `A cada ${interval} dias`,
      weekly: interval === 1 ? 'Semanal' : `A cada ${interval} semanas`,
      monthly: interval === 1 ? 'Mensal' : `A cada ${interval} meses`,
      yearly: interval === 1 ? 'Anual' : `A cada ${interval} anos`,
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const handleCancelRecurring = async (id: string) => {
    setIsLoading(true);
    try {
      await TransactionsAPI.cancelRecurringTransaction(id);
      onUpdate();
    } catch (error) {
      console.error('Error canceling recurring transaction:', error);
    } finally {
      setIsLoading(false);
      setDeleteId(null);
    }
  };

  const handleTriggerProcessing = async () => {
    setIsLoading(true);
    try {
      await TransactionsAPI.triggerRecurringProcessing();
      onUpdate();
    } catch (error) {
      console.error('Error triggering processing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQueueStats = async () => {
    try {
      const stats = await TransactionsAPI.getQueueStats();
      setQueueStats(stats);
    } catch (error) {
      console.error('Error loading queue stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Transações Recorrentes</h2>
          <p className="text-gray-600">
            Gerencie suas transações automáticas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadQueueStats}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Status da Fila
          </Button>
          <Button
            onClick={handleTriggerProcessing}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Processar Agora
          </Button>
        </div>
      </div>

      {/* Queue Stats */}
      {queueStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Estatísticas da Fila de Processamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{queueStats.waiting}</div>
                <div className="text-sm text-gray-600">Aguardando</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{queueStats.active}</div>
                <div className="text-sm text-gray-600">Processando</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
                <div className="text-sm text-gray-600">Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
                <div className="text-sm text-gray-600">Falharam</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{queueStats.delayed}</div>
                <div className="text-sm text-gray-600">Agendados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {recurringTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma transação recorrente
              </h3>
              <p className="text-gray-600">
                Crie uma nova transação e marque como recorrente para começar.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transação</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Próxima Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getTypeIcon(transaction.type)}
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          {transaction.category && (
                            <div className="text-sm text-gray-600">
                              {transaction.category.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        R$ {transaction.amount.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getFrequencyLabel(
                          transaction.recurringRule.frequency,
                          transaction.recurringRule.interval
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {format(new Date(transaction.nextDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.isActive ? 'default' : 'secondary'}>
                        {transaction.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(transaction)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(transaction.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Transação Recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta transação recorrente? 
              Isso impedirá que novas transações sejam criadas automaticamente.
              As transações já criadas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleCancelRecurring(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}