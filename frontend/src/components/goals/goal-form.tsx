'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Target, TrendingUp, CreditCard, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Goal, CreateGoalData, UpdateGoalData } from '@/lib/goals-api';

const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  type: z.enum(['savings', 'spending_limit', 'investment', 'debt_payoff']),
  targetAmount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  targetDate: z.date().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: CreateGoalData | UpdateGoalData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const goalTypes = [
  {
    value: 'savings',
    label: 'Economia',
    description: 'Juntar dinheiro para um objetivo específico',
    icon: PiggyBank,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    value: 'spending_limit',
    label: 'Limite de Gastos',
    description: 'Controlar gastos em uma categoria',
    icon: CreditCard,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    value: 'investment',
    label: 'Investimento',
    description: 'Meta de investimento ou rentabilidade',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    value: 'debt_payoff',
    label: 'Quitação de Dívida',
    description: 'Quitar uma dívida específica',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export function GoalForm({ goal, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const [selectedType, setSelectedType] = useState<string>(goal?.type || '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name || '',
      description: goal?.description || '',
      type: goal?.type || 'savings',
      targetAmount: goal?.targetAmount || 0,
      targetDate: goal?.targetDate ? new Date(goal.targetDate) : undefined,
      categoryId: goal?.categoryId || '',
      isActive: goal?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: GoalFormData) => {
    try {
      const submitData = {
        ...data,
        targetDate: data.targetDate?.toISOString(),
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting goal:', error);
    }
  };

  const selectedGoalType = goalTypes.find(type => type.value === selectedType);

  return (
    <div className="w-full">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Goal Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="type">Tipo de Meta</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goalTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                
                return (
                  <div
                    key={type.value}
                    className={cn(
                      'relative cursor-pointer rounded-lg border p-4 transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                    onClick={() => {
                      setSelectedType(type.value);
                      form.setValue('type', type.value as any);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn('rounded-lg p-2', type.bgColor)}>
                        <Icon className={cn('h-5 w-5', type.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {type.label}
                          </h3>
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">
                              Selecionado
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {form.formState.errors.type && (
              <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Meta</Label>
            <Input
              id="name"
              placeholder="Ex: Viagem para Europa, Reserva de emergência..."
              {...form.register('name')}
              className={form.formState.errors.name ? 'border-red-500' : ''}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva sua meta em mais detalhes..."
              rows={3}
              {...form.register('description')}
              className={form.formState.errors.description ? 'border-red-500' : ''}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">
              {selectedType === 'spending_limit' ? 'Limite Máximo' : 'Valor Alvo'}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </span>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                className={cn(
                  'pl-10',
                  form.formState.errors.targetAmount ? 'border-red-500' : ''
                )}
                {...form.register('targetAmount', { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.targetAmount && (
              <p className="text-sm text-red-600">{form.formState.errors.targetAmount.message}</p>
            )}
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label>Data Alvo (opcional)</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !form.watch('targetDate') && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('targetDate') ? (
                    format(form.watch('targetDate')!, 'PPP', { locale: ptBR })
                  ) : (
                    'Selecione uma data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch('targetDate')}
                  onSelect={(date) => {
                    form.setValue('targetDate', date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Meta Ativa</Label>
              <p className="text-sm text-gray-500">
                Metas ativas são incluídas no cálculo de progresso
              </p>
            </div>
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Salvando...' : goal ? 'Atualizar Meta' : 'Criar Meta'}
            </Button>
          </div>
        </form>
    </div>
  );
}