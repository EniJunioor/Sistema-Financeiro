'use client';

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
import { useDeleteInvestment } from '@/hooks/use-investments';
import type { Investment } from '@/types/investment';

interface DeleteInvestmentDialogProps {
  investment: Investment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteInvestmentDialog({
  investment,
  open,
  onOpenChange,
}: DeleteInvestmentDialogProps) {
  const deleteInvestment = useDeleteInvestment();

  const handleDelete = async () => {
    try {
      await deleteInvestment.mutateAsync(investment.id);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Investimento</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{investment.name}</strong> ({investment.symbol})?
            Esta ação não pode ser desfeita e todas as transações relacionadas serão removidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteInvestment.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteInvestment.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteInvestment.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
