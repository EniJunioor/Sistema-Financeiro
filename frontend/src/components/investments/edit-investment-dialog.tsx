'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateInvestment } from '@/hooks/use-investments';
import type { Investment, UpdateInvestmentDto } from '@/types/investment';

const updateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  broker: z.string().optional(),
  sector: z.string().optional(),
});

type UpdateFormData = z.infer<typeof updateSchema>;

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
  'Mineração',
  'Fundos Imobiliários',
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

interface EditInvestmentDialogProps {
  investment: Investment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInvestmentDialog({
  investment,
  open,
  onOpenChange,
}: EditInvestmentDialogProps) {
  const updateInvestment = useUpdateInvestment();

  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      name: investment.name,
      broker: investment.broker || '',
      sector: investment.sector || '',
    },
  });

  const onSubmit = async (data: UpdateFormData) => {
    try {
      const updateData: UpdateInvestmentDto = {};
      if (data.name && data.name !== investment.name) {
        updateData.name = data.name;
      }
      if (data.broker !== investment.broker) {
        updateData.broker = data.broker || undefined;
      }
      if (data.sector !== investment.sector) {
        updateData.sector = data.sector || undefined;
      }

      await updateInvestment.mutateAsync({
        id: investment.id,
        data: updateData,
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Investimento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do investimento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="broker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corretora</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
                    <FormLabel>Setor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
                onClick={() => onOpenChange(false)}
                disabled={updateInvestment.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateInvestment.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {updateInvestment.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
