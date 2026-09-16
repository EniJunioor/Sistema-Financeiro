'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSubscription, useUpdateSubscription } from '@/hooks/use-subscriptions';
import { useAccounts } from '@/hooks/use-accounts';
import type { Subscription, SubscriptionFrequency } from '@/lib/subscriptions-api';

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando presente, o diálogo edita a assinatura em vez de criar uma nova. */
  subscription?: Subscription | null;
}

const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

/** Converte uma data ISO para o formato aceito por <input type="date">. */
function toDateInputValue(isoDate?: string | null): string {
  if (!isoDate) return '';
  return new Date(isoDate).toISOString().slice(0, 10);
}

export function SubscriptionDialog({
  open,
  onOpenChange,
  subscription,
}: SubscriptionDialogProps) {
  const isEditing = !!subscription;

  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const { data: accounts } = useAccounts();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [accountId, setAccountId] = useState<string>('none');
  const [description, setDescription] = useState('');

  // Repopula o formulário sempre que o diálogo abre, para não carregar
  // resíduo da edição anterior.
  useEffect(() => {
    if (!open) return;

    setName(subscription?.name ?? '');
    setAmount(subscription ? String(subscription.amount) : '');
    setFrequency(subscription?.frequency ?? 'monthly');
    setNextPaymentDate(toDateInputValue(subscription?.nextPaymentDate));
    setAccountId(subscription?.accountId ?? 'none');
    setDescription(subscription?.description ?? '');
  }, [open, subscription]);

  const isSubmitting = createSubscription.isPending || updateSubscription.isPending;
  const isValid = name.trim().length > 0 && Number(amount) > 0 && !!nextPaymentDate;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;

    const payload = {
      name: name.trim(),
      amount: Number(amount),
      frequency,
      nextPaymentDate: new Date(nextPaymentDate).toISOString(),
      accountId: accountId === 'none' ? undefined : accountId,
      description: description.trim() || undefined,
    };

    if (isEditing && subscription) {
      await updateSubscription.mutateAsync({ id: subscription.id, data: payload });
    } else {
      await createSubscription.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar assinatura' : 'Nova assinatura'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados desta assinatura.'
              : 'Cadastre um pagamento recorrente para acompanhá-lo automaticamente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subscription-name">Nome</Label>
            <Input
              id="subscription-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix, Spotify, academia..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subscription-amount">Valor (R$)</Label>
              <Input
                id="subscription-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription-frequency">Frequência</Label>
              <Select
                value={frequency}
                onValueChange={(value) => setFrequency(value as SubscriptionFrequency)}
              >
                <SelectTrigger id="subscription-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription-next-payment">Próximo pagamento</Label>
            <Input
              id="subscription-next-payment"
              type="date"
              value={nextPaymentDate}
              onChange={(e) => setNextPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription-account">Conta de débito (opcional)</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="subscription-account">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {(accounts ?? []).map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription-description">Descrição (opcional)</Label>
            <Input
              id="subscription-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Plano família, cobrança anual..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar assinatura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
