'use client';

import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUpcomingSubscriptions } from '@/hooks/use-subscriptions';

interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  nextPaymentDate: string;
  logo?: string | null;
  status?: 'active' | 'scheduled' | 'cancelled';
}

interface SubscriptionsSectionProps {
  /** Quando omitido, o componente busca as próximas cobranças na API. */
  subscriptions?: SubscriptionItem[];
  isLoading?: boolean;
  onAdd?: () => void;
}

export function SubscriptionsSection({
  subscriptions,
  isLoading = false,
  onAdd,
}: SubscriptionsSectionProps) {
  // Só consulta a API quando a lista não vem pronta do componente pai.
  const { data: fetchedSubscriptions, isLoading: isFetching } = useUpcomingSubscriptions(30);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const displaySubscriptions: SubscriptionItem[] =
    subscriptions ??
    (fetchedSubscriptions ?? []).slice(0, 4).map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      amount: Number(subscription.amount),
      nextPaymentDate: subscription.nextPaymentDate,
      logo: subscription.logo,
      status: new Date(subscription.nextPaymentDate) > new Date() ? 'scheduled' : 'active',
    }));

  if (isLoading || (!subscriptions && isFetching)) {
    return (
      <Card className="bg-gray-800 border-gray-700 rounded-xl">
        <CardHeader>
          <div className="h-6 bg-gray-700 rounded animate-pulse w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getLogoColor = (name: string) => {
    if (name.toLowerCase().includes('netflix')) return 'bg-red-600';
    if (name.toLowerCase().includes('spotify')) return 'bg-green-500';
    return 'bg-blue-600';
  };

  return (
    <Card className="bg-gray-800 border-gray-700 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold text-white">Assinaturas</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white hover:bg-gray-700"
          onClick={onAdd}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {displaySubscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Nenhuma assinatura cadastrada</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={onAdd}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Assinatura
            </Button>
          </div>
        ) : (
          displaySubscriptions.map((subscription) => (
            <Link
              key={subscription.id}
              href="/subscriptions"
              className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 ${getLogoColor(subscription.name)} rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold`}>
                  {subscription.logo || subscription.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {formatCurrency(subscription.amount)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDate(subscription.nextPaymentDate)}
                  </p>
                  {subscription.status === 'scheduled' && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs bg-gray-600 text-gray-300 border-gray-500">
                        {formatCurrency(subscription.amount)} Agendado
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
