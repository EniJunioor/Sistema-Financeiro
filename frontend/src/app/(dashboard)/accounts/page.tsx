'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Building2,
  Wallet,
  CreditCard,
  PiggyBank,
  Search,
  ChevronDown,
  MoreVertical,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConnectAccountDialog } from '@/components/accounts/connect-account-dialog';
import { BankIcon } from '@/components/accounts/bank-icon';
import { WalletCreditCard } from '@/components/accounts/wallet-credit-card';
import { getBankConfig } from '@/lib/bank-colors';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import type { Account } from '@/types/transaction';

export default function AccountsPage() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: hasAccountsError,
    error: accountsError,
  } = useAccounts();

  // Atividade recente: as últimas movimentações em todas as contas.
  const { transactions: recentTransactions, isLoading: isLoadingTransactions } =
    useTransactions({ limit: 5, page: 1 });

  const accounts = useMemo<Account[]>(() => accountsData ?? [], [accountsData]);

  // Separar contas bancárias de cartões
  const bankAccounts = accounts.filter(acc => acc.type !== 'credit_card');
  const creditCards = accounts.filter(acc => acc.type === 'credit_card');
  const savingsAccounts = accounts.filter(acc => acc.type === 'savings');

  // Calcular totais
  const totalBalance = bankAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  // Cartões sem limite cadastrado ficam de fora do cálculo: melhor mostrar um
  // limite menor do que inventar um valor.
  const cardsWithLimit = creditCards.filter(
    acc => acc.creditLimit !== null && acc.creditLimit !== undefined,
  );
  const totalCreditLimit = cardsWithLimit.reduce(
    (sum, acc) => sum + Number(acc.creditLimit),
    0,
  );
  const totalCreditUsed = cardsWithLimit.reduce(
    (sum, acc) => sum + Math.abs(Number(acc.balance)),
    0,
  );
  const totalAvailableLimit = totalCreditLimit - totalCreditUsed;
  const totalInvested = savingsAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  // Filtrar contas por busca
  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return bankAccounts;
    return bankAccounts.filter(acc => 
      acc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bankAccounts, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas Bancárias</h1>
          <p className="text-gray-600 mt-1">Gerencie suas contas e cartões</p>
        </div>
        <Button onClick={() => setShowConnectDialog(true)} className="bg-black hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {hasAccountsError && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Não foi possível carregar suas contas</p>
              <p className="text-sm text-red-700 mt-1">
                {(accountsError as Error)?.message ?? 'Tente novamente em alguns instantes.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Saldo Total */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Saldo Total</CardTitle>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">{bankAccounts.length} contas ativas</p>
              <Badge variant="outline" className="text-xs bg-gray-50">Ativa</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Limite Disponível */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Limite Disponível</CardTitle>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalAvailableLimit)}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {cardsWithLimit.length < creditCards.length
                  ? `${cardsWithLimit.length} de ${creditCards.length} cartões com limite cadastrado`
                  : `${creditCards.length} cartões ativos`}
              </p>
              <Badge variant="outline" className="text-xs bg-gray-50">Cartões</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Investido */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Investido</CardTitle>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvested)}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">{savingsAccounts.length} contas poupança</p>
              <Badge variant="outline" className="text-xs bg-gray-50">Poupança</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Minhas Contas - Full Width */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Minhas Contas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48 h-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                <SelectItem value="checking">Conta Corrente</SelectItem>
                <SelectItem value="savings">Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingAccounts && (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando contas...</span>
            </div>
          )}

          {!isLoadingAccounts && filteredAccounts.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Building2 className="h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">
                {searchTerm ? 'Nenhuma conta encontrada' : 'Você ainda não tem contas'}
              </p>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? 'Tente outro termo de busca.'
                  : 'Conecte uma conta bancária para começar a acompanhar seus saldos.'}
              </p>
            </div>
          )}

          {filteredAccounts.map((account) => {
            const bankConfig = getBankConfig(account.name);
            return (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 p-2"
                    style={{ backgroundColor: `${bankConfig.primaryColor}20` }}
                  >
                    <BankIcon 
                      bankName={account.name}
                      size={24}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      {account.type === 'savings' && (
                        <Badge variant="outline" className="text-xs bg-gray-50">Poupança</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {account.type === 'checking' ? 'Conta Corrente' : 'Conta Poupança'}
                      {account.providerAccountId && ` • Nº ${account.providerAccountId.slice(-6)}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{bankConfig.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(Number(account.balance))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {account.lastSyncAt
                        ? `Sincronizado ${formatDate(account.lastSyncAt)}`
                        : 'Nunca sincronizado'}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                    <MoreVertical className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bottom Section - Two Columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Cartões de Crédito */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Cartões de Crédito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAccounts && (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Carregando cartões...</span>
                </div>
              )}

              {!isLoadingAccounts && creditCards.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <CreditCard className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">Nenhum cartão de crédito cadastrado</p>
                </div>
              )}

              {creditCards.map((card) => {
                return (
                  <WalletCreditCard
                    key={card.id}
                    account={card}
                    cardholderName="USUÁRIO"
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Atividade Recente */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingTransactions && (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Carregando...</span>
                </div>
              )}

              {!isLoadingTransactions && recentTransactions.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">
                  Nenhuma movimentação recente
                </p>
              )}

              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {transaction.type === 'income' ? (
                      <ArrowDown className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {transaction.account?.name ?? 'Sem conta vinculada'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(Number(transaction.amount)))}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connect Account Dialog */}
      <ConnectAccountDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </div>
  );
}
