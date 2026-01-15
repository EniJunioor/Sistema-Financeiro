'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateInvestment } from '@/hooks/use-investments';
import { Plus } from 'lucide-react';
import type { CreateInvestmentDto, InvestmentType } from '@/types/investment';

const investmentSchema = z.object({
  symbol: z.string().min(1, 'Símbolo é obrigatório').max(20, 'Símbolo deve ter no máximo 20 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome deve ter no máximo 255 caracteres'),
  type: z.enum(['stock', 'fund', 'etf', 'crypto', 'bond', 'derivative'], {
    required_error: 'Tipo de investimento é obrigatório',
  }),
  quantity: z.number().min(0.00000001, 'Quantidade deve ser maior que zero'),
  averagePrice: z.number().min(0.01, 'Preço deve ser maior que zero'),
  currency: z.string().optional(),
  broker: z.string().optional(),
  sector: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

const investmentTypes: { value: InvestmentType; label: string }[] = [
  { value: 'stock', label: 'Ações' },
  { value: 'fund', label: 'Fundos' },
  { value: 'etf', label: 'ETFs' },
  { value: 'crypto', label: 'Criptomoedas' },
  { value: 'bond', label: 'Renda Fixa' },
  { value: 'derivative', label: 'Derivativos' },
];

const commonSectors = [
  'Tecnologia',
  'Financeiro',
  'Energia',
  'Saúde',
  'Consumo',
  'Industrial',
  'Imobiliário',
  'Telecomunicações',
  'Materiais',
  'Utilidades',
];

const commonBrokers = [
  'XP Investimentos',
  'Rico',
  'Clear',
  'Inter',
  'BTG Pactual',
  'Itaú',
  'Bradesco',
  'Santander',
  'Nubank',
  'Avenue',
];

interface InvestmentFormProps {
  trigger?: React.ReactNode;
  defaultType?: InvestmentType;
}

export function InvestmentForm({ trigger, defaultType = 'stock' }: InvestmentFormProps) {
  const [open, setOpen] = useState(false);
  const createInvestment = useCreateInvestment();

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      symbol: '',
      name: '',
      type: defaultType,
      quantity: 0,
      averagePrice: 0,
      currency: 'BRL',
      broker: '',
      sector: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        symbol: '',
        name: '',
        type: defaultType,
        quantity: 0,
        averagePrice: 0,
        currency: 'BRL',
        broker: '',
        sector: '',
      });
    }
  }, [open, defaultType, form]);

  const onSubmit = async (data: InvestmentFormData) => {
    try {
      await createInvestment.mutateAsync(data);
      form.reset();
      setOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Investimento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Investimento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Símbolo</FormLabel>
                    <FormControl>
                      <Input placeholder="PETR4, VALE3..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {investmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do investimento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00000001"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="averagePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Médio</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="broker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corretora (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a corretora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {commonBrokers.map((broker) => (
                          <SelectItem key={broker} value={broker}>
                            {broker}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {commonSectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createInvestment.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createInvestment.isPending}>
                {createInvestment.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}