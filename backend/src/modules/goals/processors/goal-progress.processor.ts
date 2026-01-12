import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { GoalsService } from '../services/goals.service';
import { NotificationService } from '../services/notification.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
@Processor('goal-progress')
export class GoalProgressProcessor {
  private readonly logger = new Logger(GoalProgressProcessor.name);

  constructor(
    private readonly goalsService: GoalsService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('update-all-goals')
  async updateAllGoalsProgress(job: Job) {
    this.logger.log('Starting automatic goal progress update');

    try {
      // Get all active goals
      const activeGoals = await this.prisma.goal.findMany({
        where: { isActive: true },
        include: { user: true },
      });

      let updatedCount = 0;

      for (const goal of activeGoals) {
        try {
          await this.goalsService.updateProgress(goal.id, goal.userId);
          updatedCount++;
        } catch (error) {
          this.logger.error(`Failed to update progress for goal ${goal.id}:`, error);
        }
      }

      this.logger.log(`Updated progress for ${updatedCount} goals`);
      return { updatedCount, totalGoals: activeGoals.length };
    } catch (error) {
      this.logger.error('Failed to update goal progress:', error);
      throw error;
    }
  }

  @Process('check-goal-deadlines')
  async checkGoalDeadlines(job: Job) {
    this.logger.log('Checking goal deadlines for reminders');

    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find goals approaching deadline (within 7 days)
      const approachingGoals = await this.prisma.goal.findMany({
        where: {
          isActive: true,
          targetDate: {
            gte: now,
            lte: oneWeekFromNow,
          },
        },
      });

      // Find overdue goals
      const overdueGoals = await this.prisma.goal.findMany({
        where: {
          isActive: true,
          targetDate: {
            lt: now,
          },
        },
      });

      // Send reminder notifications
      for (const goal of approachingGoals) {
        await this.notificationService.sendGoalReminderNotification(goal.userId, goal as any);
      }

      // Send overdue notifications
      for (const goal of overdueGoals) {
        await this.notificationService.sendGoalOverdueNotification(goal.userId, goal as any);
      }

      this.logger.log(`Sent ${approachingGoals.length} reminder and ${overdueGoals.length} overdue notifications`);
      return { reminders: approachingGoals.length, overdue: overdueGoals.length };
    } catch (error) {
      this.logger.error('Failed to check goal deadlines:', error);
      throw error;
    }
  }
}