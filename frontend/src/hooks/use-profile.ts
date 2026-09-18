import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ProfileAPI,
  type ActiveSession,
  type ChangePasswordData,
  type UpdateProfileData,
  type SecurityEvent,
  type UserPreferences,
  type UserProfile,
} from '@/lib/profile-api';

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: ProfileAPI.getProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => ProfileAPI.updateProfile(data),
    onSuccess: (user) => {
      queryClient.setQueryData(['profile'], user);
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar perfil');
    },
  });
}

export function usePreferences() {
  return useQuery<UserPreferences>({
    queryKey: ['profile', 'preferences'],
    queryFn: ProfileAPI.getPreferences,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) => ProfileAPI.updatePreferences(data),
    onSuccess: (preferences) => {
      queryClient.setQueryData(['profile', 'preferences'], preferences);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Preferências salvas!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao salvar preferências');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => ProfileAPI.changePassword(data),
    onSuccess: (result) => {
      toast.success(result.message);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao alterar senha');
    },
  });
}

export function useActiveSessions() {
  return useQuery<ActiveSession[]>({
    queryKey: ['profile', 'sessions'],
    queryFn: ProfileAPI.getSessions,
    staleTime: 60 * 1000,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => ProfileAPI.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] });
      toast.success('Sessão encerrada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao encerrar sessão');
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ProfileAPI.revokeAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] });
      toast.success('Todas as sessões foram encerradas');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao encerrar sessões');
    },
  });
}

export function useSecurityEvents() {
  return useQuery<SecurityEvent[]>({
    queryKey: ['profile', 'security-events'],
    queryFn: ProfileAPI.getSecurityEvents,
    staleTime: 60 * 1000,
  });
}
