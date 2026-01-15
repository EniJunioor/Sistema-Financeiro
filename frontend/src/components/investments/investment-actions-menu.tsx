'use client';

import { useState } from 'react';
import { MoreVertical, Edit, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EditInvestmentDialog } from './edit-investment-dialog';
import { DeleteInvestmentDialog } from './delete-investment-dialog';
import { AddTransactionDialog } from './add-transaction-dialog';
import type { Investment } from '@/types/investment';

interface InvestmentActionsMenuProps {
  investment: Investment;
}

export function InvestmentActionsMenu({ investment }: InvestmentActionsMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTransactionOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Transação
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditInvestmentDialog
        investment={investment}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteInvestmentDialog
        investment={investment}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <AddTransactionDialog
        investment={investment}
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
      />
    </>
  );
}
