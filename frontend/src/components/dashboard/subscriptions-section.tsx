'use client';

import { Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  nextPaymentDate: string;
  logo?: string;
  status?: 'active' | 'scheduled' | 'cancelled';
}

interface SubscriptionsSectionProps {
  subscriptions?: Subscription[];
  isLoading?: boolean;
  onAdd?: () => void;
}

export function SubscriptionsSection({ 
  subscriptions, 
  isLoading = false,
  onAdd 
}: SubscriptionsSectionProps) {
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

  // Mock data - substituir com dados reais
  const mockSubscriptions: Subscription[] = [
    {
      id: '1',
      name: 'Netflix',
      amount: 55.90,
      nextPaymentDate: '2024-08-15',
      status: 'scheduled',
      logo: 'N',
    },
    {
      id: '2',
      name: 'Spotify',
      amount: 21.90,
      nextPaymentDate: '2024-08-15',
      status: 'active',
      logo: 'S',
    },
  ];

  const displaySubscriptions = subscriptions || mockSubscriptions;

  if (isLoading) {
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
            <div
              key={subscription.id}
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
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
