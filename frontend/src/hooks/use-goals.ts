'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  goalsApi, 
  type Goal, 
  type CreateGoalData, 
  type UpdateGoalData, 
  type GoalFilters,
  type GoalProgress,
  type GamificationData,
  type GoalInsights
} from '@/lib/goals-api';

// Query keys
const QUERY_KEYS = {
  goals: ['goals'] as const,
  goal: (id: string) => ['goals', id] as const,
  activeGoals: ['goals', 'active'] as const,
  completedGoals: ['goals', 'completed'] as const,
  goalProgress: (id: string) => ['goals', id, 'progress'] as const,
  allGoalsProgress: ['goals', 'progress'] as const,
  goalInsights: ['goals', 'insights'] as const,
  gamification: ['goals', 'gamification'] as const,
  goalSuggestions: (id: string) => ['goals', id, 'suggestions'] as const,
};

// Get all goals
export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.goals, filters],
    queryFn: () => goalsApi.getGoals(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get active goals
export function useActiveGoals() {
  return useQuery({
    queryKey: QUERY_KEYS.activeGoals,
    queryFn: goalsApi.getActiveGoals,
    staleTime: 5 * 60 * 1000,
  });
}

// Get completed goals
export function useCompletedGoals() {
  return useQuery({
    queryKey: QUERY_KEYS.completedGoals,
    queryFn: goalsApi.getCompletedGoals,
    staleTime: 10 * 60 * 1000, // 10 minutes (less frequent updates)
  });
}

// Get single goal
export function useGoal(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.goal(id),
    queryFn: () => goalsApi.getGoal(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Get goal progress
export function useGoalProgress(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.goalProgress(id),
    queryFn: () => goalsApi.getGoalProgress(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for progress)
  });
}

// Get all goals progress
export function useAllGoalsProgress() {
  return useQuery({
    queryKey: QUERY_KEYS.allGoalsProgress,
    queryFn: goalsApi.getAllGoalsProgress,
    staleTime: 2 * 60 * 1000,
  });
}

// Get goal insights
export function useGoalInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.goalInsights,
    queryFn: goalsApi.getGoalInsights,
    staleTime: 10 * 60 * 1000,
  });
}

// Get gamification data
export function useGamificationData() {
  return useQuery({
    queryKey: QUERY_KEYS.gamification,
    queryFn: goalsApi.getGamificationData,
    staleTime: 5 * 60 * 1000,
  });
}

// Get goal suggestions
export function useGoalSuggestions(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.goalSuggestions(id),
    queryFn: () => goalsApi.getGoalSuggestions(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes (suggestions don't change often)
  });
}

// Create goal mutation
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoalData) => goalsApi.createGoal(data),
    onSuccess: (newGoal) => {
      // Invalidate and refetch goals
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeGoals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allGoalsProgress });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goalInsights });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gamification });

      toast.success('Meta criada com sucesso!', {
        description: `A meta "${newGoal.name}" foi criada e está ativa.`,
      });
    },
    onError: (error: any) => {
      toast.error('Erro ao criar meta', {
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    },
  });
}

// Update goal mutation
export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalData }) => 
      goalsApi.updateGoal(id, data),
    onSuccess: (updatedGoal, { id }) => {
      // Update specific goal in cache
      queryClient.setQueryData(QUERY_KEYS.goal(id), updatedGoal);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeGoals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allGoalsProgress });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goalProgress(id) });

      toast.success('Meta atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar meta', {
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    },
  });
}

// Delete goal mutation
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteGoal(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.goal(id) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.goalProgress(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeGoals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.completedGoals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allGoalsProgress });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goalInsights });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gamification });

      toast.success('Meta excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir meta', {
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    },
  });
}

// Update goal progress mutation
export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsApi.updateGoalProgress(id),
    onSuccess: (_, id) => {
      // Invalidate progress queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goalProgress(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allGoalsProgress });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goal(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gamification });

      toast.success('Progresso atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar progresso', {
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    },
  });
}