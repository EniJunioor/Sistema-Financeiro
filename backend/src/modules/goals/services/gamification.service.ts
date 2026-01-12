import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { 
  GamificationData, 
  UserBadgeData, 
  StreakData, 
  LevelSystem, 
  ExperienceGain 
} from '../interfaces/gamification.interface';

@Injectable()
export class GamificationService {
  private readonly badges = [
    {
      id: 'first_goal',
      name: 'Goal Setter',
      description: 'Created your first financial goal',
      icon: '🎯',
      category: 'achievement',
      requirement: { type: 'goals_created', value: 1 },
    },
    {
      id: 'goal_master',
      name: 'Goal Master',
      description: 'Created 5 financial goals',
      icon: '🏆',
      category: 'achievement',
      requirement: { type: 'goals_created', value: 5 },
    },
    {
      id: 'first_completion',
      name: 'Achiever',
      description: 'Completed your first goal',
      icon: '✅',
      category: 'achievement',
      requirement: { type: 'goal_completion', value: 1 },
    },
    {
      id: 'goal_champion',
      name: 'Goal Champion',
      description: 'Completed 5 goals',
      icon: '🏅',
      category: 'achievement',
      requirement: { type: 'goal_completion', value: 5 },
    },
    {
      id: 'saver_bronze',
      name: 'Bronze Saver',
      description: 'Saved $1,000',
      icon: '🥉',
      category: 'milestone',
      requirement: { type: 'savings_amount', value: 1000 },
    },
    {
      id: 'saver_silver',
      name: 'Silver Saver',
      description: 'Saved $5,000',
      icon: '🥈',
      category: 'milestone',
      requirement: { type: 'savings_amount', value: 5000 },
    },
    {
      id: 'saver_gold',
      name: 'Gold Saver',
      description: 'Saved $10,000',
      icon: '🥇',
      category: 'milestone',
      requirement: { type: 'savings_amount', value: 10000 },
    },
    {
      id: 'streak_week',
      name: 'Weekly Warrior',
      description: 'Maintained progress for 7 days',
      icon: '🔥',
      category: 'streak',
      requirement: { type: 'streak_days', value: 7 },
    },
    {
      id: 'streak_month',
      name: 'Monthly Master',
      description: 'Maintained progress for 30 days',
      icon: '🌟',
      category: 'streak',
      requirement: { type: 'streak_days', value: 30 },
    },
    {
      id: 'streak_legend',
      name: 'Streak Legend',
      description: 'Maintained progress for 100 days',
      icon: '👑',
      category: 'streak',
      requirement: { type: 'streak_days', value: 100 },
    },
  ];

  private readonly levelSystem: LevelSystem[] = [
    { level: 1, minExperience: 0, maxExperience: 100, title: 'Beginner', benefits: ['Basic goal tracking'] },
    { level: 2, minExperience: 100, maxExperience: 250, title: 'Saver', benefits: ['Progress insights', 'Basic badges'] },
    { level: 3, minExperience: 250, maxExperience: 500, title: 'Planner', benefits: ['Goal suggestions', 'Streak tracking'] },
    { level: 4, minExperience: 500, maxExperience: 1000, title: 'Achiever', benefits: ['Advanced analytics', 'Custom goals'] },
    { level: 5, minExperience: 1000, maxExperience: 2000, title: 'Expert', benefits: ['Goal automation', 'Premium insights'] },
    { level: 6, minExperience: 2000, maxExperience: 5000, title: 'Master', benefits: ['All features', 'Priority support'] },
    { level: 7, minExperience: 5000, maxExperience: 10000, title: 'Legend', benefits: ['Exclusive features', 'Beta access'] },
  ];

  private readonly experienceGains: Record<string, ExperienceGain> = {
    goal_created: { action: 'goal_created', points: 10, description: 'Created a new goal' },
    goal_completed: { action: 'goal_completed', points: 50, description: 'Completed a goal' },
    milestone_reached: { action: 'milestone_reached', points: 25, description: 'Reached a milestone' },
    streak_maintained: { action: 'streak_maintained', points: 5, description: 'Maintained streak' },
  };

  constructor(private readonly prisma: PrismaService) {}

