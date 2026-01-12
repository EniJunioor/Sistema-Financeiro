import { Decimal } from '@prisma/client/runtime/library';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'savings' | 'spending_limit' | 'investment' | 'debt_payoff';
  targetAmount: Decimal;
  currentAmount: Decimal;
  targetDate?: Date;
  categoryId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalProgress {
  goalId: string;
  progressPercentage: number;
  monthlyRequired?: number;
  daysRemaining?: number;
  projectedCompletion?: Date;
  status: GoalStatus;
}

export enum GoalStatus {
  ON_TRACK = 'on_track',
  BEHIND = 'behind',
  AHEAD = 'ahead',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'progress' | 'achievement' | 'streak' | 'milestone';
  requirement: {
    type: 'goal_completion' | 'streak_days' | 'savings_amount' | 'goals_created';
    value: number;
  };
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: Date;
  goalId?: string;
}

export interface Streak {
  userId: string;
  goalId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
}