'use client';

import React from 'react';
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationDemo() {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    showWithActions, 
    showConfirmation,
    requestPermission,
    subscribeToPush,
  } = useNotifications();

  const handleShowSuccess = () => {
    showSuccess(
      'Transação Adicionada!',
      'Sua transação de R$ 150,00 foi adicionada com sucesso.',
      { actionUrl: '/transactions' }
    );
  };

  const handleShowError = () => {
    showError(
      'Erro de Sincronização',
      'Não foi possível sincronizar com o banco. Tente novamente.',
      { 
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => console.log('Retry clicked'),
            variant: 'default',
          },
          {
            label: 'Ver Detalhes',
            action: () => console.log('Details clicked'),
            variant: 'outline',
          },
        ]
      }
    );
  };

  const handleShowWarning = () => {
    showWarning(
      'Meta em Risco',
      'Você já gastou 80% do orçamento mensal. Cuidado para não ultrapassar!',
      { actionUrl: '/goals' }
    );
  };

  const handleShowInfo = () => {
    showInfo(
      'Nova Funcionalidade',
      'Agora você pode categorizar transações automaticamente com IA.',
      { duration: 8000 }
    );
  };

  const handleShowWithActions = () => {
    showWithActions(
      'Duplicata Detectada',
      'Encontramos uma transação similar. Deseja manter ambas?',
      [
        {
          label: 'Manter Ambas',
          action: () => console.log('Keep both clicked'),
          variant: 'default',
        },
        {
          label: 'Remover Duplicata',
          action: () => console.log('Remove duplicate clicked'),
          variant: 'destructive',
        },
        {
          label: 'Revisar Depois',
          action: () => console.log('Review later clicked'),
          variant: 'outline',
        },
      ]
    );
  };

  const handleShowConfirmation = () => {
    showConfirmation(
      'Excluir Transação',
      'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      () => {
        showSuccess('Transação Excluída', 'A transação foi removida com sucesso.');
      },
      () => {
        showInfo('Cancelado', 'A transação foi mantida.');
      }
    );
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      showSuccess('Permissão Concedida', 'Você receberá notificações do navegador.');
    } else {
      showError('Permissão Negada', 'Não foi possível ativar notificações do navegador.');
    }
  };

  const handleSubscribePush = async () => {
    try {
      const success = await subscribeToPush();
      if (success) {
        showSuccess('Push Ativado', 'Notificações push foram ativadas com sucesso.');
      } else {
        showError('Erro no Push', 'Não foi possível ativar notificações push.');
      }
    } catch (error) {
      showError('Erro no Push', 'Falha ao configurar notificações push.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Demo de Notificações
        </CardTitle>
        <CardDescription>
          Teste os diferentes tipos de notificação do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button onClick={handleShowSuccess} className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Sucesso
          </Button>
          
          <Button onClick={handleShowError} variant="destructive" className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Erro
          </Button>
          
          <Button onClick={handleShowWarning} variant="outline" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Aviso
          </Button>
          
          <Button onClick={handleShowInfo} variant="secondary" className="flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Info
          </Button>
          
          <Button onClick={handleShowWithActions} variant="outline">
            Com Ações
          </Button>
          
          <Button onClick={handleShowConfirmation} variant="destructive">
            Confirmação
          </Button>
          
          <Button onClick={handleRequestPermission} variant="outline">
            Pedir Permissão
          </Button>
          
          <Button onClick={handleSubscribePush} variant="outline">
            Ativar Push
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}