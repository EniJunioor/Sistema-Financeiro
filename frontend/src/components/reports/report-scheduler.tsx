'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Trash2, Calendar, Mail, Clock } from 'lucide-react';
import { useReports } from '@/hooks/use-reports';
import { CRON_PRESETS, type ReportConfig } from '@/types/report';
import type { ScheduledReport } from '@/lib/reports-api';
import { toast } from 'sonner';

const scheduleSchema = z.object({
  scheduleName: z.string().min(1, 'Nome é obrigatório'),
  cronExpression: z.string().min(1, 'Frequência é obrigatória'),
  emailRecipients: z.array(z.string().email('Email inválido')).min(1, 'Pelo menos um email é obrigatório'),
  isActive: z.boolean().default(true),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

interface ReportSchedulerProps {
  config: ReportConfig;
  existingSchedule?: ScheduledReport;
  onScheduled: () => void;
  onClose?: () => void;
}

export function ReportScheduler({ 
  config, 
  existingSchedule, 
  onScheduled, 
  onClose 
}: ReportSchedulerProps) {
  const [newEmail, setNewEmail] = useState('');
  const [customCron, setCustomCron] = useState('');
  const [showCustomCron, setShowCustomCron] = useState(false);
  
  const { scheduleReport, updateScheduledReport, isScheduling, isUpdating } = useReports();

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      scheduleName: existingSchedule?.scheduleName || config.title || '',
      cronExpression: existingSchedule?.cronExpression || '0 9 1 * *',
      emailRecipients: existingSchedule?.emailRecipients || [],
      isActive: existingSchedule?.isActive ?? true,
    },
  });

  const watchedCron = form.watch('cronExpression');
  const watchedEmails = form.watch('emailRecipients');

  const addEmail = () => {
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      const current = form.getValues('emailRecipients');
      if (!current.includes(newEmail)) {
        form.setValue('emailRecipients', [...current, newEmail]);
        setNewEmail('');
      } else {
        toast.error('Este email já foi adicionado');
      }
    } else {
      toast.error('Email inválido');
    }
  };

  const removeEmail = (email: string) => {
    const current = form.getValues('emailRecipients');
    form.setValue('emailRecipients', current.filter(e => e !== email));
  };

  const handleCustomCron = () => {
    if (customCron) {
      form.setValue('cronExpression', customCron);
      setShowCustomCron(false);
      setCustomCron('');
    }
  };

  const getNextExecution = (cronExpression: string) => {
    // Simple next execution calculation - in a real app, use a cron library
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
    return nextMonth.toLocaleString();
  };

  const getCronDescription = (cronExpression: string) => {
    const preset = CRON_PRESETS.find(p => p.value === cronExpression);
    return preset?.description || 'Frequência personalizada';
  };

  const onSubmit = async (data: ScheduleForm) => {
    try {
      if (existingSchedule) {
        await updateScheduledReport(existingSchedule.id, {
          ...config,
          ...data,
        });
      } else {
        await scheduleReport(config, {
          cronExpression: data.cronExpression,
          emailRecipients: data.emailRecipients,
          scheduleName: data.scheduleName,
          isActive: data.isActive,
        });
      }
      onScheduled();
    } catch (error) {
      toast.error('Erro ao agendar relatório');
    }
  };

  const content = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Schedule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configuração do Agendamento
              </CardTitle>
              <CardDescription>
                Defina quando e como o relatório será gerado automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scheduleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Agendamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Relatório Mensal DRE" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome para identificar este agendamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cronExpression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CRON_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            <div>
                              <div className="font-medium">{preset.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {preset.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Próxima execução: {getNextExecution(watchedCron)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomCron(true)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Frequência Personalizada
                </Button>
                {showCustomCron && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="0 9 * * *"
                      value={customCron}
                      onChange={(e) => setCustomCron(e.target.value)}
                      className="w-32"
                    />
                    <Button type="button" size="sm" onClick={handleCustomCron}>
                      Aplicar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomCron(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Ativar Agendamento</FormLabel>
                      <FormDescription>
                        O relatório será gerado automaticamente quando ativo
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Email Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Destinatários
              </CardTitle>
              <CardDescription>
                Emails que receberão o relatório automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="email@exemplo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                />
                <Button type="button" onClick={addEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {watchedEmails.length > 0 && (
                <div className="space-y-2">
                  <FormLabel>Emails Adicionados ({watchedEmails.length})</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {watchedEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="emailRecipients"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Report Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Título:</span>
                  <span className="font-medium">{config.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge variant="secondary">{config.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formato:</span>
                  <Badge variant="outline">{config.format.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequência:</span>
                  <span>{getCronDescription(watchedCron)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={isScheduling || isUpdating}
              className="ml-auto"
            >
              {isScheduling || isUpdating 
                ? 'Salvando...' 
                : existingSchedule 
                  ? 'Atualizar Agendamento' 
                  : 'Agendar Relatório'
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

  if (onClose) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {existingSchedule ? 'Editar Agendamento' : 'Agendar Relatório'}
            </DialogTitle>
            <DialogDescription>
              Configure quando e para quem o relatório será enviado automaticamente
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}