'use client';

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubscriptionsSection } from '@/components/dashboard/subscriptions-section';

export default function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data - substituir com dados reais da API
  const subscriptions = [
    {
      id: '1',
      name: 'Netflix',
      amount: 55.90,
      nextPaymentDate: '2024-08-15',
      status: 'scheduled' as const,
      logo: 'N',
    },
    {
      id: '2',
      name: 'Spotify',
      amount: 21.90,
      nextPaymentDate: '2024-08-15',
      status: 'active' as const,
      logo: 'S',
    },
    {
      id: '3',
      name: 'Amazon Prime',
      amount: 9.90,
      nextPaymentDate: '2024-08-20',
      status: 'active' as const,
      logo: 'A',
    },
  ];

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
          className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Assinatura
        </Button>
      </div>

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

      {/* Subscriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubscriptions.map((subscription) => (
          <Card key={subscription.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {subscription.logo || subscription.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{subscription.name}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {new Date(subscription.nextPaymentDate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={subscription.status === 'active' ? 'default' : 'secondary'}
                  className={
                    subscription.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-700'
                  }
                >
                  {subscription.status === 'active' ? 'Ativa' : 'Agendada'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(subscription.amount)}
                  </p>
                  <p className="text-sm text-gray-500">Próximo pagamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubscriptions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Nenhuma assinatura encontrada</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                // Abrir modal de criação
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Assinatura
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
