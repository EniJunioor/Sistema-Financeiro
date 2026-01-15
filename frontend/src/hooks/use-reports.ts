import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/reports-api';
import type { 
  ReportConfig, 
  ScheduleConfig, 
  GeneratedReport, 
  ScheduledReport,
  ReportTemplate,
  ShareConfig,
  SharedReport
} from '@/types/report';

export function useReports() {
  const queryClient = useQueryClient();

  // Get report templates
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError
  } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => reportsApi.getTemplates(),
    select: (data) => data.templates
  });

  // Get scheduled reports
  const {
    data: scheduledReports,
    isLoading: scheduledLoading,
    error: scheduledError,
    refetch: refetchScheduled
  } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: () => reportsApi.getScheduledReports()
  });

  // Get report history
  const {
    data: reportHistory,
    isLoading: historyLoading,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['report-history'],
    queryFn: () => reportsApi.getReportHistory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: (config: ReportConfig) => reportsApi.generateReport(config),
    onSuccess: (data) => {
      toast.success('Relatório gerado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report-history'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao gerar relatório');
    }
  });

  // Download report mutation
  const downloadReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      try {
        const blob = await reportsApi.downloadReport(config);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const extension = config.format === 'pdf' ? 'pdf' : config.format === 'excel' ? 'xlsx' : 'csv';
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `${config.title || 'relatorio'}_${timestamp}.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Relatório baixado com sucesso!');
        return blob;
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erro ao baixar relatório');
        throw error;
      }
    },
  });

  // Schedule report mutation
  const scheduleReportMutation = useMutation({
    mutationFn: (data: { config: ReportConfig; schedule: ScheduleConfig }) => 
      reportsApi.scheduleReport({ ...data.config, ...data.schedule }),
    onSuccess: () => {
      toast.success('Relatório agendado com sucesso!');
      refetchScheduled();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao agendar relatório');
    }
  });

  // Update scheduled report mutation
  const updateScheduledReportMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ReportConfig & ScheduleConfig> }) =>
      reportsApi.updateScheduledReport(id, updates),
    onSuccess: () => {
      toast.success('Relatório agendado atualizado!');
      refetchScheduled();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar relatório');
    }
  });

  // Toggle scheduled report mutation
  const toggleScheduledReportMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      reportsApi.toggleScheduledReport(id, isActive),
    onSuccess: (data) => {
      toast.success(`Relatório ${data.isActive ? 'ativado' : 'desativado'}!`);
      refetchScheduled();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao alterar status do relatório');
    }
  });

  // Delete scheduled report mutation
  const deleteScheduledReportMutation = useMutation({
    mutationFn: (id: string) => reportsApi.deleteScheduledReport(id),
    onSuccess: () => {
      toast.success('Relatório agendado removido!');
      refetchScheduled();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover relatório');
    }
  });

  // Helper functions - return objects with mutateAsync and isPending for compatibility
  const generateReport = {
    mutateAsync: generateReportMutation.mutateAsync.bind(generateReportMutation),
    isPending: generateReportMutation.isPending,
  };

  const downloadReport = {
    mutateAsync: downloadReportMutation.mutateAsync.bind(downloadReportMutation),
    isPending: downloadReportMutation.isPending,
  };

  // Preview report (mock implementation)
  const previewReport = useCallback(async (config: ReportConfig) => {
    // This would generate a preview of the report structure
    // For now, return a mock preview
    return {
      sections: [
        { id: 'summary', name: 'Resumo Financeiro', type: 'summary' as const, enabled: true, order: 1 },
        { id: 'charts', name: 'Gráficos', type: 'chart' as const, enabled: config.includeCharts || false, order: 2 },
        { id: 'transactions', name: 'Transações', type: 'table' as const, enabled: config.includeTransactions || false, order: 3 },
        { id: 'predictions', name: 'Previsões IA', type: 'chart' as const, enabled: config.includeAIPredictions || false, order: 4 }
      ],
      estimatedPages: 5,
      estimatedSize: '2.5 MB',
      generationTime: '30 segundos'
    };
  }, []);

  return {
    // Data
    templates: templates || [],
    scheduledReports: scheduledReports || [],
    reportHistory: reportHistory || [],
    
    // Loading states
    templatesLoading,
    scheduledLoading,
    historyLoading,
    isGenerating: generateReportMutation.isPending,
    isDownloading: downloadReportMutation.isPending,
    isScheduling: scheduleReportMutation.isPending,
    isUpdating: updateScheduledReportMutation.isPending,
    isDeleting: deleteScheduledReportMutation.isPending,
    
    // Error states
    templatesError,
    scheduledError,
    
    // Actions
    generateReport,
    downloadReport,
    scheduleReport: (config: ReportConfig, schedule: ScheduleConfig) => 
      scheduleReportMutation.mutateAsync({ config, schedule }),
    updateScheduledReport: (id: string, updates: Partial<ReportConfig & ScheduleConfig>) =>
      updateScheduledReportMutation.mutateAsync({ id, updates }),
    toggleScheduledReport: (id: string, isActive: boolean) =>
      toggleScheduledReportMutation.mutateAsync({ id, isActive }),
    deleteScheduledReport: (id: string) =>
      deleteScheduledReportMutation.mutateAsync(id),
    getReportHistory: (filters?: { startDate?: string; endDate?: string; type?: string }) =>
      reportsApi.getReportHistory(filters),
    previewReport,
    
    // Refetch functions
    refetchScheduled,
    refetchHistory
  };
}
