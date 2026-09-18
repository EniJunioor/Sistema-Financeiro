import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  PrivacyAPI,
  type ConsentState,
  type ConsentType,
  type DataDeletionRequest,
  type DataExportRequest,
  type PrivacySummary,
} from '@/lib/privacy-api';

export function usePrivacySummary() {
  return useQuery<PrivacySummary>({
    queryKey: ['privacy', 'summary'],
    queryFn: PrivacyAPI.getSummary,
    staleTime: 60 * 1000,
  });
}

export function useConsents() {
  return useQuery<ConsentState[]>({
    queryKey: ['privacy', 'consents'],
    queryFn: PrivacyAPI.getConsents,
    staleTime: 60 * 1000,
  });
}

export function useRecordConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, granted }: { type: ConsentType; granted: boolean }) =>
      PrivacyAPI.recordConsent(type, granted),
    onSuccess: (_, { granted }) => {
      queryClient.invalidateQueries({ queryKey: ['privacy'] });
      toast.success(granted ? 'Consentimento registrado' : 'Consentimento revogado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao registrar consentimento');
    },
  });
}

export function useDataExports() {
  return useQuery<DataExportRequest[]>({
    queryKey: ['privacy', 'exports'],
    queryFn: PrivacyAPI.listExports,
    staleTime: 30 * 1000,
  });
}

export function useRequestDataExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PrivacyAPI.requestExport(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy'] });
      toast.success('Exportação gerada! Já pode ser baixada.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao exportar dados');
    },
  });
}

/**
 * Baixa o JSON exportado direto no navegador, sem passar por uma página
 * intermediária.
 */
export function useDownloadDataExport() {
  return useMutation({
    mutationFn: async (requestId: string) => {
      const data = await PrivacyAPI.downloadExport(requestId);

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao baixar exportação');
    },
  });
}

export function useRequestDeletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) => PrivacyAPI.requestDeletion(reason),
    onSuccess: (request: DataDeletionRequest) => {
      queryClient.invalidateQueries({ queryKey: ['privacy'] });
      const date = new Date(request.scheduledFor).toLocaleDateString('pt-BR');
      toast.success(`Exclusão agendada para ${date}. Você pode cancelar até lá.`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao solicitar exclusão');
    },
  });
}

export function useCancelDeletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PrivacyAPI.cancelDeletion(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy'] });
      toast.success('Solicitação de exclusão cancelada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao cancelar exclusão');
    },
  });
}
