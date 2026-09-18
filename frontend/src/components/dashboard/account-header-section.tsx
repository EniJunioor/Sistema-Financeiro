'use client';

import { Plus, Settings, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccounts } from '@/hooks/use-accounts';

interface AccountHeaderSectionProps {
  selectedAccount?: string;
  onAccountChange?: (accountId: string) => void;
  onManageBalance?: () => void;
  onNewPayment?: () => void;
}

/** Exibe os últimos dígitos do identificador da conta, quando houver. */
function formatAccountNumber(providerAccountId?: string | null): string {
  if (!providerAccountId) return '';
  return `•••• ${providerAccountId.slice(-4)}`;
}

export function AccountHeaderSection({
  selectedAccount,
  onAccountChange,
  onManageBalance,
  onNewPayment,
}: AccountHeaderSectionProps) {
  const { data: accounts, isLoading } = useAccounts({ isActive: true });

  const accountList = accounts ?? [];
  const currentAccountId = selectedAccount ?? accountList[0]?.id;
  const currentAccount = accountList.find((account) => account.id === currentAccountId);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white">Contas</h2>

        {isLoading ? (
          <div className="h-10 w-[180px] rounded-md bg-gray-800 animate-pulse" />
        ) : accountList.length === 0 ? (
          <span className="text-sm text-gray-400">Nenhuma conta conectada</span>
        ) : (
          <Select value={currentAccountId} onValueChange={onAccountChange}>
            <SelectTrigger className="w-[180px] border-gray-600 bg-gray-800 text-white">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-400" />
                <SelectValue>
                  {currentAccount
                    ? formatAccountNumber(currentAccount.providerAccountId) || currentAccount.name
                    : 'Selecione'}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {accountList.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                  {formatAccountNumber(account.providerAccountId) &&
                    ` - ${formatAccountNumber(account.providerAccountId)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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
