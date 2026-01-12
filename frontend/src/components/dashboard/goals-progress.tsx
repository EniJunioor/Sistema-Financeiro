'use client';

import { Target, TrendingUp, Calendar, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useActiveGoals, useAllGoalsProgress } from '@/hooks/use-goals';
import type { Goal } from '@/lib/goals-api';

interface GoalsProgressProps {
  onCreateGoal?: () => void;
}

export function GoalsProgress({ onCreateGoal }: GoalsProgressProps) {
  const { data: goals, isLoading: goalsLoading } = useActiveGoals();
  const { data: goalsProgress, isLoading: progressLoading } = useAllGoalsProgress();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  const getGoalTypeLabel = (type: Goal['type']) => {
    switch (type) {
      case 'savings':
        return 'Economia';
      case 'spending_limit':
        return 'Limite de Gastos';
      case 'investment':
        return 'Investimento';
      case 'debt_payoff':
        return 'Quitação de Dívida';
      default:
        return 'Meta';
    }
  };

  const getGoalTypeColor = (type: Goal['type']) => {
    switch (type) {
      case 'savings':
        return 'bg-green-100 text-green-800';
      case 'spending_limit':
        return 'bg-red-100 text-red-800';
      case 'investment':
        return 'bg-blue-100 text-blue-800';
      case 'debt_payoff':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number, type: Goal['type']) => {
    if (type === 'spending_limit') {
      // For spending limits, higher progress is worse
      if (progress >= 90) return 'bg-red-500';
      if (progress >= 75) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      // For savings and investments, higher progress is better
      if (progress >= 75) return 'bg-green-500';
      if (progress >= 50) return 'bg-blue-500';
      return 'bg-gray-400';
    }
  };

  const getDaysRemaining = (targetDate?: string) => {
    if (!targetDate) return null;
    
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencida';
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return '1 dia';
    if (diffDays <= 30) return `${diffDays} dias`;
    
    const months = Math.floor(diffDays / 30);
    if (months === 1) return '1 mês';
    return `${months} meses`;
  };

  const getGoalProgress = (goalId: string) => {
    return goalsProgress?.find(p => p.id === goalId);
  };

  if (goalsLoading || progressLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Metas Financeiras</CardTitle>
          <CardDescription>Progresso das suas metas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-12" />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals?.filter(goal => goal.isActive) || [];

  if (activeGoals.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Metas Financeiras</CardTitle>
            <CardDescription>Progresso das suas metas</CardDescription>
          </div>
          <Button size="sm" className="flex items-center space-x-1" onClick={onCreateGoal}>
            <Plus className="h-4 w-4" />
            <span>Nova Meta</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 mb-2">Nenhuma meta ativa</div>
            <p className="text-sm text-gray-400 mb-4">
              Defina metas financeiras para acompanhar seu progresso.
            </p>
            <Button variant="outline" size="sm" onClick={onCreateGoal}>
              Criar primeira meta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Metas Financeiras</CardTitle>
          <CardDescription>Progresso das suas metas</CardDescription>
        </div>
        <Button size="sm" variant="outline" className="flex items-center space-x-1" onClick={onCreateGoal}>
          <Plus className="h-4 w-4" />
          <span>Nova Meta</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activeGoals.slice(0, 4).map((goal) => {
            const goalProgress = getGoalProgress(goal.id);
            const progress = goalProgress?.progressPercentage ?? 
              Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const progressColor = getProgressColor(progress, goal.type);
            
            return (
              <div key={goal.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {goal.name}
                      </h4>
                      <Badge className={`text-xs ${getGoalTypeColor(goal.type)}`}>
                        {getGoalTypeLabel(goal.type)}
                      </Badge>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {progress.toFixed(0)}%
                    </div>
                    {daysRemaining && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {daysRemaining}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                    </span>
                    <span>
                      Restam {formatCurrency(goal.targetAmount - goal.currentAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress insights */}
                {progress >= 100 ? (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>Meta atingida! Parabéns!</span>
                  </div>
                ) : progress >= 75 ? (
                  <div className="flex items-center space-x-1 text-xs text-blue-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>Quase lá! Você está indo muito bem.</span>
                  </div>
                ) : progress >= 50 ? (
                  <div className="flex items-center space-x-1 text-xs text-yellow-600">
                    <Target className="h-3 w-3" />
                    <span>No meio do caminho. Continue assim!</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Target className="h-3 w-3" />
                    <span>Começando a jornada. Você consegue!</span>
                  </div>
                )}

                {/* Gamification elements */}
                {goalProgress && (goalProgress.badges.length > 0 || goalProgress.currentStreak > 0) && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {goalProgress.badges.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-gray-600">
                          {goalProgress.badges.length} badge{goalProgress.badges.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    
                    {goalProgress.currentStreak > 0 && (
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4 text-orange-500" />
                        <span className="text-xs text-gray-600">
                          {goalProgress.currentStreak} dias
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {activeGoals.length > 4 && (
            <div className="pt-4 border-t border-gray-100">
              <Button variant="ghost" className="w-full text-sm">
                Ver todas as {activeGoals.length} metas
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}