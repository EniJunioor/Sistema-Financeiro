import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GoalsController } from './controllers/goals.controller';
import { GoalsService } from './services/goals.service';
import { ProgressService } from './services/progress.service';
import { GamificationService } from './services/gamification.service';
import { NotificationService } from './services/notification.service';
import { GoalProgressProcessor } from './processors/goal-progress.processor';
import { GoalSchedulerService } from './services/goal-scheduler.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'goal-progress',
    }),
  ],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    ProgressService,
    GamificationService,
    NotificationService,
    GoalProgressProcessor,
    GoalSchedulerService,
  ],
  exports: [GoalsService, ProgressService, GamificationService],
})
export class GoalsModule {}