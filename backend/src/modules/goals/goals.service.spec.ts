import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './services/goals.service';
import { ProgressService } from './services/progress.service';
import { GamificationService } from './services/gamification.service';
import { NotificationService } from './services/notification.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GoalType } from './dto/create-goal.dto';

describe('GoalsService', () => {
  let service: GoalsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    goal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    transaction: {
      aggregate: jest.fn(),
    },
    investment: {
      findMany: jest.fn(),
    },
  };

  const mockProgressService = {
    calculateGoalProgress: jest.fn(),
  };

  const mockGamificationService = {
    awardExperience: jest.fn(),
    checkMilestones: jest.fn(),
    checkCompletionBadges: jest.fn(),
  };

  const mockNotificationService = {
    sendGoalCreatedNotification: jest.fn(),
    sendGoalCompletedNotification: jest.fn(),
    sendProgressNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProgressService,
          useValue: mockProgressService,
        },
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a goal successfully', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const createGoalDto = {
        name: 'Test Goal',
        description: 'Test Description',
        type: GoalType.SAVINGS,
        targetAmount: 1000,
        targetDate: futureDate.toISOString(),
      };

      const mockGoal = {
        id: '1',
        userId: 'user1',
        ...createGoalDto,
        currentAmount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.goal.create.mockResolvedValue(mockGoal);

      const result = await service.create(createGoalDto, 'user1');

      expect(mockPrismaService.goal.create).toHaveBeenCalledWith({
        data: {
          ...createGoalDto,
          userId: 'user1',
          targetDate: new Date(createGoalDto.targetDate),
        },
      });

      expect(mockGamificationService.awardExperience).toHaveBeenCalledWith('user1', 'goal_created', mockGoal.id);
      expect(mockNotificationService.sendGoalCreatedNotification).toHaveBeenCalledWith('user1', expect.any(Object));
    });
  });
});