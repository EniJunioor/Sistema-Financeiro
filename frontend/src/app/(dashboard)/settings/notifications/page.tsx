'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationPreferencesComponent } from '@/components/notifications/notification-preferences';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Notificações' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Bell className="h-8 w-8 mr-3 text-blue-600" />
          Configurações de Notificação
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie como e quando você recebe notificações da plataforma
        </p>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
          <CardDescription>
            Configure suas preferências de notificação para manter-se informado sobre suas finanças
            sem ser sobrecarregado com informações desnecessárias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Bell className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <h3 className="font-medium text-blue-900">Notificações em Tempo Real</h3>
              <p className="text-sm text-blue-700 mt-1">
                Receba alertas instantâneos sobre transações e eventos importantes
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Bell className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <h3 className="font-medium text-green-900">Controle Granular</h3>
              <p className="text-sm text-green-700 mt-1">
                Escolha exatamente quais tipos de notificação você deseja receber
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Bell className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <h3 className="font-medium text-purple-900">Múltiplos Canais</h3>
              <p className="text-sm text-purple-700 mt-1">
                Email, push, SMS e notificações do navegador disponíveis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <NotificationPreferencesComponent />

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Precisa de Ajuda?</CardTitle>
          <CardDescription>
            Informações sobre como funcionam as notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Tipos de Notificação</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Transações:</strong> Novas transações, categorizações automáticas, duplicatas detectadas</li>
                <li><strong>Metas:</strong> Progresso de metas, lembretes, conquistas de gamificação</li>
                <li><strong>Investimentos:</strong> Atualizações de cotações, alertas de performance, rebalanceamento</li>
                <li><strong>Segurança:</strong> Logins suspeitos, alterações de senha, ativação de 2FA</li>
                <li><strong>Sistema:</strong> Manutenções programadas, novas funcionalidades, atualizações</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Horário Silencioso</h4>
              <p className="text-sm text-gray-600">
                Durante o horário silencioso, apenas notificações urgentes de segurança serão enviadas.
                Todas as outras notificações serão agrupadas e enviadas no próximo horário ativo.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Notificações Push</h4>
              <p className="text-sm text-gray-600">
                Para receber notificações push, você precisa permitir notificações no seu navegador
                e manter a aba da plataforma aberta ou usar nosso aplicativo mobile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}