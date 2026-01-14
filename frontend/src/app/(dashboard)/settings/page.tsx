'use client';

import React from 'react';
import { Settings, Bell, User, Shield, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SettingsPage() {
  const settingsOptions = [
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
    // Adicione mais opções de configurações aqui no futuro
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="h-8 w-8 mr-3 text-emerald-600" />
          Configurações
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      {/* Settings Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link key={option.id} href={option.href}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 ${option.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Configurar
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
