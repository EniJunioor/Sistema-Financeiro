import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  AccountsAPI, 
  ConnectAccountRequest, 
  UpdateAccountRequest, 
  AccountFilters,
  SyncAccountRequest 
} from '@/lib/accounts-api';
import type { Account } from '@/types/transaction';

// Get all accounts
export function useAccounts(filters?: AccountFilters) {
  return useQuery<Account[]>({
    queryKey: ['accounts', filters],
    queryFn: () => AccountsAPI.getAccounts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single account
export function useAccount(accountId: string) {
  return useQuery<Account>({
    queryKey: ['accounts', accountId],
    queryFn: () => AccountsAPI.getAccount(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

// Get account transactions
export function useAccountTransactions(
  accountId: string, 
  startDate?: string, 
  endDate?: string
) {
  return useQuery({
    queryKey: ['accounts', accountId, 'transactions', startDate, endDate],
    queryFn: () => AccountsAPI.getAccountTransactions(accountId, startDate, endDate),
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get supported providers
export function useSupportedProviders() {
  return useQuery({
    queryKey: ['accounts', 'providers'],
    queryFn: AccountsAPI.getSupportedProviders,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Get sync status
export function useSyncStatus() {
  return useQuery({
    queryKey: ['accounts', 'sync-status'],
    queryFn: AccountsAPI.getSyncStatus,
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}

// Connect account mutation
export function useConnectAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConnectAccountRequest) => AccountsAPI.connectAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta conectada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao conectar conta');
    },
  });
}

// Update account mutation
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: UpdateAccountRequest }) =>
      AccountsAPI.updateAccount(accountId, data),
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts', accountId] });
      toast.success('Conta atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar conta');
    },
  });
}

// Disconnect account mutation
export function useDisconnectAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => AccountsAPI.disconnectAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta desconectada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao desconectar conta');
    },
  });
}

// Sync account mutation
export function useSyncAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data?: SyncAccountRequest }) =>
      AccountsAPI.syncAccount(accountId, data),
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', accountId, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'sync-status'] });
      toast.success('Sincronização iniciada!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sincronizar conta');
    },
  });
}

// Sync all accounts mutation
export function useSyncAllAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AccountsAPI.syncAllAccounts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'sync-status'] });
      toast.success('Sincronização de todas as contas iniciada!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sincronizar contas');
    },
  });
}

// Get auth URL mutation
export function useGetAuthUrl() {
  return useMutation({
    mutationFn: ({ provider, redirectUri }: { provider: string; redirectUri: string }) =>
      AccountsAPI.getAuthUrl(provider, { redirectUri }),
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao obter URL de autenticação');
    },
  });
}