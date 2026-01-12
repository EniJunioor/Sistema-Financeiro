'use client';

import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SyncStatus } from '@/lib/accounts-api';

interface SyncStatusCardProps {
  syncStatus?: SyncStatus;
}

export function SyncStatusCard({ syncStatus }: SyncStatusCardProps) {
  const getStatusIcon = () => {
    if (!syncStatus) return <Clock className="h-4 w-4 text-muted-foreground" />;
    
    if (syncStatus.isRunning) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (syncStatus.lastSync) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!syncStatus) return 'Carregando...';
    
    if (syncStatus.isRunning) {
      return 'Sincronizando';
    }
    
    if (syncStatus.lastSync) {
      const lastSync = new Date(syncStatus.lastSync);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Sincronizado agora';
      if (diffInMinutes < 60) return `Há ${diffInMinutes}min`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `Há ${diffInHours}h`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `Há ${diffInDays}d`;
    }
    
    return 'Nunca sincronizado';
  };

  const getStatusBadge = () => {
    if (!syncStatus) return null;
    
    if (syncStatus.isRunning) {
      return <Badge variant="default">Em andamento</Badge>;
    }
    
    if (syncStatus.lastSync) {
      return <Badge variant="secondary">Atualizado</Badge>;
    }
    
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getNextSyncText = () => {
    if (!syncStatus?.nextSync) return null;
    
    const nextSync = new Date(syncStatus.nextSync);
    const now = new Date();
    const diffInMinutes = Math.floor((nextSync.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes <= 0) return 'Em breve';
    if (diffInMinutes < 60) return `Em ${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Em ${diffInHours}h`;
    
    return nextSync.toLocaleDateString('pt-BR');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Status da Sincronização</CardTitle>
        {getStatusIcon()}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{getStatusText()}</div>
            {getStatusBadge()}
          </div>
          
          <div className="space-y-1">
            {syncStatus?.queueSize !== undefined && syncStatus.queueSize > 0 && (
              <p className="text-xs text-muted-foreground">
                {syncStatus.queueSize} conta(s) na fila
              </p>
            )}
            
            {getNextSyncText() && (
              <p className="text-xs text-muted-foreground">
                Próxima sincronização: {getNextSyncText()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}