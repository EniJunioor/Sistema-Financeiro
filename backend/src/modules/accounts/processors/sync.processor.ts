import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OpenBankingService } from '../services/open-banking.service';
import { AccountsService } from '../services/accounts.service';

interface SyncJobData {
  userId: string;
  accountId: string;
  provider?: string;
  isScheduled: boolean;
  priority?: string;
}

@Processor('account-sync')
export class SyncProcessor {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private readonly openBankingService: OpenBankingService,
    private readonly accountsService: AccountsService,
  ) {}

  @Process('sync-account')
  async handleAccountSync(job: Job<SyncJobData>) {
    const { userId, accountId, isScheduled } = job.data;
    
    this.logger.log(
      `Processing ${isScheduled ? 'scheduled' : 'manual'} sync for account ${accountId} (user: ${userId})`,
    );

    try {
      // Update job progress
      await job.progress(10);

      // Verify account exists and is active
      const account = await this.accountsService.findOneByUser(userId, accountId);
      
      if (!account.isActive) {
        this.logger.warn(`Account ${accountId} is inactive, skipping sync`);
        return { success: false, reason: 'Account inactive' };
      }

      if (!account.provider || account.provider === 'manual') {
        this.logger.warn(`Account ${accountId} is manual, skipping sync`);
        return { success: false, reason: 'Manual account' };
      }

      await job.progress(25);

      // Perform the sync
      const syncResult = await this.openBankingService.syncAccount(userId, accountId, {
        forceFullSync: false,
      });

      await job.progress(75);

      // Log success
      this.logger.log(
        `Successfully synced account ${accountId}: ${syncResult.transactionCount} transactions`,
      );

      await job.progress(100);

      return {
        success: true,
        transactionCount: syncResult.transactionCount,
        lastSyncAt: syncResult.lastSyncAt,
      };

    } catch (error) {
      this.logger.error(
        `Failed to sync account ${accountId} for user ${userId}:`,
        error.stack,
      );

      // Determine if this is a retryable error
      const isRetryable = this.isRetryableError(error);
      
      if (!isRetryable) {
        // Mark account as having sync issues
        await this.markAccountSyncError(accountId, error.message);
      }

      throw error; // Re-throw to trigger Bull's retry mechanism
    }
  }

  private isRetryableError(error: any): boolean {
    // Define which errors should trigger retries
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'Rate limit exceeded',
      'Service temporarily unavailable',
      'Internal server error',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  private async markAccountSyncError(accountId: string, errorMessage: string) {
    try {
      // You could add an error field to the Account model or create a separate SyncError model
      // For now, we'll just log it
      this.logger.error(`Marking account ${accountId} with sync error: ${errorMessage}`);
      
      // TODO: Implement error tracking in database
      // await this.accountsService.updateSyncError(accountId, errorMessage);
    } catch (error) {
      this.logger.error('Failed to mark account sync error:', error.message);
    }
  }

  @Process('sync-all-accounts')
  async handleSyncAllAccounts(job: Job<{ userId: string }>) {
    const { userId } = job.data;
    
    this.logger.log(`Processing sync all accounts for user ${userId}`);

    try {
      await job.progress(10);

      const result = await this.openBankingService.syncAllUserAccounts(userId);

      await job.progress(100);

      this.logger.log(
        `Successfully queued sync for ${result.accountCount} accounts for user ${userId}`,
      );

      return result;

    } catch (error) {
      this.logger.error(
        `Failed to sync all accounts for user ${userId}:`,
        error.stack,
      );
      throw error;
    }
  }
}