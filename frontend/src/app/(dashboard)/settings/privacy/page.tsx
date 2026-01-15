'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Download, Trash2, Shield, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function PrivacySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    showBalance: true,
    shareAnalytics: false,
    marketingEmails: false,
    dataRetention: '1year',
  });

  const handleSwitchChange = (key: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleExportData = () => {
    // Simular exportação de dados
    alert('Iniciando exportação dos seus dados...');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Privacidade' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Lock className="h-8 w-8 mr-3 text-indigo-600" />
          Privacidade
        </h1>
        <p className="text-gray-600 mt-2">
          Controle seus dados e configurações de privacidade
        </p>
      </div>

      {/* Visibilidade do Perfil */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Visibilidade do Perfil</CardTitle>
          </div>
          <CardDescription>Controle quem pode ver suas informações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Visibilidade do Perfil</Label>
            <Select
              value={privacySettings.profileVisibility}
              onValueChange={(value) => handleSelectChange('profileVisibility', value)}
            >
              <SelectTrigger id="profileVisibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Privado - Apenas você</SelectItem>
                <SelectItem value="friends">Amigos - Apenas pessoas que você adicionou</SelectItem>
                <SelectItem value="public">Público - Todos podem ver</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="showBalance" className="font-medium">Mostrar Saldo</Label>
              <p className="text-sm text-gray-600">Exibir valores de saldo nas visualizações</p>
            </div>
            <Switch
              id="showBalance"
              checked={privacySettings.showBalance}
              onCheckedChange={(value) => handleSwitchChange('showBalance', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compartilhamento de Dados */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Compartilhamento de Dados</CardTitle>
          </div>
          <CardDescription>Controle como seus dados são utilizados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="shareAnalytics" className="font-medium">Compartilhar Dados Analíticos</Label>
              <p className="text-sm text-gray-600">
                Permitir uso de dados anonimizados para melhorar o serviço
              </p>
            </div>
            <Switch
              id="shareAnalytics"
              checked={privacySettings.shareAnalytics}
              onCheckedChange={(value) => handleSwitchChange('shareAnalytics', value)}
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="marketingEmails" className="font-medium">Emails de Marketing</Label>
              <p className="text-sm text-gray-600">
                Receber emails sobre novos recursos e ofertas
              </p>
            </div>
            <Switch
              id="marketingEmails"
              checked={privacySettings.marketingEmails}
              onCheckedChange={(value) => handleSwitchChange('marketingEmails', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Retenção de Dados */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Retenção de Dados</CardTitle>
          <CardDescription>Configure por quanto tempo seus dados serão mantidos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dataRetention">Período de Retenção</Label>
            <Select
              value={privacySettings.dataRetention}
              onValueChange={(value) => handleSelectChange('dataRetention', value)}
            >
              <SelectTrigger id="dataRetention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">6 meses</SelectItem>
                <SelectItem value="1year">1 ano</SelectItem>
                <SelectItem value="2years">2 anos</SelectItem>
                <SelectItem value="indefinite">Indefinido</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Dados mais antigos que o período selecionado serão automaticamente removidos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Dados */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Gerenciamento de Dados</CardTitle>
          <CardDescription>Exporte ou exclua seus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium text-gray-900">Exportar Dados</h3>
                <p className="text-sm text-gray-600">
                  Baixe uma cópia de todos os seus dados em formato JSON
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-900">Excluir Conta</h3>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão
                  excluídos permanentemente.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                        e todos os seus dados do nosso servidor.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                        Sim, excluir conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Política de Privacidade */}
      <Card className="border border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Política de Privacidade</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Leia nossa política de privacidade completa para entender como coletamos, usamos e protegemos seus dados.
          </p>
          <div className="flex space-x-4">
            <Button variant="outline" size="sm">
              Política de Privacidade
            </Button>
            <Button variant="outline" size="sm">
              Termos de Uso
            </Button>
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
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
