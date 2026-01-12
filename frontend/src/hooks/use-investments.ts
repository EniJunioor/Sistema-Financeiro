import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentsApi } from '@/lib/investments-api';
import type {
  Investment,
  PortfolioSummary,
  AssetAllocation,
  PerformanceMetrics,
  CreateInvestmentDto,
  UpdateInvestmentDto,
  InvestmentFilters,
  PortfolioAnalysis
} from '@/types/investment';
import { toast } from 'sonner';

export function useInvestments(filters?: InvestmentFilters) {
  return useQuery({
    queryKey: ['investments', filters],
    queryFn: () => investmentsApi.getInvestments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInvestment(id: string) {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: () => investmentsApi.getInvestment(id),
    enabled: !!id,
  });
}

export function usePortfolio(filters?: InvestmentFilters) {
  return useQuery({
    queryKey: ['portfolio', filters],
    queryFn: () => investmentsApi.getPortfolio(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAssetAllocation() {
  return useQuery({
    queryKey: ['asset-allocation'],
    queryFn: () => investmentsApi.getAssetAllocation(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePerformanceMetrics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['performance-metrics', startDate, endDate],
    queryFn: () => investmentsApi.getPerformanceMetrics(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePortfolioAnalysis() {
  return useQuery({
    queryKey: ['portfolio-analysis'],
    queryFn: () => investmentsApi.getPortfolioAnalysis(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useInvestmentStats() {
  return useQuery({
    queryKey: ['investment-stats'],
    queryFn: () => investmentsApi.getInvestmentStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvestmentDto) => investmentsApi.createInvestment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['asset-allocation'] });
      queryClient.invalidateQueries({ queryKey: ['investment-stats'] });
      toast.success('Investimento adicionado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao adicionar investimento');
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvestmentDto }) =>
      investmentsApi.updateInvestment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['investment', id] });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Investimento atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar investimento');
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => investmentsApi.deleteInvestment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['asset-allocation'] });
      queryClient.invalidateQueries({ queryKey: ['investment-stats'] });
      toast.success('Investimento removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover investimento');
    },
  });
}

export function useUpdateQuotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => investmentsApi.updateQuotes(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
      toast.success('Cotações atualizadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar cotações');
    },
  });
}

export function useRebalancingRecommendations() {
  return useMutation({
    mutationFn: (targetAllocation: Record<string, number>) =>
      investmentsApi.getRebalancingRecommendations(targetAllocation),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao calcular rebalanceamento');
    },
  });
}

export function useOptimalAllocation() {
  return useMutation({
    mutationFn: (riskTolerance: 'conservative' | 'moderate' | 'aggressive') =>
      investmentsApi.getOptimalAllocation(riskTolerance),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao calcular alocação ótima');
    },
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      investmentId: string;
      type: 'buy' | 'sell' | 'dividend';
      quantity: number;
      price: number;
      fees?: number;
      date: string;
    }) => investmentsApi.addTransaction(data),
    onSuccess: (_, { investmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['investment', investmentId] });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
      toast.success('Transação adicionada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao adicionar transação');
    },
  });
}