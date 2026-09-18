import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  SubscriptionsAPI,
  type CreateSubscriptionData,
  type Subscription,
  type SubscriptionFilters,
  type UpdateSubscriptionData,
} from '@/lib/subscriptions-api';

export function useSubscriptions(filters: SubscriptionFilters = {}) {
  return useQuery<Subscription[]>({
    queryKey: ['subscriptions', filters],
    queryFn: () => SubscriptionsAPI.getSubscriptions(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpcomingSubscriptions(days = 30) {
  return useQuery<Subscription[]>({
    queryKey: ['subscriptions', 'upcoming', days],
    queryFn: () => SubscriptionsAPI.getUpcoming(days),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscription(id: string) {
  return useQuery<Subscription>({
    queryKey: ['subscriptions', id],
    queryFn: () => SubscriptionsAPI.getSubscription(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionData) => SubscriptionsAPI.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Assinatura criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar assinatura');
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriptionData }) =>
      SubscriptionsAPI.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Assinatura atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar assinatura');
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SubscriptionsAPI.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Assinatura removida com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao remover assinatura');
    },
  });
}
