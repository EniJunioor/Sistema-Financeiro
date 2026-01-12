'use client';

import { useState } from 'react';
import { Eye, EyeOff, Building2, CreditCard, Wallet, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Account } from '@/types/transaction';

interface AccountHeaderProps {
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

export function AccountHeader({ account }: AccountHeaderProps) {
  const [showBalance, setShowBalance] = useState(true);

  const Icon = accountTypeIcons[account.type as keyof typeof accountTypeIcons] || Building2;

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
    if (diffInMinutes < 60) return `Sincronizada há ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Sincronizada há ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Sincronizada há ${diffInDays} dias`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">{account.name}</h2>
                <Badge variant={account.isActive ? 'default' : 'secondary'}>
                  {account.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>
                  {accountTypeLabels[account.type as keyof typeof accountTypeLabels] || account.type}
                </span>
                <span>•</span>
                <span>
                  {providerLabels[account.provider as keyof typeof providerLabels] || account.provider}
                </span>
                <span>•</span>
                <span>{getLastSyncText()}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-3xl font-bold">
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
            <p className="text-sm text-muted-foreground">Saldo atual</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}