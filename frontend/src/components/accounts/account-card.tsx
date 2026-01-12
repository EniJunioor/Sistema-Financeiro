'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MoreVertical, 
  RefreshCw, 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff,
  Building2,
  CreditCard,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useSyncAccount, useDisconnectAccount, useUpdateAccount } from '@/hooks/use-accounts';
import type { Account } from '@/types/transaction';

interface AccountCardProps {
  account: Account;
}

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

const providerLabels = {
  plaid: 'Plaid',
  truelayer: 'TrueLayer',
  pluggy: 'Pluggy',
  belvo: 'Belvo',
  manual: 'Manual',
};

export function AccountCard({ account }: AccountCardProps) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const syncMutation = useSyncAccount();
  const disconnectMutation = useDisconnectAccount();
  const updateMutation = useUpdateAccount();

  const Icon = accountTypeIcons[account.type as keyof typeof accountTypeIcons] || Building2;

  const handleSync = () => {
    syncMutation.mutate({ accountId: account.id });
  };

  const handleToggleActive = () => {
    updateMutation.mutate({
      accountId: account.id,
      data: { isActive: !account.isActive }
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(account.id);
    setShowDisconnectDialog(false);
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: account.currency || 'BRL',
    }).format(balance);
  };

  const getLastSyncText = () => {
    if (!account.lastSyncAt) return 'Nunca sincronizada';
    
    const lastSync = new Date(account.lastSyncAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Sincronizada agora';
    if (diffInMinutes < 60) return `Sincronizada há ${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Sincronizada há ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Sincronizada há ${diffInDays}d`;
  };

  return (
    <>
      <Card className={`transition-all hover:shadow-md ${!account.isActive ? 'opacity-60' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium leading-none">{account.name}</p>
              <p className="text-xs text-muted-foreground">
                {accountTypeLabels[account.type as keyof typeof accountTypeLabels] || account.type}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/accounts/${account.id}`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSync}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sincronizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                {account.isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDisconnectDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Desconectar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Balance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">
                  {showBalance ? formatBalance(Number(account.balance)) : '••••••'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Status and Provider */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant={account.isActive ? 'default' : 'secondary'}>
                  {account.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
                <Badge variant="outline">
                  {providerLabels[account.provider as keyof typeof providerLabels] || account.provider}
                </Badge>
              </div>
            </div>

            {/* Last Sync */}
            <div className="text-xs text-muted-foreground">
              {getLastSyncText()}
            </div>

            {/* Action Button */}
            <Button asChild variant="outline" className="w-full">
              <Link href={`/accounts/${account.id}`}>
                Ver Transações
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desconectar a conta "{account.name}"? 
              Todas as transações importadas serão mantidas, mas a sincronização automática será interrompida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}