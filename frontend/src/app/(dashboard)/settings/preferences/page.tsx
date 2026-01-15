'use client';

import React, { useState } from 'react';
import { Palette, Globe, DollarSign, Moon, Sun, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Link from 'next/link';

export default function PreferencesSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    language: 'pt-BR',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    theme: 'light',
    autoSync: true,
    emailReports: true,
    compactMode: false,
  });

  const handleSelectChange = (key: string, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSwitchChange = (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Preferências' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Palette className="h-8 w-8 mr-3 text-purple-600" />
          Preferências
        </h1>
        <p className="text-gray-600 mt-2">
          Personalize idioma, moeda, tema e outras configurações gerais
        </p>
      </div>

      {/* Idioma e Localização */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Idioma e Localização</CardTitle>
          </div>
          <CardDescription>Configure o idioma e formato de data/hora</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select value={preferences.language} onValueChange={(value) => handleSelectChange('language', value)}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select value={preferences.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                  <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Formato de Data</Label>
              <Select value={preferences.dateFormat} onValueChange={(value) => handleSelectChange('dateFormat', value)}>
                <SelectTrigger id="dateFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeFormat">Formato de Hora</Label>
              <Select value={preferences.timeFormat} onValueChange={(value) => handleSelectChange('timeFormat', value)}>
                <SelectTrigger id="timeFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 horas</SelectItem>
                  <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Aparência</CardTitle>
          </div>
          <CardDescription>Personalize a aparência da interface</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select value={preferences.theme} onValueChange={(value) => handleSelectChange('theme', value)}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <span>Claro</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center space-x-2">
                    <Moon className="h-4 w-4" />
                    <span>Escuro</span>
                  </div>
                </SelectItem>
                <SelectItem value="auto">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="compactMode" className="font-medium">Modo Compacto</Label>
              <p className="text-sm text-gray-600">Mostrar mais informações em menos espaço</p>
            </div>
            <Switch
              id="compactMode"
              checked={preferences.compactMode}
              onCheckedChange={(value) => handleSwitchChange('compactMode', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferências Gerais */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Preferências Gerais</CardTitle>
          <CardDescription>Configure comportamentos automáticos do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="autoSync" className="font-medium">Sincronização Automática</Label>
              <p className="text-sm text-gray-600">Sincronizar contas automaticamente em intervalos regulares</p>
            </div>
            <Switch
              id="autoSync"
              checked={preferences.autoSync}
              onCheckedChange={(value) => handleSwitchChange('autoSync', value)}
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="emailReports" className="font-medium">Relatórios por Email</Label>
              <p className="text-sm text-gray-600">Receber relatórios financeiros mensais por email</p>
            </div>
            <Switch
              id="emailReports"
              checked={preferences.emailReports}
              onCheckedChange={(value) => handleSwitchChange('emailReports', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" asChild>
          <Link href="/settings">Cancelar</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
          {isSaving ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Preferências
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
