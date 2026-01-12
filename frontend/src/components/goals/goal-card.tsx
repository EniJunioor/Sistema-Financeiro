'use client';

import { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash2, 
  RefreshCw,
  Trophy,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Goal } from '@/lib/goals-api';

interface GoalCardProps {
  goal: Goal;
  progress?: {
    progressPercentage: number;
    status: 'on_track' | 'behind' | 'ahead' | 'completed' | 'overdue';
    badges: string[];
    currentStreak: number;
    monthlyRequired?: number;
    daysRemaining?: number;
  };
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onUpdateProgress?: (goalId: string) => void;
  isLoading?: boolean;
}

export function GoalCard({ 
  goal, 
  progress, 
  onEdit, 
  onDelete, 
  onUpdateProgress,
  isLoading 
}: GoalCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getGoalTypeInfo = (type: Goal['type']) => {
    switch (type) {
      case 'savings':
        return { label: 'Economia', color: 'bg-green-100 text-green-800' };
      case 'spending_limit':
        return { label: 'Limite de Gastos', color: 'bg-red-100 text-red-800' };
      case 'investment':
        return { label: 'Investimento', color: 'bg-blue-100 text-blue-800' };
      case 'debt_payoff':
        return { label: 'Quitação de Dívida', color: 'bg-orange-100 text-orange-800' };
      default:
        return { label: 'Meta', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'completed':
        return { 
          icon: CheckCircle2, 
          color: 'text-green-600', 
          bgColor: 'bg-green-50',
          label: 'Concluída' 
        };
      case 'ahead':
        return { 
          icon: TrendingUp, 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-50',
          label: 'Adiantada' 
        };
      case 'on_track':
        return { 
          icon: Target, 
          color: 'text-green-600', 
          bgColor: 'bg-green-50',
          label: 'No prazo' 
        };
      case 'behind':
        return { 
          icon: AlertTriangle, 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-50',
          label: 'Atrasada' 
        };
      case 'overdue':
        return { 
          icon: Clock, 
          color: 'text-red-600', 
          bgColor: 'bg-red-50',
          label: 'Vencida' 
        };
      default:
        return { 
          icon: Target, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-50',
          label: 'Em progresso' 
        };
    }
  };

  const getProgressColor = (percentage: number, status?: string) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'ahead') return 'bg-blue-500';
    if (status === 'overdue') return 'bg-red-500';
    if (status === 'behind') return 'bg-yellow-500';
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getDaysRemaining = () => {
    if (!goal.targetDate) return null;
    
    const target = new Date(goal.targetDate);
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

  const progressPercentage = progress?.progressPercentage ?? 
    Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  
  const statusInfo = getStatusInfo(progress?.status);
  const StatusIcon = statusInfo.icon;
  const typeInfo = getGoalTypeInfo(goal.type);
  const daysRemaining = getDaysRemaining();

  return (
    <>
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md',
        !goal.isActive && 'opacity-60'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {goal.name}
                </h3>
                {!goal.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inativa
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={typeInfo.color}>
                  {typeInfo.label}
                </Badge>
                {progress?.status && (
                  <div className={cn(
                    'flex items-center space-x-1 px-2 py-1 rounded-full text-xs',
                    statusInfo.bgColor
                  )}>
                    <StatusIcon className={cn('h-3 w-3', statusInfo.color)} />
                    <span className={statusInfo.color}>{statusInfo.label}</span>
                  </div>
                )}
              </div>
              {goal.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {goal.description}
                </p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onUpdateProgress && (
                  <DropdownMenuItem 
                    onClick={() => onUpdateProgress(goal.id)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn(
                      'mr-2 h-4 w-4',
                      isLoading && 'animate-spin'
                    )} />
                    Atualizar Progresso
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progresso</span>
              <span className="font-medium">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
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

          {/* Additional Info */}
          <div className="flex items-center justify-between text-sm">
            {daysRemaining && (
              <div className="flex items-center space-x-1 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{daysRemaining}</span>
              </div>
            )}
            
            {progress?.monthlyRequired && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Mensal necessário</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(progress.monthlyRequired)}
                </p>
              </div>
            )}
          </div>

          {/* Gamification Elements */}
          {(progress?.badges.length || progress?.currentStreak) && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              {progress.badges.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-gray-600">
                    {progress.badges.length} badge{progress.badges.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {progress.currentStreak > 0 && (
                <div className="flex items-center space-x-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-gray-600">
                    {progress.currentStreak} dias
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Completion Message */}
          {progress?.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Parabéns! Meta atingida! 🎉
                  </p>
                  <p className="text-xs text-green-600">
                    Você conseguiu alcançar seu objetivo financeiro.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta &quot;{goal.name}&quot;? 
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(goal.id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}