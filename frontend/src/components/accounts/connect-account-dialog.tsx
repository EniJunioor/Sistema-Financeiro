'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupportedProviders, useGetAuthUrl, useConnectAccount } from '@/hooks/use-accounts';
import type { OpenBankingProvider } from '@/lib/accounts-api';

interface ConnectAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ConnectionState {
  step: 'select-provider' | 'authenticating' | 'connecting' | 'success' | 'error';
  provider?: OpenBankingProvider;
  authUrl?: string;
  error?: string;
}

export function ConnectAccountDialog({ open, onOpenChange }: ConnectAccountDialogProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    step: 'select-provider'
  });

  const { data: providers = [], isLoading: providersLoading } = useSupportedProviders();
  const getAuthUrlMutation = useGetAuthUrl();
  const connectAccountMutation = useConnectAccount();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setConnectionState({ step: 'select-provider' });
    }
  }, [open]);

  // Listen for OAuth callback
  useEffect(() => {
    if (connectionState.step === 'authenticating') {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'OAUTH_SUCCESS') {
          const { authCode, state } = event.data;
          handleOAuthCallback(authCode, state);
        } else if (event.data.type === 'OAUTH_ERROR') {
          setConnectionState({
            step: 'error',
            error: event.data.error || 'Erro na autenticação'
          });
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [connectionState.step]);

  const handleProviderSelect = async (provider: OpenBankingProvider) => {
    setConnectionState({ step: 'authenticating', provider });

    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const result = await getAuthUrlMutation.mutateAsync({
        provider: provider.id,
        redirectUri
      });

      // Open OAuth popup
      const popup = window.open(
        result.authUrl,
        'oauth-popup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Monitor popup
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          if (connectionState.step === 'authenticating') {
            setConnectionState({
              step: 'error',
              error: 'Autenticação cancelada'
            });
          }
        }
      }, 1000);

    } catch (error: any) {
      setConnectionState({
        step: 'error',
        error: error.message || 'Erro ao iniciar autenticação'
      });
    }
  };

  const handleOAuthCallback = async (authCode: string, state: string) => {
    if (!connectionState.provider) return;

    setConnectionState(prev => ({ ...prev, step: 'connecting' }));

    try {
      await connectAccountMutation.mutateAsync({
        provider: connectionState.provider.id as any,
        authCode,
        redirectUri: `${window.location.origin}/auth/callback`,
        metadata: { state }
      });

      setConnectionState({ step: 'success' });
      
      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);

    } catch (error: any) {
      setConnectionState({
        step: 'error',
        error: error.message || 'Erro ao conectar conta'
      });
    }
  };

  const handleRetry = () => {
    setConnectionState({ step: 'select-provider' });
  };

  const renderContent = () => {
    switch (connectionState.step) {
      case 'select-provider':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Selecione um provedor para conectar suas contas bancárias
              </p>
            </div>

            {providersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-3 w-[200px]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <Card 
                    key={provider.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                            {provider.logo ? (
                              <img 
                                src={provider.logo} 
                                alt={provider.name}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <span className="text-lg font-semibold">
                                {provider.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{provider.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {provider.countries?.join(', ') || ''}
                            </p>
                            {provider.features && provider.features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {provider.features.slice(0, 3).map((feature) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'authenticating':
        return (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Autenticando com {connectionState.provider?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Complete a autenticação na janela que foi aberta
              </p>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Conectando conta</h3>
              <p className="text-sm text-muted-foreground">
                Configurando a sincronização com suas contas...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Conta conectada com sucesso!</h3>
              <p className="text-sm text-muted-foreground">
                Suas transações serão sincronizadas automaticamente
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4 py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Erro ao conectar conta</h3>
              <p className="text-sm text-muted-foreground">
                {connectionState.error}
              </p>
            </div>
            <Button onClick={handleRetry}>
              Tentar Novamente
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Conectar Conta Bancária</DialogTitle>
          <DialogDescription>
            Use Open Banking para conectar suas contas de forma segura
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}