'use client';

import { useState } from 'react';
import { Plus, RefreshCw, CreditCard, Building2, Wallet, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccounts, useSyncStatus, useSyncAllAccounts } from '@/hooks/use-accounts';
import { ConnectAccountDialog } from '@/components/accounts/connect-account-dialog';
import { AccountCard } from '@/components/accounts/account-card';
import { SyncStatusCard } from '@/components/accounts/sync-status-card';
import type { Account } from '@/types/transaction';

const accountTypeIcons = {
  checking: Building2,
  savings: Wallet,
  credit_card: CreditCard,
  investment: TrendingUp,
};

const accountTypeLabels = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit_card: 'Cartão de Crédito',
  investment: 'Investimentos',
};

export default function AccountsPage() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string | undefined>();

  const { data: accounts = [], isLoading, error } = useAccounts();
  const { data: syncStatus } = useSyncStatus();
  const syncAllMutation = useSyncAllAccounts();

  const handleSyncAll = () => {
    syncAllMutation.mutate();
  };

  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.type || 'checking';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const activeAccounts = accounts.filter(account => account.isActive).length;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Erro ao carregar contas. Tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas conectadas e sincronize transações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={syncAllMutation.isPending || accounts.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar Todas
          </Button>
          <Button onClick={() => setShowConnectDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Conectar Conta
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todas as contas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAccounts}</div>
            <p className="text-xs text-muted-foreground">
              de {accounts.length} contas conectadas
            </p>
          </CardContent>
        </Card>

        <SyncStatusCard syncStatus={syncStatus} />
      </div>

      {/* Accounts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Nenhuma conta conectada</h3>
              <p className="text-muted-foreground">
                Conecte suas contas bancárias para começar a sincronizar transações
              </p>
            </div>
            <Button onClick={() => setShowConnectDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Conectar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Account Type Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(undefined)}
            >
              Todas ({accounts.length})
            </Button>
            {Object.entries(groupedAccounts).map(([type, typeAccounts]) => {
              const Icon = accountTypeIcons[type as keyof typeof accountTypeIcons];
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {accountTypeLabels[type as keyof typeof accountTypeLabels]} ({typeAccounts.length})
                </Button>
              );
            })}
          </div>

          {/* Accounts Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts
              .filter(account => !selectedType || account.type === selectedType)
              .map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
          </div>
        </div>
      )}

      {/* Connect Account Dialog */}
      <ConnectAccountDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </div>
  );
}