  async getGamificationData(userId: string): Promise<GamificationData> {
    // Get user goals statistics
    const goals = await this.prisma.goal.findMany({
      where: { userId },
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => !g.isActive && g.currentAmount >= g.targetAmount).length;
    const activeGoals = goals.filter(g => g.isActive).length;

    // Calculate total saved
    const totalSaved = goals
      .filter(g => g.type === 'savings')
      .reduce((sum, g) => sum + Number(g.currentAmount), 0);

    // Get user badges and streaks
    const badges = await this.getUserBadges(userId);
    const streaks = await this.getUserStreaks(userId);

    // Get user level and experience
    const userExperience = await this.getUserExperience(userId);
    const level = this.calculateLevel(userExperience);
    const nextLevel = this.levelSystem.find(l => l.level === level.level + 1);

    return {
      userId,
      totalGoals,
      completedGoals,
      activeGoals,
      totalSaved,
      badges,
      streaks,
      level: level.level,
      experience: userExperience,
      nextLevelExperience: nextLevel?.minExperience || level.maxExperience,
    };
  }

  async getUserBadges(userId: string): Promise<UserBadgeData[]> {
    // In a real implementation, this would query a user_badges table
    // For now, we'll calculate badges based on current data
    const earnedBadges: UserBadgeData[] = [];
    
    const goals = await this.prisma.goal.findMany({
      where: { userId },
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => !g.isActive && g.currentAmount >= g.targetAmount).length;
    const totalSaved = goals
      .filter(g => g.type === 'savings')
      .reduce((sum, g) => sum + Number(g.currentAmount), 0);

    // Check achievement badges
    for (const badge of this.badges) {
      let earned = false;
      let earnedAt = new Date();

      switch (badge.requirement.type) {
        case 'goals_created':
          earned = totalGoals >= badge.requirement.value;
          break;
        case 'goal_completion':
          earned = completedGoals >= badge.requirement.value;
          break;
        case 'savings_amount':
          earned = totalSaved >= badge.requirement.value;
          break;
        case 'streak_days':
          // This would require streak tracking implementation
          earned = false;
          break;
      }

      if (earned) {
        earnedBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          earnedAt,
        });
      }
    }

    return earnedBadges;
  }

  async getUserStreaks(userId: string): Promise<StreakData[]> {
    // In a real implementation, this would track daily progress
    // For now, return empty array as streak tracking requires daily updates
    return [];
  }

  async awardExperience(userId: string, action: string, goalId?: string): Promise<void> {
    const experienceGain = this.experienceGains[action];
    if (!experienceGain) return;

    // In a real implementation, this would update a user_experience table
    // For now, we'll just log the experience gain
    console.log(`User ${userId} gained ${experienceGain.points} XP for ${experienceGain.description}`);
  }

  async checkMilestones(userId: string, goalId: string, currentAmount: number, targetAmount: number): Promise<void> {
    const progressPercentage = (currentAmount / targetAmount) * 100;
    
    // Check for milestone badges (25%, 50%, 75%, 100%)
    const milestones = [25, 50, 75, 100];
    
    for (const milestone of milestones) {
      if (progressPercentage >= milestone) {
        await this.awardExperience(userId, 'milestone_reached', goalId);
      }
    }
  }

  async checkCompletionBadges(userId: string, goalId: string): Promise<void> {
    const completedGoals = await this.prisma.goal.count({
      where: {
        userId,
        isActive: false,
        currentAmount: { gte: this.prisma.goal.fields.targetAmount },
      },
    });

    // Award badges based on completion count
    if (completedGoals === 1) {
      // Award first completion badge
    } else if (completedGoals === 5) {
      // Award goal champion badge
    }
  }

  async updateStreak(userId: string, goalId: string): Promise<void> {
    // In a real implementation, this would update streak data
    // This should be called daily when user makes progress
    console.log(`Updating streak for user ${userId}, goal ${goalId}`);
  }

  private async getUserExperience(userId: string): Promise<number> {
    // In a real implementation, this would query user_experience table
    // For now, calculate based on goals
    const goals = await this.prisma.goal.findMany({
      where: { userId },
    });

    let experience = 0;
    experience += goals.length * this.experienceGains.goal_created.points;
    experience += goals.filter(g => !g.isActive && g.currentAmount >= g.targetAmount).length * this.experienceGains.goal_completed.points;

    return experience;
  }

  private calculateLevel(experience: number): LevelSystem {
    for (let i = this.levelSystem.length - 1; i >= 0; i--) {
      const level = this.levelSystem[i];
      if (experience >= level.minExperience) {
        return level;
      }
    }
    return this.levelSystem[0];
  }

  async getLeaderboard(userId: string): Promise<{
    userRank: number;
    userScore: number;
    topUsers: Array<{
      userId: string;
      name: string;
      score: number;
      level: number;
    }>;
  }> {
    // In a real implementation, this would query all users and rank them
    // For now, return mock data
    return {
      userRank: 1,
      userScore: await this.getUserExperience(userId),
      topUsers: [],
    };
  }

  getBadgeById(badgeId: string) {
    return this.badges.find(b => b.id === badgeId);
  }

  getLevelSystem() {
    return this.levelSystem;
  }

  getExperienceGains() {
    return this.experienceGains;
  }
}