'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  RefreshCw, 
  Settings, 
  Download, 
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useAccount, 
  useAccountTransactions, 
  useSyncAccount 
} from '@/hooks/use-accounts';
import { AccountHeader } from '@/components/accounts/account-header';
import { AccountSettings } from '@/components/accounts/account-settings';
import { TransactionsList } from '@/components/accounts/transactions-list';
import { PendingTransactions } from '@/components/accounts/pending-transactions';
import { AccountStats } from '@/components/accounts/account-stats';

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
  });

  const { data: account, isLoading: accountLoading, error: accountError } = useAccount(accountId);
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading 
  } = useAccountTransactions(accountId, dateRange.startDate, dateRange.endDate);
  
  const syncMutation = useSyncAccount();

  const handleSync = () => {
    syncMutation.mutate({ 
      accountId,
      data: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }
    });
  };

  const handleDateRangeChange = (newRange: { startDate: string; endDate: string }) => {
    setDateRange(newRange);
  };

  if (accountError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Erro ao carregar conta. Tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accountLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Conta não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const transactions = transactionsData?.data || [];
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const approvedTransactions = transactions.filter(t => t.status === 'approved');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
            <p className="text-muted-foreground">
              {account.provider} • {account.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Account Header with Balance and Status */}
      <AccountHeader account={account} />

      {/* Account Stats */}
      <AccountStats 
        account={account}
        transactions={approvedTransactions}
        dateRange={dateRange}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">
            Transações
            {approvedTransactions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {approvedTransactions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes
            {pendingTransactions.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingTransactions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsList
            transactions={approvedTransactions}
            isLoading={transactionsLoading}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <PendingTransactions
            transactions={pendingTransactions}
            isLoading={transactionsLoading}
            accountId={accountId}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <AccountSettings account={account} />
        </TabsContent>
      </Tabs>
    </div>
  );
}