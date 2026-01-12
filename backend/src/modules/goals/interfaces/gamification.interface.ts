export interface GamificationData {
  userId: string;
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalSaved: number;
  badges: UserBadgeData[];
  streaks: StreakData[];
  level: number;
  experience: number;
  nextLevelExperience: number;
}

export interface UserBadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: Date;
  goalId?: string;
}

export interface StreakData {
  goalId: string;
  goalName: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
}

export interface LevelSystem {
  level: number;
  minExperience: number;
  maxExperience: number;
  title: string;
  benefits: string[];
}

export interface ExperienceGain {
  action: 'goal_created' | 'goal_completed' | 'milestone_reached' | 'streak_maintained';
  points: number;
  description: string;
}