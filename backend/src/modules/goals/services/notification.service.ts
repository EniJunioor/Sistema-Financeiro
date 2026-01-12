import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Goal } from '../interfaces/goal.interface';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async sendGoalCreatedNotification(userId: string, goal: Goal): Promise<void> {
    await this.createNotification(
      userId,
      'Goal Created',
      `Your goal "${goal.name}" has been created successfully!`,
      'success',
      `/goals/${goal.id}`
    );
  }

  async sendGoalCompletedNotification(userId: string, goal: Goal): Promise<void> {
    await this.createNotification(
      userId,
      'Goal Completed! 🎉',
      `Congratulations! You've completed your goal "${goal.name}"`,
      'success',
      `/goals/${goal.id}`
    );
  }

  async sendProgressNotification(userId: string, goal: Goal, currentAmount: number): Promise<void> {
    const progressPercentage = (currentAmount / Number(goal.targetAmount)) * 100;
    
    // Send milestone notifications
    if (progressPercentage >= 25 && progressPercentage < 50) {
      await this.createNotification(
        userId,
        'Quarter Way There!',
        `You're 25% towards your goal "${goal.name}". Keep it up!`,
        'info',
        `/goals/${goal.id}`
      );
    } else if (progressPercentage >= 50 && progressPercentage < 75) {
      await this.createNotification(
        userId,
        'Halfway Point!',
        `You're 50% towards your goal "${goal.name}". Great progress!`,
        'info',
        `/goals/${goal.id}`
      );
    } else if (progressPercentage >= 75 && progressPercentage < 100) {
      await this.createNotification(
        userId,
        'Almost There!',
        `You're 75% towards your goal "${goal.name}". The finish line is near!`,
        'info',
        `/goals/${goal.id}`
      );
    }
  }
  async sendGoalReminderNotification(userId: string, goal: Goal): Promise<void> {
    if (!goal.targetDate) return;

    const daysUntilTarget = Math.ceil(
      (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilTarget <= 7 && daysUntilTarget > 0) {
      await this.createNotification(
        userId,
        'Goal Deadline Approaching',
        `Your goal "${goal.name}" is due in ${daysUntilTarget} days. Time to push forward!`,
        'warning',
        `/goals/${goal.id}`
      );
    }
  }

  async sendGoalOverdueNotification(userId: string, goal: Goal): Promise<void> {
    await this.createNotification(
      userId,
      'Goal Overdue',
      `Your goal "${goal.name}" has passed its target date. Consider adjusting your timeline.`,
      'error',
      `/goals/${goal.id}`
    );
  }

  async sendBadgeEarnedNotification(userId: string, badgeName: string, badgeDescription: string): Promise<void> {
    await this.createNotification(
      userId,
      'Badge Earned! 🏆',
      `You've earned the "${badgeName}" badge: ${badgeDescription}`,
      'success',
      '/profile/badges'
    );
  }

  async sendLevelUpNotification(userId: string, newLevel: number, levelTitle: string): Promise<void> {
    await this.createNotification(
      userId,
      'Level Up! 🚀',
      `Congratulations! You've reached Level ${newLevel}: ${levelTitle}`,
      'success',
      '/profile'
    );
  }

  private async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error',
    actionUrl?: string
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        actionUrl,
      },
    });
  }
}