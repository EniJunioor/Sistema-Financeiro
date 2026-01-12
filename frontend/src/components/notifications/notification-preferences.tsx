'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Volume2, 
  VolumeX,
  Moon,
  Sun,
  TestTube,
  Save,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/providers/notification-provider';
import { notificationsApi } from '@/lib/notifications-api';
import { cn } from '@/lib/utils';
import type { NotificationPreferences } from '@/types/notification';

interface NotificationPreferencesProps {
  className?: string;
}

export function NotificationPreferencesComponent({ className }: NotificationPreferencesProps) {
  const {
    preferences,
    settings,
    isLoadingPreferences,
    updatePreferences,
    updateSettings,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
  } = useNotifications();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>(preferences || {});
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleCategoryChange = (category: keyof NotificationPreferences['categories'], value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      categories: {
        transactions: false,
        goals: false,
        investments: false,
        security: false,
        marketing: false,
        system: false,
        ...prev.categories,
        [category]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleQuietHoursChange = (key: keyof NotificationPreferences['quietHours'], value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        ...prev.quietHours,
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSettingsChange = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsUpdating(true);
    try {
      await updatePreferences(localPreferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestNotification = async (type: 'email' | 'push' | 'browser') => {
    setIsTesting(type);
    try {
      if (type === 'browser') {
        const hasPermission = await requestPermission();
        if (hasPermission) {
          new Notification('Teste de Notificação', {
            body: 'Esta é uma notificação de teste do navegador.',
            icon: '/icons/notification-icon.png',
          });
        } else {
          alert('Permissão para notificações do navegador negada.');
        }
      } else {
        await notificationsApi.sendTestNotification(type);
        alert(`Notificação de teste ${type} enviada!`);
      }
    } catch (error) {
      console.error(`Failed to send ${type} test notification:`, error);
      alert(`Erro ao enviar notificação de teste ${type}.`);
    } finally {
      setIsTesting(null);
    }
  };

  const handlePushSubscription = async () => {
    try {
      if (localPreferences.pushNotifications) {
        await subscribeToPush();
      } else {
        await unsubscribeFromPush();
      }
    } catch (error) {
      console.error('Failed to manage push subscription:', error);
    }
  };

  React.useEffect(() => {
    if (preferences?.pushNotifications !== localPreferences.pushNotifications) {
      handlePushSubscription();
    }
  }, [localPreferences.pushNotifications]);

  if (isLoadingPreferences) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                    <div className="h-6 bg-gray-200 rounded w-12 animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Save Button */}
      {hasChanges && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>Você tem alterações não salvas.</span>
            <Button onClick={handleSave} disabled={isUpdating} size="sm">
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Canais de Notificação
          </CardTitle>
          <CardDescription>
            Configure como você deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <Label htmlFor="email-notifications" className="text-base font-medium">
                  Email
                </Label>
                <p className="text-sm text-gray-500">
                  Receber notificações por email
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="email-notifications"
                checked={localPreferences.emailNotifications || false}
                onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestNotification('email')}
                disabled={isTesting === 'email' || !localPreferences.emailNotifications}
              >
                {isTesting === 'email' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-green-600" />
              <div>
                <Label htmlFor="push-notifications" className="text-base font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Notificações push no dispositivo
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="push-notifications"
                checked={localPreferences.pushNotifications || false}
                onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestNotification('push')}
                disabled={isTesting === 'push' || !localPreferences.pushNotifications}
              >
                {isTesting === 'push' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-purple-600" />
              <div>
                <Label htmlFor="browser-notifications" className="text-base font-medium">
                  Navegador
                </Label>
                <p className="text-sm text-gray-500">
                  Notificações do navegador
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="browser-notifications"
                checked={localPreferences.browserNotifications || false}
                onCheckedChange={(checked) => handlePreferenceChange('browserNotifications', checked)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestNotification('browser')}
                disabled={isTesting === 'browser' || !localPreferences.browserNotifications}
              >
                {isTesting === 'browser' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <div>
                <Label htmlFor="sms-notifications" className="text-base font-medium">
                  SMS
                </Label>
                <p className="text-sm text-gray-500">
                  Notificações por SMS (apenas urgentes)
                </p>
              </div>
            </div>
            <Switch
              id="sms-notifications"
              checked={localPreferences.smsNotifications || false}
              onCheckedChange={(checked) => handlePreferenceChange('smsNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias de Notificação</CardTitle>
          <CardDescription>
            Escolha quais tipos de notificação você deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries({
            transactions: { label: 'Transações', description: 'Novas transações e atualizações' },
            goals: { label: 'Metas', description: 'Progresso e lembretes de metas' },
            investments: { label: 'Investimentos', description: 'Atualizações de carteira e cotações' },
            security: { label: 'Segurança', description: 'Alertas de segurança e login' },
            marketing: { label: 'Marketing', description: 'Novidades e promoções' },
            system: { label: 'Sistema', description: 'Manutenções e atualizações' },
          }).map(([key, config]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label htmlFor={`category-${key}`} className="text-base font-medium">
                  {config.label}
                </Label>
                <p className="text-sm text-gray-500">
                  {config.description}
                </p>
              </div>
              <Switch
                id={`category-${key}`}
                checked={localPreferences.categories?.[key as keyof NotificationPreferences['categories']] || false}
                onCheckedChange={(checked) => handleCategoryChange(key as keyof NotificationPreferences['categories'], checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Frequency and Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Moon className="h-5 w-5 mr-2" />
            Frequência e Horários
          </CardTitle>
          <CardDescription>
            Configure quando e com que frequência receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="frequency" className="text-base font-medium">
              Frequência de Notificações
            </Label>
            <Select
              value={localPreferences.frequency || 'immediate'}
              onValueChange={(value) => handlePreferenceChange('frequency', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Imediata</SelectItem>
                <SelectItem value="hourly">A cada hora</SelectItem>
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="quiet-hours" className="text-base font-medium">
                Horário Silencioso
              </Label>
              <Switch
                id="quiet-hours"
                checked={localPreferences.quietHours?.enabled || false}
                onCheckedChange={(checked) => handleQuietHoursChange('enabled', checked)}
              />
            </div>

            {localPreferences.quietHours?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time" className="text-sm">
                    Início
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={localPreferences.quietHours?.startTime || '22:00'}
                    onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-sm">
                    Fim
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={localPreferences.quietHours?.endTime || '08:00'}
                    onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sun className="h-5 w-5 mr-2" />
            Configurações de Exibição
          </CardTitle>
          <CardDescription>
            Personalize como as notificações são exibidas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound" className="text-base font-medium">
                Som
              </Label>
              <p className="text-sm text-gray-500">
                Reproduzir som ao receber notificações
              </p>
            </div>
            <Switch
              id="sound"
              checked={localSettings.sound}
              onCheckedChange={(checked) => handleSettingsChange('sound', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="vibration" className="text-base font-medium">
                Vibração
              </Label>
              <p className="text-sm text-gray-500">
                Vibrar dispositivo (mobile)
              </p>
            </div>
            <Switch
              id="vibration"
              checked={localSettings.vibration}
              onCheckedChange={(checked) => handleSettingsChange('vibration', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-preview" className="text-base font-medium">
                Mostrar Prévia
              </Label>
              <p className="text-sm text-gray-500">
                Exibir conteúdo da notificação
              </p>
            </div>
            <Switch
              id="show-preview"
              checked={localSettings.showPreview}
              onCheckedChange={(checked) => handleSettingsChange('showPreview', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-hide" className="text-base font-medium">
                Ocultar Automaticamente
              </Label>
              <p className="text-sm text-gray-500">
                Ocultar notificações automaticamente
              </p>
            </div>
            <Switch
              id="auto-hide"
              checked={localSettings.autoHide}
              onCheckedChange={(checked) => handleSettingsChange('autoHide', checked)}
            />
          </div>

          {localSettings.autoHide && (
            <div>
              <Label htmlFor="auto-hide-duration" className="text-base font-medium">
                Duração (segundos): {localSettings.autoHideDuration / 1000}
              </Label>
              <Slider
                id="auto-hide-duration"
                min={1000}
                max={10000}
                step={1000}
                value={[localSettings.autoHideDuration]}
                onValueChange={([value]) => handleSettingsChange('autoHideDuration', value)}
                className="mt-2"
              />
            </div>
          )}

          <div>
            <Label htmlFor="position" className="text-base font-medium">
              Posição das Notificações
            </Label>
            <Select
              value={localSettings.position}
              onValueChange={(value) => handleSettingsChange('position', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-right">Superior Direita</SelectItem>
                <SelectItem value="top-left">Superior Esquerda</SelectItem>
                <SelectItem value="top-center">Superior Centro</SelectItem>
                <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                <SelectItem value="bottom-left">Superior Esquerda</SelectItem>
                <SelectItem value="bottom-center">Inferior Centro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="max-visible" className="text-base font-medium">
              Máximo Visível: {localSettings.maxVisible}
            </Label>
            <Slider
              id="max-visible"
              min={1}
              max={10}
              step={1}
              value={[localSettings.maxVisible]}
              onValueChange={([value]) => handleSettingsChange('maxVisible', value)}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}