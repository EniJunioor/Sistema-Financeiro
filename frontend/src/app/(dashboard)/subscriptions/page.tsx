'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Filter, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubscriptionDialog } from '@/components/subscriptions/subscription-dialog';
import { useDeleteSubscription, useSubscriptions } from '@/hooks/use-subscriptions';
import type { Subscription, SubscriptionFrequency } from '@/lib/subscriptions-api';

const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/**
 * Uma assinatura ativa cuja próxima cobrança já passou continua "ativa" no
 * backend; para o usuário, o que importa é se a cobrança está por vir.
 */
function getStatus(subscription: Subscription): 'active' | 'scheduled' | 'cancelled' {
  if (!subscription.isActive) return 'cancelled';
  return new Date(subscription.nextPaymentDate) > new Date() ? 'scheduled' : 'active';
}

const STATUS_LABELS = {
  active: 'Ativa',
  scheduled: 'Agendada',
  cancelled: 'Cancelada',
} as const;

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-700',
} as const;

export default function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const { data: subscriptions, isLoading, isError, error } = useSubscriptions();
  const deleteSubscription = useDeleteSubscription();

  const filteredSubscriptions = useMemo(() => {
    return (subscriptions ?? []).filter((sub) => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || getStatus(sub) === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [subscriptions, searchTerm, filterStatus]);

  const monthlyTotal = useMemo(() => {
    // Normaliza cada frequência para um custo mensal aproximado.
    const perMonth: Record<SubscriptionFrequency, number> = {
      daily: 30,
      weekly: 4.345,
      monthly: 1,
      yearly: 1 / 12,
    };

    return (subscriptions ?? [])
      .filter((sub) => sub.isActive)
      .reduce((total, sub) => total + Number(sub.amount) * perMonth[sub.frequency], 0);
  }, [subscriptions]);

  const openCreateDialog = () => {
    setEditingSubscription(null);
    setDialogOpen(true);
  };

  const openEditDialog = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setDialogOpen(true);
  };

  const handleDelete = async (subscription: Subscription) => {
    await deleteSubscription.mutateAsync(subscription.id);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Assinaturas</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Gerencie todas as suas assinaturas e pagamentos recorrentes
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Assinatura
        </Button>
      </div>

      {isError && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">
                Não foi possível carregar suas assinaturas
              </p>
              <p className="text-sm text-red-700 mt-1">
                {(error as Error)?.message ?? 'Tente novamente em alguns instantes.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      {!isLoading && (subscriptions?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-5">
            <div>
              <p className="text-sm text-gray-500">Custo mensal estimado</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyTotal)}</p>
            </div>
            <p className="text-sm text-gray-500">
              {subscriptions?.filter((s) => s.isActive).length ?? 0} assinatura(s) ativa(s)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar assinaturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="scheduled">Agendadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Carregando assinaturas...</span>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions List */}
      {!isLoading && filteredSubscriptions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map((subscription) => {
            const status = getStatus(subscription);

            return (
              <Card key={subscription.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {subscription.logo || subscription.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{subscription.name}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {formatDate(subscription.nextPaymentDate)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={STATUS_STYLES[status]}>
                      {STATUS_LABELS[status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(Number(subscription.amount))}
                      </p>
                      <p className="text-sm text-gray-500">
                        {FREQUENCY_LABELS[subscription.frequency]}
                        {subscription.account?.name && ` • ${subscription.account.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${subscription.name}`}
                        onClick={() => openEditDialog(subscription)}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover ${subscription.name}`}
                        disabled={deleteSubscription.isPending}
                        onClick={() => handleDelete(subscription)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filteredSubscriptions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Nenhuma assinatura corresponde aos filtros'
                : 'Você ainda não cadastrou assinaturas'}
            </p>
            <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Assinatura
            </Button>
          </CardContent>
        </Card>
      )}

      <SubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={editingSubscription}
      />
    </div>
  );
}
