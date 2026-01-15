'use client';

import React from 'react';
import { 
  Settings, 
  Bell, 
  User, 
  Shield, 
  CreditCard, 
  Lock,
  Palette,
  Key,
  Smartphone,
  Mail,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SettingsPage() {
  const settingsOptions = [
    {
      id: 'profile',
      title: 'Perfil',
      description: 'Gerencie suas informações pessoais e dados da conta',
      icon: User,
      href: '/settings/profile',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      id: 'security',
      title: 'Segurança',
      description: 'Senha, autenticação de dois fatores e sessões ativas',
      icon: Shield,
      href: '/settings/security',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      id: 'notifications',
      title: 'Notificações',
      description: 'Gerencie suas preferências de notificação',
      icon: Bell,
      href: '/settings/notifications',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'preferences',
      title: 'Preferências',
      description: 'Idioma, moeda, tema e outras configurações gerais',
      icon: Palette,
      href: '/settings/preferences',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 'integrations',
      title: 'Integrações',
      description: 'Conecte suas contas bancárias e serviços externos',
      icon: CreditCard,
      href: '/settings/integrations',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      id: 'privacy',
      title: 'Privacidade',
      description: 'Controle seus dados e configurações de privacidade',
      icon: Lock,
      href: '/settings/privacy',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="h-8 w-8 mr-3 text-emerald-600" />
          Configurações
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      {/* Settings Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link key={option.id} href={option.href}>
              <Card className="border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer h-full group">
                <CardHeader>
                  <div className={`w-12 h-12 ${option.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{option.title}</CardTitle>
                  <CardDescription className="text-gray-600">{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-200 hover:bg-gray-50 group-hover:border-gray-300"
                  >
                    Configurar
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Ações Rápidas</CardTitle>
          <CardDescription>Atalhos para tarefas comuns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 border-gray-200 hover:bg-gray-50"
              asChild
            >
              <Link href="/settings/security">
                <Key className="h-5 w-5 mb-2 text-gray-600" />
                <span className="text-sm">Alterar Senha</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 border-gray-200 hover:bg-gray-50"
              asChild
            >
              <Link href="/settings/notifications">
                <Mail className="h-5 w-5 mb-2 text-gray-600" />
                <span className="text-sm">Notificações</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 border-gray-200 hover:bg-gray-50"
              asChild
            >
              <Link href="/settings/integrations">
                <Smartphone className="h-5 w-5 mb-2 text-gray-600" />
                <span className="text-sm">Conectar Conta</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 border-gray-200 hover:bg-gray-50"
              asChild
            >
              <Link href="/settings/privacy">
                <Eye className="h-5 w-5 mb-2 text-gray-600" />
                <span className="text-sm">Privacidade</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
