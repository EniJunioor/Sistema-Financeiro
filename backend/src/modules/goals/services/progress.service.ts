import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GoalProgressDto } from '../dto';
import { Goal, GoalProgress, GoalStatus } from '../interfaces/goal.interface';
import { GamificationService } from './gamification.service';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async calculateGoalProgress(goal: Goal): Promise<GoalProgressDto> {
    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const progressPercentage = Math.min((currentAmount / targetAmount) * 100, 100);
    const status = this.determineGoalStatus(goal, progressPercentage);
    
    let monthlyRequired: number | undefined;
    let daysRemaining: number | undefined;
    let projectedCompletion: string | undefined;

    if (goal.targetDate && goal.isActive) {
      const now = new Date();
      const targetDate = new Date(goal.targetDate);
      daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      if (daysRemaining > 0) {
        const remainingAmount = targetAmount - currentAmount;
        const monthsRemaining = daysRemaining / 30.44; // Average days per month
        monthlyRequired = remainingAmount / monthsRemaining;

        // Calculate projected completion based on current progress rate
        const daysSinceCreation = Math.ceil((now.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceCreation > 0 && currentAmount > 0) {
          const dailyRate = currentAmount / daysSinceCreation;
          const daysToComplete = (targetAmount - currentAmount) / dailyRate;
          projectedCompletion = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000).toISOString();
        }
      }
    }

    // Get user badges and streaks
    const badges = await this.gamificationService.getUserBadges(goal.userId);
    const streaks = await this.gamificationService.getUserStreaks(goal.userId);
    const goalStreak = streaks.find(s => s.goalId === goal.id);

    return {
      id: goal.id,
      name: goal.name,
      type: goal.type,
      targetAmount: targetAmount,
      currentAmount: currentAmount,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      monthlyRequired: monthlyRequired ? Math.round(monthlyRequired * 100) / 100 : undefined,
      daysRemaining,
      projectedCompletion,
      status,
      badges: badges.map(b => b.name),
      currentStreak: goalStreak?.currentStreak || 0,
    };
  }

  async getAllGoalsProgress(userId: string): Promise<GoalProgressDto[]> {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const progressPromises = goals.map(goal => this.calculateGoalProgress(goal as unknown as Goal));
    return Promise.all(progressPromises);
  }

  async getActiveGoalsProgress(userId: string): Promise<GoalProgressDto[]> {
    const goals = await this.prisma.goal.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const progressPromises = goals.map(goal => this.calculateGoalProgress(goal as unknown as Goal));
    return Promise.all(progressPromises);
  }

  private determineGoalStatus(goal: Goal, progressPercentage: number): GoalStatus {
    if (progressPercentage >= 100) {
      return GoalStatus.COMPLETED;
    }

    if (!goal.targetDate || !goal.isActive) {
      return progressPercentage > 0 ? GoalStatus.ON_TRACK : GoalStatus.BEHIND;
    }

    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const createdDate = new Date(goal.createdAt);

    if (now > targetDate) {
      return GoalStatus.OVERDUE;
    }

    // Calculate expected progress based on time elapsed
    const totalDuration = targetDate.getTime() - createdDate.getTime();
    const elapsedDuration = now.getTime() - createdDate.getTime();
    const expectedProgress = (elapsedDuration / totalDuration) * 100;

    const progressDifference = progressPercentage - expectedProgress;

    if (progressDifference > 10) {
      return GoalStatus.AHEAD;
    } else if (progressDifference < -10) {
      return GoalStatus.BEHIND;
    } else {
      return GoalStatus.ON_TRACK;
    }
  }

  async getGoalInsights(userId: string): Promise<{
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    averageProgress: number;
    goalsOnTrack: number;
    goalsBehind: number;
    goalsAhead: number;
  }> {
    const allProgress = await this.getAllGoalsProgress(userId);
    
    const totalGoals = allProgress.length;
    const activeGoals = allProgress.filter(p => p.status !== GoalStatus.COMPLETED).length;
    const completedGoals = allProgress.filter(p => p.status === GoalStatus.COMPLETED).length;
    
    const averageProgress = totalGoals > 0 
      ? allProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / totalGoals 
      : 0;

    const goalsOnTrack = allProgress.filter(p => p.status === GoalStatus.ON_TRACK).length;
    const goalsBehind = allProgress.filter(p => p.status === GoalStatus.BEHIND || p.status === GoalStatus.OVERDUE).length;
    const goalsAhead = allProgress.filter(p => p.status === GoalStatus.AHEAD).length;

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      averageProgress: Math.round(averageProgress * 100) / 100,
      goalsOnTrack,
      goalsBehind,
      goalsAhead,
    };
  }

  async suggestGoalAdjustments(goalId: string, userId: string): Promise<{
    suggestions: string[];
    adjustedTargetAmount?: number;
    adjustedTargetDate?: string;
  }> {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      return { suggestions: [] };
    }

    const progress = await this.calculateGoalProgress(goal as unknown as Goal);
    const suggestions: string[] = [];
    let adjustedTargetAmount: number | undefined;
    let adjustedTargetDate: string | undefined;

    if (progress.status === GoalStatus.BEHIND || progress.status === GoalStatus.OVERDUE) {
      suggestions.push('Consider extending your target date to make the goal more achievable');
      suggestions.push('Review your spending habits to identify areas where you can save more');
      
      if (progress.monthlyRequired && progress.monthlyRequired > 0) {
        suggestions.push(`Try to save $${progress.monthlyRequired.toFixed(2)} per month to stay on track`);
      }

      // Suggest adjusted target date (add 3 months)
      if (goal.targetDate) {
        const newTargetDate = new Date(goal.targetDate);
        newTargetDate.setMonth(newTargetDate.getMonth() + 3);
        adjustedTargetDate = newTargetDate.toISOString();
      }
    }

    if (progress.status === GoalStatus.AHEAD) {
      suggestions.push('Great progress! Consider increasing your target amount for a bigger challenge');
      suggestions.push('You might be able to reach your goal earlier than planned');
      
      // Suggest 20% higher target amount
      adjustedTargetAmount = Number(goal.targetAmount) * 1.2;
    }

    if (progress.progressPercentage < 10 && goal.createdAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      suggestions.push('Set up automatic transfers to make saving easier');
      suggestions.push('Break down your goal into smaller, weekly targets');
    }

    return {
      suggestions,
      adjustedTargetAmount: adjustedTargetAmount ? Math.round(adjustedTargetAmount * 100) / 100 : undefined,
      adjustedTargetDate,
    };
  }
}