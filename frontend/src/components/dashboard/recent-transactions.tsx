'use client';

import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, MoreHorizontal, Building2, CreditCard, Wallet, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MerchantIcon } from './merchant-icon';
import type { Transaction } from '@/types/dashboard';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const router = useRouter();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  const handleTransactionClick = (transaction: Transaction) => {
    // Navegar para a página de transações baseado no tipo
    if (transaction.type === 'income') {
      router.push('/transactions/income');
    } else if (transaction.type === 'expense') {
      router.push('/transactions/expenses');
    } else if (transaction.type === 'transfer') {
      router.push('/transactions/transfers');
    } else {
      router.push('/transactions/dashboard');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Ícones por tipo de conta
  const accountTypeIcons = {
    checking: Building2,
    savings: Wallet,
    credit_card: CreditCard,
    investment: TrendingUp,
  };

  // Função para obter ícone baseado no tipo de conta ou usar ícone padrão da empresa
  const getAccountIcon = (accountType?: Transaction['accountType']) => {
    if (accountType && accountType in accountTypeIcons) {
      const Icon = accountTypeIcons[accountType as keyof typeof accountTypeIcons];
      return <Icon className="h-4 w-4 text-gray-700" />;
    }
    // Ícone padrão da empresa (Building2)
    return <Building2 className="h-4 w-4 text-gray-700" />;
  };

  const getAmountColor = (type: Transaction['type']) => {
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

  const getAmountPrefix = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return '+';
      case 'expense':
        return '-';
      case 'transfer':
        return '';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Suas últimas movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Suas últimas movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">Nenhuma transação encontrada</div>
            <p className="text-sm text-gray-400">
              Suas transações aparecerão aqui quando você começar a usar a plataforma.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <CardTitle className="text-lg sm:text-xl">Transações Recentes</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Suas últimas movimentações financeiras</CardDescription>
        </div>
        <Link href="/transactions/dashboard" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transactions.slice(0, 8).map((transaction) => (
            <div
              key={transaction.id}
              onClick={() => handleTransactionClick(transaction)}
              className="flex items-center justify-between group hover:bg-emerald-50 cursor-pointer -mx-2 px-2 sm:px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent hover:border-emerald-200 hover:shadow-sm"
            >
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200">
                  <MerchantIcon 
                    merchantName={transaction.description}
                    size={18}
                    className="text-gray-700 sm:w-5 sm:h-5"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                    {transaction.description}
                  </p>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 mt-1 flex-wrap">
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {formatDate(transaction.date)}
                    </p>
                    {transaction.categoryName && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5"
                          style={{ 
                            backgroundColor: transaction.categoryColor ? `${transaction.categoryColor}20` : undefined,
                            color: transaction.categoryColor || undefined 
                          }}
                        >
                          {transaction.categoryName}
                        </Badge>
                      </>
                    )}
                    {transaction.accountName && (
                      <>
                        <span className="text-xs text-gray-300 hidden sm:inline">•</span>
                        <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
                          {transaction.accountName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
                <span className={`text-xs sm:text-sm font-semibold ${getAmountColor(transaction.type)}`}>
                  {getAmountPrefix(transaction.type)}{formatCurrency(Math.abs(transaction.amount))}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {transactions.length > 8 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/transactions/dashboard">
              <Button variant="ghost" className="w-full text-sm hover:bg-emerald-50 hover:text-emerald-700">
                Ver mais {transactions.length - 8} transações
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}