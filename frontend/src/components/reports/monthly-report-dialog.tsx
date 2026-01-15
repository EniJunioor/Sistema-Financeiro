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

const monthlyReportSchema = z.object({
  month: z.string().min(1, 'Mês é obrigatório'),
  year: z.string().min(1, 'Ano é obrigatório'),
  format: z.enum(['pdf', 'excel', 'csv']),
  includeCharts: z.boolean().default(true),
  includeTransactions: z.boolean().default(false),
  includeAIPredictions: z.boolean().default(false),
  categories: z.array(z.string()).optional(),
  accounts: z.array(z.string()).optional(),
});

type MonthlyReportForm = z.infer<typeof monthlyReportSchema>;

interface MonthlyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: any) => Promise<void>;
  isLoading?: boolean;
}

export function MonthlyReportDialog({
  open,
  onOpenChange,
  onGenerate,
  isLoading = false,
}: MonthlyReportDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const form = useForm<MonthlyReportForm>({
    resolver: zodResolver(monthlyReportSchema),
    defaultValues: {
      month: String(new Date().getMonth() + 1).padStart(2, '0'),
      year: String(currentYear),
      format: 'pdf',
      includeCharts: true,
      includeTransactions: false,
      includeAIPredictions: false,
      categories: [],
      accounts: [],
    },
  });

  const handleSubmit = async (data: MonthlyReportForm) => {
    const month = parseInt(data.month);
    const year = parseInt(data.year);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const config = {
      type: 'financial_summary' as const,
      format: data.format,
      title: `Relatório Mensal - ${data.month}/${data.year}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includeCharts: data.includeCharts,
      includeTransactions: data.includeTransactions,
      includeAIPredictions: data.includeAIPredictions,
      categories: data.categories,
      accounts: data.accounts,
    };

    await onGenerate(config);
  };

  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Gerar Relatório Mensal</DialogTitle>
          <DialogDescription className="text-sm">
            Configure e gere um relatório financeiro mensal detalhado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
          {/* Período */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Select
                value={form.watch('month')}
                onValueChange={(value) => form.setValue('month', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Select
                value={form.watch('year')}
                onValueChange={(value) => form.setValue('year', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
