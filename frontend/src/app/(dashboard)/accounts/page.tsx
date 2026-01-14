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
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConnectAccountDialog } from '@/components/accounts/connect-account-dialog';
import { BankIcon } from '@/components/accounts/bank-icon';
import { getBankConfig } from '@/lib/bank-colors';
import type { Account } from '@/types/transaction';

// Dados fictícios para visualização
const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Banco do Brasil',
    type: 'checking',
    balance: 28450.30,
    currency: 'BRL',
    isActive: true,
    provider: 'bb',
    providerAccountId: 'bb-567890',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Nubank',
    type: 'checking',
    balance: 8730.20,
    currency: 'BRL',
    isActive: true,
    provider: 'nubank',
    providerAccountId: 'nubank-12345678',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Inter',
    type: 'checking',
    balance: 5300.00,
    currency: 'BRL',
    isActive: true,
    provider: 'inter',
    providerAccountId: 'inter-9876543',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Caixa',
    type: 'savings',
    balance: 2800.00,
    currency: 'BRL',
    isActive: true,
    provider: 'caixa',
    providerAccountId: 'caixa-123456',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Nubank',
    type: 'credit_card',
    balance: -3240.50,
    currency: 'BRL',
    isActive: true,
    provider: 'nubank',
    providerAccountId: 'nubank-cc-4532',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Inter',
    type: 'credit_card',
    balance: -1890.00,
    currency: 'BRL',
    isActive: true,
    provider: 'inter',
    providerAccountId: 'inter-cc-8821',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Banco do Brasil',
    type: 'credit_card',
    balance: -580.00,
    currency: 'BRL',
    isActive: true,
    provider: 'bb',
    providerAccountId: 'bb-cc-1009',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Dados fictícios de transações para atividade recente
const mockTransactions = [
  {
    id: '1',
    type: 'income',
    description: 'Depósito recebido',
    account: 'Banco do Brasil',
    amount: 5000.00,
    date: new Date(),
    time: '14:30'
  },
  {
    id: '2',
    type: 'expense',
    description: 'Transferência enviada',
    account: 'Nubank → Inter',
    amount: 1200.00,
    date: new Date(),
    time: '10:15'
  },
  {
    id: '3',
    type: 'expense',
    description: 'Pagamento de fatura',
    account: 'Nubank',
    amount: 3240.50,
    date: new Date(Date.now() - 86400000),
    time: '16:45'
  },
  {
    id: '4',
    type: 'income',
    description: 'Aplicação poupança',
    account: 'Caixa',
    amount: 500.00,
    date: new Date(Date.now() - 172800000),
    time: ''
  },
];

export default function AccountsPage() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const accounts = mockAccounts;

  // Separar contas bancárias de cartões
  const bankAccounts = accounts.filter(acc => acc.type !== 'credit_card');
  const creditCards = accounts.filter(acc => acc.type === 'credit_card');
  const savingsAccounts = accounts.filter(acc => acc.type === 'savings');

  // Calcular totais
  const totalBalance = bankAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const totalCreditLimit = creditCards.reduce((sum, acc) => {
    const limit = Math.abs(Number(acc.balance)) * 3; // Mock
    return sum + limit;
  }, 0);
  const totalAvailableLimit = totalCreditLimit - creditCards.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
  const totalInvested = savingsAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
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
              <p className="text-xs text-gray-500">{creditCards.length} cartões ativos</p>
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
                      {account.type === 'checking' ? 'Conta Corrente' : 'Conta Poupança'} • 
                      Ag: {account.providerAccountId?.slice(-4) || '0001'} • 
                      CC: {account.providerAccountId?.slice(-6) || '000000-0'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{bankConfig.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(Number(account.balance))}
                    </div>
                    <p className="text-sm text-green-600">+R$ 2.340,00 este mês</p>
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
              {creditCards.map((card) => {
                const bankConfig = getBankConfig(card.name);
                const currentBill = Math.abs(Number(card.balance));
                const creditLimit = currentBill * 3; // Mock
                const availableLimit = creditLimit - currentBill;
                const lastDigits = card.providerAccountId?.slice(-4) || '0000';
                
                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center p-2"
                          style={{ backgroundColor: `${bankConfig.primaryColor}20` }}
                        >
                          <BankIcon 
                            bankName={card.name}
                            size={20}
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{card.name}</h3>
                          <p className="text-sm text-gray-500">**** {lastDigits}</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-gray-200 mb-4" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Fatura atual</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(currentBill)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Limite disponível</p>
                        <p className="text-sm font-semibold text-gray-700">{formatCurrency(availableLimit)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Vencimento: 15/02/2025</p>
                  </div>
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
              {mockTransactions.map((transaction) => (
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
                    <p className="text-xs text-gray-500">{transaction.account}</p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex justify-center pt-2">
                <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
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
