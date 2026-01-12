import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto, GoalFiltersDto, GoalType } from '../dto';
import { Goal } from '../interfaces/goal.interface';
import { ProgressService } from './progress.service';
import { GamificationService } from './gamification.service';
import { NotificationService } from './notification.service';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly gamificationService: GamificationService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createGoalDto: CreateGoalDto, userId: string): Promise<Goal> {
    // Validate target date if provided
    if (createGoalDto.targetDate) {
      const targetDate = new Date(createGoalDto.targetDate);
      if (targetDate <= new Date()) {
        throw new BadRequestException('Target date must be in the future');
      }
    }

    // Validate category if provided
    if (createGoalDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createGoalDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const goal = await this.prisma.goal.create({
      data: {
        ...createGoalDto,
        userId,
        targetDate: createGoalDto.targetDate ? new Date(createGoalDto.targetDate) : null,
      },
    });

    // Award experience for creating a goal
    await this.gamificationService.awardExperience(userId, 'goal_created', goal.id);

    // Send notification
    await this.notificationService.sendGoalCreatedNotification(userId, goal as unknown as Goal);

    return goal as unknown as Goal;
  }

  async findAll(userId: string, filters?: GoalFiltersDto): Promise<Goal[]> {
    const where: any = { userId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const goals = await this.prisma.goal.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return goals as unknown as Goal[];
  }

  async findOne(id: string, userId: string): Promise<Goal> {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal as unknown as Goal;
  }

  async update(id: string, updateGoalDto: UpdateGoalDto, userId: string): Promise<Goal> {
    const existingGoal = await this.findOne(id, userId);

    // Validate target date if provided
    if (updateGoalDto.targetDate) {
      const targetDate = new Date(updateGoalDto.targetDate);
      if (targetDate <= new Date()) {
        throw new BadRequestException('Target date must be in the future');
      }
    }

    // Validate category if provided
    if (updateGoalDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateGoalDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const goal = await this.prisma.goal.update({
      where: { id },
      data: {
        ...updateGoalDto,
        targetDate: updateGoalDto.targetDate ? new Date(updateGoalDto.targetDate) : undefined,
      },
    });

    return goal as unknown as Goal;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId); // Ensure goal exists and belongs to user

    await this.prisma.goal.delete({
      where: { id },
    });
  }

  async updateProgress(goalId: string, userId: string): Promise<void> {
    const goal = await this.findOne(goalId, userId);
    
    let currentAmount = 0;

    switch (goal.type) {
      case GoalType.SAVINGS:
        currentAmount = await this.calculateSavingsProgress(userId, goal);
        break;
      case GoalType.SPENDING_LIMIT:
        currentAmount = await this.calculateSpendingProgress(userId, goal);
        break;
      case GoalType.INVESTMENT:
        currentAmount = await this.calculateInvestmentProgress(userId, goal);
        break;
      case GoalType.DEBT_PAYOFF:
        currentAmount = await this.calculateDebtPayoffProgress(userId, goal);
        break;
    }

    // Update goal progress
    await this.prisma.goal.update({
      where: { id: goalId },
      data: { currentAmount },
    });

    // Check for milestones and badges
    await this.gamificationService.checkMilestones(userId, goalId, currentAmount, Number(goal.targetAmount));

    // Check if goal is completed
    if (currentAmount >= Number(goal.targetAmount) && goal.isActive) {
      await this.completeGoal(goalId, userId);
    }

    // Send progress notifications
    const updatedGoal = { ...goal, currentAmount: currentAmount } as unknown as Goal;
    await this.notificationService.sendProgressNotification(userId, updatedGoal, currentAmount);
  }

  private async calculateSavingsProgress(userId: string, goal: Goal): Promise<number> {
    // Calculate total savings based on income - expenses
    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        date: { gte: goal.createdAt },
        ...(goal.categoryId && { categoryId: goal.categoryId }),
      },
      _sum: {
        amount: true,
      },
    });

    return Math.max(0, Number(result._sum.amount) || 0);
  }

  private async calculateSpendingProgress(userId: string, goal: Goal): Promise<number> {
    // Calculate spending in the current period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'expense',
        date: { gte: startOfMonth },
        ...(goal.categoryId && { categoryId: goal.categoryId }),
      },
      _sum: {
        amount: true,
      },
    });

    return Math.abs(Number(result._sum.amount) || 0);
  }

  private async calculateInvestmentProgress(userId: string, goal: Goal): Promise<number> {
    // Calculate total investment value
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    return investments.reduce((total, investment) => {
      const currentValue = Number(investment.quantity) * Number(investment.currentPrice || investment.averagePrice);
      return total + currentValue;
    }, 0);
  }

  private async calculateDebtPayoffProgress(userId: string, goal: Goal): Promise<number> {
    // Calculate debt payments made
    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'expense',
        date: { gte: goal.createdAt },
        description: { contains: 'debt' },
        ...(goal.categoryId && { categoryId: goal.categoryId }),
      },
      _sum: {
        amount: true,
      },
    });

    return Math.abs(Number(result._sum.amount) || 0);
  }

  private async completeGoal(goalId: string, userId: string): Promise<void> {
    await this.prisma.goal.update({
      where: { id: goalId },
      data: { isActive: false },
    });

    // Award completion experience and badges
    await this.gamificationService.awardExperience(userId, 'goal_completed', goalId);
    await this.gamificationService.checkCompletionBadges(userId, goalId);

    // Send completion notification
    const goal = await this.findOne(goalId, userId);
    await this.notificationService.sendGoalCompletedNotification(userId, goal);
  }

  async getGoalsByType(userId: string, type: GoalType): Promise<Goal[]> {
    return this.findAll(userId, { type });
  }

  async getActiveGoals(userId: string): Promise<Goal[]> {
    return this.findAll(userId, { isActive: true });
  }

  async getCompletedGoals(userId: string): Promise<Goal[]> {
    return this.findAll(userId, { isActive: false });
  }
}