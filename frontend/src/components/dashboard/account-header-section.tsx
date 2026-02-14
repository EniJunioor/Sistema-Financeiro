'use client';

import { useState } from 'react';
import { Plus, Settings, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AccountHeaderSectionProps {
  selectedAccount?: string;
  onAccountChange?: (accountId: string) => void;
  onManageBalance?: () => void;
  onNewPayment?: () => void;
}

export function AccountHeaderSection({
  selectedAccount,
  onAccountChange,
  onManageBalance,
  onNewPayment,
}: AccountHeaderSectionProps) {
  // Mock accounts - substituir com dados reais
  const accounts = [
    { id: '1', name: 'Conta Corrente', number: '.... 3625' },
    { id: '2', name: 'Poupança', number: '.... 1234' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white">Contas</h2>
        <Select value={selectedAccount || accounts[0].id} onValueChange={onAccountChange}>
          <SelectTrigger className="w-[180px] border-gray-600 bg-gray-800 text-white">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-400" />
              <SelectValue>
                {accounts.find(a => a.id === selectedAccount || accounts[0].id)?.number || '.... 3625'}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} - {account.number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-gray-800"
          onClick={onManageBalance}
        >
          <Settings className="w-4 h-4 mr-2" />
          Gerenciar Saldo
        </Button>
      </div>
      <Button
        className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
        onClick={onNewPayment}
      >
        <Plus className="w-4 h-4 mr-2" />
        Novo Pagamento
      </Button>
    </div>
  );
}
