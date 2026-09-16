'use client';

import React, { useState } from 'react';
import {
  Shield,
  Key,
  Lock,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  useActiveSessions,
  useChangePassword,
  useProfile,
  useRevokeAllSessions,
  useRevokeSession,
  useSecurityEvents,
} from '@/hooks/use-profile';

const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function formatDateTime(isoDate: string) {
  return new Date(isoDate).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Extrai navegador e sistema do user agent, para leitura humana. */
function describeDevice(userAgent?: string | null): string {
  if (!userAgent) return 'Dispositivo desconhecido';

  const browser =
    /Edg\//.test(userAgent) ? 'Edge'
    : /Chrome\//.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari'
    : /Firefox\//.test(userAgent) ? 'Firefox'
    : 'Navegador';

  const os =
    /Windows/.test(userAgent) ? 'Windows'
    : /Android/.test(userAgent) ? 'Android'
    : /iPhone|iPad/.test(userAgent) ? 'iOS'
    : /Mac OS X/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : 'sistema desconhecido';

  return `${browser} no ${os}`;
}

export default function SecuritySettingsPage() {
  const { data: profile } = useProfile();
  const { data: sessions, isLoading: isLoadingSessions } = useActiveSessions();
  const { data: securityEvents, isLoading: isLoadingEvents } = useSecurityEvents();

  const changePassword = useChangePassword();
  const revokeSession = useRevokeSession();
  const revokeAllSessions = useRevokeAllSessions();

  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD_FORM);

  const twoFactorEnabled = profile?.twoFactorEnabled ?? false;

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('A confirmação não corresponde à nova senha');
      return;
    }

    await changePassword.mutateAsync({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    setPasswordData(EMPTY_PASSWORD_FORM);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Segurança' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Shield className="h-8 w-8 mr-3 text-red-600" />
          Segurança
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie sua senha, autenticação de dois fatores e sessões ativas
        </p>
      </div>

      {/* Alterar Senha */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Alterar Senha</CardTitle>
          </div>
          <CardDescription>
            Ao alterar a senha, todas as suas sessões são encerradas e você precisará entrar novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Digite sua senha atual"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Digite sua nova senha"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500">Mínimo de 8 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirme sua nova senha"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={changePassword.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {changePassword.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Alterar Senha
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Autenticação de Dois Fatores */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              Autenticação de Dois Fatores
            </CardTitle>
          </div>
          <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-gray-900">Autenticação de Dois Fatores</h3>
                {twoFactorEnabled ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700">
                    Desativado
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Receba um código de verificação ao fazer login
              </p>
            </div>
            <Button asChild variant={twoFactorEnabled ? 'outline' : 'default'} size="sm">
              <Link href="/setup-2fa">{twoFactorEnabled ? 'Gerenciar' : 'Ativar'}</Link>
            </Button>
          </div>

          {!twoFactorEnabled && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Recomendado</p>
                  <p className="text-sm text-blue-700">
                    Configure um aplicativo autenticador (Google Authenticator, Authy) ou
                    verificação por SMS para proteger sua conta.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessões Ativas */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg font-semibold text-gray-900">Sessões Ativas</CardTitle>
            </div>
            <CardDescription>Gerencie os dispositivos conectados à sua conta</CardDescription>
          </div>
          {(sessions?.length ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
              disabled={revokeAllSessions.isPending}
              onClick={() => revokeAllSessions.mutate()}
            >
              Encerrar todas
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando sessões...</span>
            </div>
          ) : (sessions?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Nenhuma sessão ativa registrada
            </p>
          ) : (
            <div className="space-y-4">
              {sessions?.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Monitor className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">
                        {describeDevice(session.deviceInfo)}
                      </h3>
                      <p className="text-sm text-gray-600">{session.ipAddress ?? 'IP desconhecido'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Iniciada em {formatDateTime(session.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    disabled={revokeSession.isPending}
                    onClick={() => revokeSession.mutate(session.id)}
                  >
                    Encerrar Sessão
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Segurança */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              Histórico de Segurança
            </CardTitle>
          </div>
          <CardDescription>Tentativas de acesso recentes à sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingEvents ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando histórico...</span>
            </div>
          ) : (securityEvents?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Nenhuma atividade registrada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {securityEvents?.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg"
                >
                  {event.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {event.success ? 'Login realizado com sucesso' : 'Tentativa de login falhou'}
                      {!event.success && event.failureReason && ` — ${event.failureReason}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {describeDevice(event.userAgent)} • {event.ipAddress} •{' '}
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
