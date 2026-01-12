import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class GoalSchedulerService {
  private readonly logger = new Logger(GoalSchedulerService.name);

  constructor(
    @InjectQueue('goal-progress') private goalProgressQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleGoalProgressUpdate() {
    this.logger.log('Scheduling goal progress update');
    
    await this.goalProgressQueue.add('update-all-goals', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async scheduleGoalDeadlineCheck() {
    this.logger.log('Scheduling goal deadline check');
    
    await this.goalProgressQueue.add('check-goal-deadlines', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async manualProgressUpdate(): Promise<void> {
    this.logger.log('Manual goal progress update triggered');
    
    await this.goalProgressQueue.add('update-all-goals', {}, {
      priority: 10, // Higher priority for manual updates
    });
  }
}