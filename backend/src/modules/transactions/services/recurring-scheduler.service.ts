import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringTransactionsService } from './recurring-transactions.service';

@Injectable()
export class RecurringSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(RecurringSchedulerService.name);

  constructor(
    @InjectQueue('transactions') private transactionsQueue: Queue,
    private recurringTransactionsService: RecurringTransactionsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Recurring Scheduler Service initialized');
    
    // Schedule initial processing on startup (after a delay)
    setTimeout(() => {
      this.scheduleRecurringTransactionsJob();
    }, 10000); // 10 seconds delay
  }

  /**
   * Cron job that runs every hour to process recurring transactions
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleRecurringTransactionsJob(): Promise<void> {
    this.logger.log('Scheduling recurring transactions processing job');
    
    try {
      await this.transactionsQueue.add(
        'process-recurring',
        {},
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 5,
        }
      );
      
      this.logger.log('Recurring transactions job scheduled successfully');
    } catch (error) {
      this.logger.error('Failed to schedule recurring transactions job:', error);
    }
  }

  /**
   * Schedule processing of a specific recurring transaction
   */
  async scheduleSpecificRecurringTransaction(transactionId: string, delay: number = 0): Promise<void> {
    this.logger.log(`Scheduling specific recurring transaction: ${transactionId}`);
    
    try {
      await this.transactionsQueue.add(
        'process-single-recurring',
        { transactionId },
        {
          delay,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 5,
          removeOnFail: 3,
        }
      );
      
      this.logger.log(`Specific recurring transaction ${transactionId} scheduled successfully`);
    } catch (error) {
      this.logger.error(`Failed to schedule recurring transaction ${transactionId}:`, error);
    }
  }

  /**
   * Manual trigger for processing all recurring transactions
   */
  async triggerRecurringTransactionsProcessing(): Promise<void> {
    this.logger.log('Manually triggering recurring transactions processing');
    await this.scheduleRecurringTransactionsJob();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.transactionsQueue.getWaiting(),
      this.transactionsQueue.getActive(),
      this.transactionsQueue.getCompleted(),
      this.transactionsQueue.getFailed(),
      this.transactionsQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Clean up old jobs
   */
  async cleanupJobs(): Promise<void> {
    this.logger.log('Cleaning up old jobs');
    
    try {
      await this.transactionsQueue.clean(24 * 60 * 60 * 1000, 'completed'); // Remove completed jobs older than 24 hours
      await this.transactionsQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Remove failed jobs older than 7 days
      
      this.logger.log('Job cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup jobs:', error);
    }
  }

  /**
   * Daily cleanup job
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyCleanup(): Promise<void> {
    await this.cleanupJobs();
  }
}