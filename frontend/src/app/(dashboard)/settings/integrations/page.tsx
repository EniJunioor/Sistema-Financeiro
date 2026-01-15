'use client';

import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { BankIcon } from '@/components/accounts/bank-icon';
import { getBankConfig } from '@/lib/bank-colors';
import { ConnectAccountDialog } from '@/components/accounts/connect-account-dialog';

interface ConnectedAccount {
  id: string;
  name: string;
  type: string;
  provider: string;
  lastSync: string;
  status: 'connected' | 'error' | 'syncing';
  balance?: number;
}

export default function IntegrationsSettingsPage() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    {
      id: '1',
      name: 'Banco do Brasil',
      type: 'checking',
      provider: 'bb',
      lastSync: 'Há 5 minutos',
      status: 'connected',
      balance: 28450.30,
    },
    {
      id: '2',
      name: 'Nubank',
      type: 'checking',
      provider: 'nubank',
      lastSync: 'Há 2 horas',
      status: 'connected',
      balance: 8730.20,
    },
    {
      id: '3',
      name: 'Inter',
      type: 'credit_card',
      provider: 'inter',
      lastSync: 'Há 1 dia',
      status: 'error',
    },
  ]);

  const availableBanks = [
    { id: 'bb', name: 'Banco do Brasil', icon: 'bb' },
    { id: 'nubank', name: 'Nubank', icon: 'nubank' },
    { id: 'inter', name: 'Inter', icon: 'inter' },
    { id: 'itau', name: 'Itaú', icon: 'itau' },
    { id: 'bradesco', name: 'Bradesco', icon: 'bradesco' },
    { id: 'caixa', name: 'Caixa', icon: 'caixa' },
    { id: 'santander', name: 'Santander', icon: 'santander' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSync = async (accountId: string) => {
    // Simular sincronização
    setConnectedAccounts(prev =>
      prev.map(acc =>
        acc.id === accountId ? { ...acc, status: 'syncing' as const } : acc
      )
    );
    await new Promise(resolve => setTimeout(resolve, 2000));
    setConnectedAccounts(prev =>
      prev.map(acc =>
        acc.id === accountId
          ? { ...acc, status: 'connected' as const, lastSync: 'Agora' }
          : acc
      )
    );
  };

  const handleDisconnect = (accountId: string) => {
    setConnectedAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      case 'syncing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Sincronizando
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Integrações' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CreditCard className="h-8 w-8 mr-3 text-orange-600" />
            Integrações
          </h1>
          <p className="text-gray-600 mt-2">
            Conecte suas contas bancárias e serviços externos
          </p>
        </div>
        <Button onClick={() => setShowConnectDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Conectar Conta
        </Button>
      </div>

      {/* Contas Conectadas */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Contas Conectadas</CardTitle>
          <CardDescription>Gerencie suas contas bancárias conectadas</CardDescription>
        </CardHeader>
        <CardContent>
          {connectedAccounts.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Nenhuma conta conectada</p>
              <p className="text-sm text-gray-500 mb-4">Conecte sua primeira conta para começar</p>
              <Button onClick={() => setShowConnectDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Conectar Conta
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedAccounts.map((account) => {
                const bankConfig = getBankConfig(account.name);
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center p-2"
                        style={{ backgroundColor: `${bankConfig.primaryColor}20` }}
                      >
                        <BankIcon
                          bankName={account.name}
                          size={24}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{account.name}</h3>
                          {getStatusBadge(account.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {account.type === 'checking' ? 'Conta Corrente' : 'Cartão de Crédito'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Última sincronização: {account.lastSync}
                        </p>
                        {account.balance !== undefined && (
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {formatCurrency(account.balance)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(account.id)}
                        disabled={account.status === 'syncing'}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${account.status === 'syncing' ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desconectar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bancos Disponíveis */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Bancos Disponíveis</CardTitle>
          <CardDescription>Conecte-se com os principais bancos do Brasil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableBanks.map((bank) => {
              const isConnected = connectedAccounts.some(acc => acc.provider === bank.id);
              const bankConfig = getBankConfig(bank.name);
              return (
                <button
                  key={bank.id}
                  onClick={() => setShowConnectDialog(true)}
                  disabled={isConnected}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    isConnected
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: `${bankConfig.primaryColor}20` }}
                  >
                    <BankIcon
                      bankName={bank.name}
                      size={24}
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center">{bank.name}</p>
                  {isConnected && (
                    <p className="text-xs text-gray-500 text-center mt-1">Conectado</p>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informações de Segurança */}
      <Card className="border border-gray-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-blue-900">Segurança das Integrações</CardTitle>
              <CardDescription className="text-blue-700">
                Suas credenciais bancárias são armazenadas de forma segura e criptografada.
                Utilizamos protocolos OAuth 2.0 e não armazenamos suas senhas bancárias.
                Todas as conexões são feitas através de APIs oficiais dos bancos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Connect Account Dialog */}
      <ConnectAccountDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </div>
  );
}
