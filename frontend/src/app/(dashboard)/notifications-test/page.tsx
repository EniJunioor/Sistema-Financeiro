'use client';

import React from 'react';
import { NotificationDemo } from '@/components/notifications/notification-demo';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/use-notifications';

export default function NotificationsTestPage() {
  const { 
    notifications, 
    unreadCount, 
    stats, 
    isConnected,
    settings 
  } = useNotifications();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teste de Notificações</h1>
          <p className="text-gray-600 mt-2">
            Página para testar o sistema de notificações
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            WebSocket: {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
          <NotificationCenter />
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Notificação</CardTitle>
          <CardDescription>
            Informações sobre suas notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
              <div className="text-sm text-gray-500">Não Lidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.recent || 0}</div>
              <div className="text-sm text-gray-500">Recentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{settings.maxVisible}</div>
              <div className="text-sm text-gray-500">Max Visível</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Component */}
      <NotificationDemo />

      {/* Settings Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Atuais</CardTitle>
          <CardDescription>
            Suas configurações de notificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="font-medium">Som</div>
              <div className="text-sm text-gray-500">
                {settings.sound ? 'Ativado' : 'Desativado'}
              </div>
            </div>
            <div>
              <div className="font-medium">Auto-ocultar</div>
              <div className="text-sm text-gray-500">
                {settings.autoHide ? `${settings.autoHideDuration / 1000}s` : 'Desativado'}
              </div>
            </div>
            <div>
              <div className="font-medium">Posição</div>
              <div className="text-sm text-gray-500">
                {settings.position}
              </div>
            </div>
            <div>
              <div className="font-medium">Prévia</div>
              <div className="text-sm text-gray-500">
                {settings.showPreview ? 'Ativada' : 'Desativada'}
              </div>
            </div>
            <div>
              <div className="font-medium">Vibração</div>
              <div className="text-sm text-gray-500">
                {settings.vibration ? 'Ativada' : 'Desativada'}
              </div>
            </div>
            <div>
              <div className="font-medium">Max Visível</div>
              <div className="text-sm text-gray-500">
                {settings.maxVisible}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notificações Recentes</CardTitle>
            <CardDescription>
              Últimas {Math.min(5, notifications.length)} notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id}
                  className="flex items-start space-x-3 p-3 border rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.isRead ? 'bg-gray-300' : 'bg-blue-600'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-gray-600">{notification.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <Badge variant={
                    notification.type === 'success' ? 'default' :
                    notification.type === 'error' ? 'destructive' :
                    notification.type === 'warning' ? 'secondary' : 'outline'
                  }>
                    {notification.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}