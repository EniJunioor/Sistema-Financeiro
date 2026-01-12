'use client';

import { Wifi, WifiOff, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRealtimeUpdates } from '@/hooks/use-dashboard';

export function RealtimeStatus() {
  const { isConnected, lastMessage } = useRealtimeUpdates();

  const formatLastUpdate = (timestamp?: string) => {
    if (!timestamp) return 'Nunca';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Agora mesmo';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}min atrás`;
    } else {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Check if we're in demo mode (no real API connection)
  const isDemoMode = !process.env.NEXT_PUBLIC_API_URL || process.env.NODE_ENV === 'development';

  return (
    <div className="flex items-center space-x-3 text-sm text-gray-500">
      <div className="flex items-center space-x-1">
        {isDemoMode ? (
          <>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Modo Demo
            </Badge>
          </>
        ) : isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Conectado
            </Badge>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Desconectado
            </Badge>
          </>
        )}
      </div>
      
      {!isDemoMode && (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>Última atualização: {formatLastUpdate(lastMessage?.timestamp)}</span>
        </div>
      )}
    </div>
  );
}