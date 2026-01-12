import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AccountsService } from './accounts.service';
import { OpenBankingService } from './open-banking.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly accountsService: AccountsService,
    private readonly openBankingService: OpenBankingService,
    @InjectQueue('account-sync') private readonly syncQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_2_HOURS)
  async scheduleAccountSync() {
    this.logger.log('Starting scheduled account synchronization');

    try {
      const activeAccounts = await this.accountsService.getActiveAccountsForSync();
      
      this.logger.log(`Found ${activeAccounts.length} accounts to sync`);

      // Add sync jobs to queue with staggered delays to avoid rate limits
      for (let i = 0; i < activeAccounts.length; i++) {
        const account = activeAccounts[i];
        const delay = i * 5000; // 5 second delay between each sync

        await this.syncQueue.add(
          'sync-account',
          {
            userId: account.userId,
            accountId: account.id,
            provider: account.provider,
            isScheduled: true,
          },
          {
            delay,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 10000, // Start with 10 second delay
            },
            removeOnComplete: 10, // Keep last 10 completed jobs
            removeOnFail: 50, // Keep last 50 failed jobs for debugging
          },
        );
      }

      this.logger.log(`Queued ${activeAccounts.length} sync jobs`);
    } catch (error) {
      this.logger.error('Failed to schedule account sync:', error.stack);
    }
  }

  async syncAccountManually(userId: string, accountId: string) {
    this.logger.log(`Manual sync requested for account ${accountId} by user ${userId}`);

    return this.syncQueue.add(
      'sync-account',
      {
        userId,
        accountId,
        isScheduled: false,
        priority: 'high',
      },
      {
        priority: 1, // High priority for manual syncs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
  }

  async syncAllUserAccounts(userId: string) {
    this.logger.log(`Syncing all accounts for user ${userId}`);

    const userAccounts = await this.accountsService.findAllByUser(userId, {
      isActive: true,
    });

    const syncPromises = userAccounts.accounts
      .filter(account => account.provider && account.provider !== 'manual')
      .map((account, index) =>
        this.syncQueue.add(
          'sync-account',
          {
            userId,
            accountId: account.id,
            provider: account.provider,
            isScheduled: false,
          },
          {
            delay: index * 2000, // 2 second delay between syncs
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        ),
      );

    await Promise.all(syncPromises);

    return {
      success: true,
      accountCount: syncPromises.length,
      message: `Queued sync for ${syncPromises.length} accounts`,
    };
  }

  async getSyncStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.syncQueue.getWaiting(),
      this.syncQueue.getActive(),
      this.syncQueue.getCompleted(),
      this.syncQueue.getFailed(),
    ]);

    return {
      queue: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      },
      jobs: {
        waiting: waiting.slice(0, 10).map(job => ({
          id: job.id,
          data: job.data,
          createdAt: new Date(job.timestamp),
        })),
        active: active.slice(0, 10).map(job => ({
          id: job.id,
          data: job.data,
          progress: job.progress(),
          createdAt: new Date(job.timestamp),
        })),
        failed: failed.slice(0, 10).map(job => ({
          id: job.id,
          data: job.data,
          error: job.failedReason,
          createdAt: new Date(job.timestamp),
        })),
      },
    };
  }

  async retryFailedSyncs() {
    const failedJobs = await this.syncQueue.getFailed();
    
    this.logger.log(`Retrying ${failedJobs.length} failed sync jobs`);

    for (const job of failedJobs) {
      await job.retry();
    }

    return {
      success: true,
      retriedCount: failedJobs.length,
    };
  }

  async clearSyncQueue() {
    await this.syncQueue.clean(0, 'completed');
    await this.syncQueue.clean(0, 'failed');
    
    this.logger.log('Cleared sync queue');

    return {
      success: true,
      message: 'Sync queue cleared',
    };
  }
}