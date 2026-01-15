'use client';

import React, { useState } from 'react';
import { Shield, Key, Lock, Smartphone, Monitor, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Link from 'next/link';

export default function SecuritySettingsPage() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const activeSessions = [
    {
      id: '1',
      device: 'Chrome no Windows',
      location: 'São Paulo, Brasil',
      lastActive: 'Hoje às 14:30',
      current: true,
    },
    {
      id: '2',
      device: 'Safari no iPhone',
      location: 'São Paulo, Brasil',
      lastActive: 'Ontem às 10:15',
      current: false,
    },
  ];

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    // Simular mudança de senha
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsChangingPassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
          <CardDescription>Atualize sua senha para manter sua conta segura</CardDescription>
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
            <Button type="submit" disabled={isChangingPassword} className="bg-emerald-600 hover:bg-emerald-700">
              {isChangingPassword ? (
                <>
                  <Key className="h-4 w-4 mr-2 animate-spin" />
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
            <CardTitle className="text-lg font-semibold text-gray-900">Autenticação de Dois Fatores</CardTitle>
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
                Receba um código de verificação no seu celular ao fazer login
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
          {twoFactorEnabled && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Configuração Necessária</p>
                  <p className="text-sm text-blue-700">
                    Você precisa configurar um aplicativo autenticador (Google Authenticator, Authy, etc.)
                    para completar a ativação do 2FA.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100">
                    Configurar Agora
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessões Ativas */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Sessões Ativas</CardTitle>
          </div>
          <CardDescription>Gerencie os dispositivos conectados à sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">{session.device}</h3>
                      {session.current && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Sessão Atual
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{session.location}</p>
                    <p className="text-xs text-gray-500 mt-1">Última atividade: {session.lastActive}</p>
                  </div>
                </div>
                {!session.current && (
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    Encerrar Sessão
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Segurança */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Histórico de Segurança</CardTitle>
          </div>
          <CardDescription>Atividades recentes relacionadas à segurança da sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Login realizado com sucesso</p>
                <p className="text-xs text-gray-500">Chrome no Windows • São Paulo, Brasil • Hoje às 14:30</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
              <Key className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Senha alterada</p>
                <p className="text-xs text-gray-500">15 de Janeiro, 2024 às 10:15</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
              <Smartphone className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">2FA configurado</p>
                <p className="text-xs text-gray-500">10 de Janeiro, 2024 às 09:00</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
