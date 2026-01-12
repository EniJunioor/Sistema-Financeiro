'use client';

import { Trophy, Flame, Star, Target, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GamificationData } from '@/lib/goals-api';

interface GamificationDashboardProps {
  data: GamificationData;
  isLoading?: boolean;
}

const badgeCategories = {
  achievement: { label: 'Conquista', color: 'bg-yellow-100 text-yellow-800' },
  milestone: { label: 'Marco', color: 'bg-blue-100 text-blue-800' },
  streak: { label: 'Sequência', color: 'bg-orange-100 text-orange-800' },
  completion: { label: 'Conclusão', color: 'bg-green-100 text-green-800' },
  special: { label: 'Especial', color: 'bg-purple-100 text-purple-800' },
};

const levelTitles = [
  'Iniciante',
  'Aprendiz',
  'Praticante',
  'Experiente',
  'Especialista',
  'Mestre',
  'Lenda',
];

export function GamificationDashboard({ data, isLoading }: GamificationDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getLevelTitle = (level: number) => {
    return levelTitles[Math.min(level - 1, levelTitles.length - 1)] || 'Lenda';
  };

  const getExperienceProgress = () => {
    if (data.nextLevelExperience === 0) return 100;
    return (data.experience / data.nextLevelExperience) * 100;
  };

  const getCompletionRate = () => {
    if (data.totalGoals === 0) return 0;
    return (data.completedGoals / data.totalGoals) * 100;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level and Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Nível e Experiência</span>
          </CardTitle>
          <CardDescription>
            Seu progresso na jornada financeira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Nível {data.level}
                </h3>
                <p className="text-sm text-gray-600">
                  {getLevelTitle(data.level)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {data.experience} XP
                </p>
                <p className="text-xs text-gray-500">
                  {data.nextLevelExperience > 0 
                    ? `${data.nextLevelExperience - data.experience} XP para próximo nível`
                    : 'Nível máximo atingido!'
                  }
                </p>
              </div>
            </div>
            
            {data.nextLevelExperience > 0 && (
              <div className="space-y-2">
                <Progress value={getExperienceProgress()} className="h-3" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 XP</span>
                  <span>{data.nextLevelExperience} XP</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.totalGoals}
                </p>
                <p className="text-xs text-gray-500">Metas Criadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.completedGoals}
                </p>
                <p className="text-xs text-gray-500">Metas Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.activeGoals}
                </p>
                <p className="text-xs text-gray-500">Metas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.totalSaved)}
                </p>
                <p className="text-xs text-gray-500">Total Economizado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Sucesso</CardTitle>
          <CardDescription>
            Percentual de metas concluídas com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {data.completedGoals} de {data.totalGoals} metas concluídas
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {getCompletionRate().toFixed(0)}%
              </span>
            </div>
            <Progress value={getCompletionRate()} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {data.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Badges Conquistados</span>
            </CardTitle>
            <CardDescription>
              Suas conquistas e marcos alcançados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="text-2xl">{badge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {badge.name}
                      </h4>
                      <Badge 
                        className={
                          badgeCategories[badge.category as keyof typeof badgeCategories]?.color || 
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {badgeCategories[badge.category as keyof typeof badgeCategories]?.label || badge.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {badge.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      Conquistado em {new Date(badge.earnedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streaks */}
      {data.streaks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span>Sequências Ativas</span>
            </CardTitle>
            <CardDescription>
              Mantenha o foco e continue progredindo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.streaks.map((streak) => (
                <div
                  key={streak.goalId}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200"
                >
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {streak.goalName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Última atividade: {new Date(streak.lastActivityDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-lg font-bold text-orange-600">
                        {streak.currentStreak}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Recorde: {streak.longestStreak} dias
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {data.badges.length === 0 && data.streaks.length === 0 && data.totalGoals === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Comece sua jornada!
            </h3>
            <p className="text-gray-500 mb-4">
              Crie sua primeira meta para começar a ganhar experiência e badges.
            </p>
            <Button>
              Criar primeira meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}