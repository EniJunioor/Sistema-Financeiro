import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RecurringTransactionsService } from '../services/recurring-transactions.service';

@Processor('transactions')
export class RecurringTransactionsProcessor {
  private readonly logger = new Logger(RecurringTransactionsProcessor.name);

  constructor(
    private recurringTransactionsService: RecurringTransactionsService,
  ) {}

  @Process('process-recurring')
  async processRecurringTransactions(job: Job): Promise<void> {
    this.logger.log('Starting recurring transactions processing job');
    
    try {
      const result = await this.recurringTransactionsService.processAllDueRecurringTransactions();
      
      this.logger.log(`Recurring transactions job completed: ${result.processed} processed, ${result.failed} failed`);
      
      // Update job progress
      await job.progress(100);
      
      return Promise.resolve();
    } catch (error) {
      this.logger.error('Recurring transactions job failed:', error);
      throw error;
    }
  }

  @Process('process-single-recurring')
  async processSingleRecurringTransaction(job: Job<{ transactionId: string }>): Promise<void> {
    const { transactionId } = job.data;
    
    this.logger.log(`Processing single recurring transaction: ${transactionId}`);
    
    try {
      const dueTransactions = await this.recurringTransactionsService.getDueRecurringTransactions();
      const targetTransaction = dueTransactions.find(t => t.id === transactionId);
      
      if (!targetTransaction) {
        this.logger.warn(`Recurring transaction ${transactionId} not found or not due`);
        return;
      }
      
      await this.recurringTransactionsService.processRecurringTransaction(targetTransaction);
      
      this.logger.log(`Successfully processed recurring transaction: ${transactionId}`);
      
      await job.progress(100);
    } catch (error) {
      this.logger.error(`Failed to process recurring transaction ${transactionId}:`, error);
      throw error;
    }
  }
}