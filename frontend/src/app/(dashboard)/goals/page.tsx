'use client';

import { useState } from 'react';
import { Plus, Target, BarChart3, Trophy, Filter, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { 
  GoalForm, 
  GoalCard, 
  GamificationDashboard, 
  GoalInsights,
  AchievementNotifications,
  useAchievementNotifications
} from '@/components/goals';

import { 
  useGoals, 
  useActiveGoals, 
  useCompletedGoals, 
  useAllGoalsProgress,
  useGamificationData,
  useGoalInsights,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useUpdateGoalProgress
} from '@/hooks/use-goals';

import type { Goal, GoalFilters } from '@/lib/goals-api';

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState('goals');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filters, setFilters] = useState<GoalFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Achievement notifications
  const { 
    achievements, 
    showAchievement, 
    dismissAchievement 
  } = useAchievementNotifications();

  // Queries
  const { data: goals, isLoading: goalsLoading } = useGoals(filters);
  const { data: activeGoals, isLoading: activeGoalsLoading } = useActiveGoals();
  const { data: completedGoals, isLoading: completedGoalsLoading } = useCompletedGoals();
  const { data: goalsProgress, isLoading: progressLoading } = useAllGoalsProgress();
  const { data: gamificationData, isLoading: gamificationLoading } = useGamificationData();
  const { data: insights, isLoading: insightsLoading } = useGoalInsights();

  // Mutations
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const updateProgressMutation = useUpdateGoalProgress();

  // Filter goals based on search query
  const filteredGoals = goals?.filter(goal => 
    goal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateGoal = async (data: any) => {
    try {
      const newGoal = await createGoalMutation.mutateAsync(data);
      setShowCreateDialog(false);
      
      // Show achievement notification
      showAchievement({
        id: `goal-created-${newGoal.id}`,
        title: 'Nova Meta Criada!',
        description: `Meta "${newGoal.name}" foi criada com sucesso.`,
        icon: '🎯',
        type: 'goal_completed',
        points: 10,
      });
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleUpdateGoal = async (data: any) => {
    if (!editingGoal) return;
    
    try {
      await updateGoalMutation.mutateAsync({ id: editingGoal.id, data });
      setEditingGoal(null);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoalMutation.mutateAsync(goalId);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleUpdateProgress = async (goalId: string) => {
    try {
      await updateProgressMutation.mutateAsync(goalId);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getGoalProgress = (goalId: string) => {
    return goalsProgress?.find(p => p.id === goalId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metas Financeiras</h1>
          <p className="text-gray-600 mt-2">
            Defina e acompanhe suas metas financeiras com gamificação
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Quick Stats */}
      {gamificationData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Metas Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {gamificationData.activeGoals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {gamificationData.completedGoals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Nível</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {gamificationData.level}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Badges</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {gamificationData.badges.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="goals">Minhas Metas</TabsTrigger>
          <TabsTrigger value="gamification">Gamificação</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar metas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      type: value === 'all' ? undefined : value as any 
                    }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tipo de meta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="savings">Economia</SelectItem>
                    <SelectItem value="spending_limit">Limite de Gastos</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                    <SelectItem value="debt_payoff">Quitação de Dívida</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.isActive?.toString() || 'all'}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      isActive: value === 'all' ? undefined : value === 'true' 
                    }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="true">Ativas</SelectItem>
                    <SelectItem value="false">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Goals Grid */}
          {goalsLoading || progressLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredGoals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Nenhuma meta encontrada' : 'Nenhuma meta criada'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? 'Tente ajustar os filtros ou termo de busca.'
                    : 'Comece criando sua primeira meta financeira.'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira meta
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  progress={getGoalProgress(goal.id)}
                  onEdit={setEditingGoal}
                  onDelete={handleDeleteGoal}
                  onUpdateProgress={handleUpdateProgress}
                  isLoading={updateProgressMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Gamification Tab */}
        <TabsContent value="gamification">
          {gamificationData ? (
            <GamificationDashboard 
              data={gamificationData} 
              isLoading={gamificationLoading} 
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Dados de gamificação não disponíveis
                </h3>
                <p className="text-gray-500">
                  Crie algumas metas para começar a ganhar experiência e badges.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          {insights ? (
            <GoalInsights 
              insights={insights} 
              isLoading={insightsLoading} 
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Insights não disponíveis
                </h3>
                <p className="text-gray-500">
                  Complete algumas metas para ver análises detalhadas.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Completed Goals Tab */}
        <TabsContent value="completed">
          {completedGoalsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : completedGoals?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma meta concluída ainda
                </h3>
                <p className="text-gray-500">
                  Continue trabalhando em suas metas ativas para vê-las aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedGoals?.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  progress={getGoalProgress(goal.id)}
                  onEdit={setEditingGoal}
                  onDelete={handleDeleteGoal}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Goal Dialog */}
      <Dialog 
        open={showCreateDialog || !!editingGoal} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingGoal(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
            </DialogTitle>
          </DialogHeader>
          <GoalForm
            goal={editingGoal || undefined}
            onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
            onCancel={() => {
              setShowCreateDialog(false);
              setEditingGoal(null);
            }}
            isLoading={createGoalMutation.isPending || updateGoalMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Achievement Notifications */}
      <AchievementNotifications
        achievements={achievements}
        onDismiss={dismissAchievement}
      />
    </div>
  );
}