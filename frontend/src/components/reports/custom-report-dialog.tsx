'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const customReportSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  startDate: z.date({
    required_error: 'Data inicial é obrigatória',
  }),
  endDate: z.date({
    required_error: 'Data final é obrigatória',
  }),
  format: z.enum(['pdf', 'excel', 'csv']),
  includeCharts: z.boolean().default(true),
  includeTransactions: z.boolean().default(false),
  includeAIPredictions: z.boolean().default(false),
  categories: z.array(z.string()).optional(),
  accounts: z.array(z.string()).optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'Data final deve ser maior ou igual à data inicial',
  path: ['endDate'],
});

type CustomReportForm = z.infer<typeof customReportSchema>;

interface CustomReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: any) => Promise<void>;
  isLoading?: boolean;
}

export function CustomReportDialog({
  open,
  onOpenChange,
  onGenerate,
  isLoading = false,
}: CustomReportDialogProps) {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const form = useForm<CustomReportForm>({
    resolver: zodResolver(customReportSchema),
    defaultValues: {
      title: '',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      format: 'pdf',
      includeCharts: true,
      includeTransactions: false,
      includeAIPredictions: false,
      categories: [],
      accounts: [],
    },
  });

  const handleSubmit = async (data: CustomReportForm) => {
    const config = {
      type: 'financial_summary' as const,
      format: data.format,
      title: data.title,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      includeCharts: data.includeCharts,
      includeTransactions: data.includeTransactions,
      includeAIPredictions: data.includeAIPredictions,
      categories: data.categories,
      accounts: data.accounts,
    };

    await onGenerate(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Criar Relatório Personalizado</DialogTitle>
          <DialogDescription className="text-sm">
            Configure período, filtros e opções para seu relatório personalizado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título do Relatório</Label>
            <Input
              id="title"
              placeholder="Ex: Análise Q4 2024, Relatório Semestral..."
              {...form.register('title')}
              className={form.formState.errors.title ? 'border-red-500' : ''}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('startDate') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('startDate') ? (
                      format(form.watch('startDate')!, 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione a data inicial</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('startDate')}
                    onSelect={(date) => {
                      form.setValue('startDate', date!);
                      setStartDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-600">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('endDate') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('endDate') ? (
                      format(form.watch('endDate')!, 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione a data final</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('endDate')}
                    onSelect={(date) => {
                      form.setValue('endDate', date!);
                      setEndDateOpen(false);
                    }}
                    disabled={(date) => {
                      const startDate = form.watch('startDate');
                      return startDate ? date < startDate : false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-600">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <Label htmlFor="format">Formato do Relatório</Label>
            <Select
              value={form.watch('format')}
              onValueChange={(value: 'pdf' | 'excel' | 'csv') => form.setValue('format', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel (XLSX)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opções */}
          <div className="space-y-4">
            <Label>Opções do Relatório</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={form.watch('includeCharts')}
                  onCheckedChange={(checked) => form.setValue('includeCharts', checked as boolean)}
                />
                <Label htmlFor="includeCharts" className="font-normal cursor-pointer">
                  Incluir gráficos e visualizações
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTransactions"
                  checked={form.watch('includeTransactions')}
                  onCheckedChange={(checked) => form.setValue('includeTransactions', checked as boolean)}
                />
                <Label htmlFor="includeTransactions" className="font-normal cursor-pointer">
                  Incluir lista de transações
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAIPredictions"
                  checked={form.watch('includeAIPredictions')}
                  onCheckedChange={(checked) => form.setValue('includeAIPredictions', checked as boolean)}
                />
                <Label htmlFor="includeAIPredictions" className="font-normal cursor-pointer">
                  Incluir previsões de IA
                </Label>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
              {isLoading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
