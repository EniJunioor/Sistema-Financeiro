import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateTransactionDto, RecurringRuleDto } from '../dto';
import { TransactionsService } from './transactions.service';

export interface RecurringTransaction {
  id: string;
  userId: string;
  accountId?: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  location?: string;
  tags: string[];
  recurringRule: RecurringRuleDto;
  attachments: string[];
  metadata?: Record<string, any>;
  nextDate: Date;
  isActive: boolean;
}

@Injectable()
export class RecurringTransactionsService {
  private readonly logger = new Logger(RecurringTransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  /**
   * Calculate the next occurrence date based on recurring rule
   */
  calculateNextDate(currentDate: Date, rule: RecurringRuleDto): Date {
    const nextDate = new Date(currentDate);

    switch (rule.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + rule.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (rule.interval * 7));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + rule.interval);
        break;
    }

    return nextDate;
  }

  /**
   * Check if a recurring transaction should still be processed
   */
  shouldProcessRecurring(rule: RecurringRuleDto, nextDate: Date): boolean {
    if (!rule.endDate) {
      return true; // No end date, continue indefinitely
    }

    const endDate = new Date(rule.endDate);
    return nextDate <= endDate;
  }

  /**
   * Get all recurring transactions that are due for processing
   */
  async getDueRecurringTransactions(): Promise<RecurringTransaction[]> {
    const now = new Date();
    
    const transactions = await this.prisma.transaction.findMany({
      where: {
        isRecurring: true,
        recurringRule: { not: null },
        parentTransactionId: null, // Only get parent recurring transactions
      },
      include: {
        user: true,
        account: true,
        category: true,
      }
    });

    const dueTransactions: RecurringTransaction[] = [];

    for (const transaction of transactions) {
      if (!transaction.recurringRule) continue;

      try {
        const rule: RecurringRuleDto = JSON.parse(transaction.recurringRule);
        const nextDate = rule.nextDate ? new Date(rule.nextDate) : this.calculateNextDate(transaction.date, rule);

        // Check if it's due and should still be processed
        if (nextDate <= now && this.shouldProcessRecurring(rule, nextDate)) {
          dueTransactions.push({
            id: transaction.id,
            userId: transaction.userId,
            accountId: transaction.accountId,
            categoryId: transaction.categoryId,
            type: transaction.type as 'income' | 'expense' | 'transfer',
            amount: Number(transaction.amount),
            description: transaction.description,
            location: transaction.location,
            tags: transaction.tags ? JSON.parse(transaction.tags) : [],
            recurringRule: rule,
            attachments: transaction.attachments ? JSON.parse(transaction.attachments) : [],
            metadata: transaction.metadata ? JSON.parse(transaction.metadata) : undefined,
            nextDate,
            isActive: true,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to parse recurring rule for transaction ${transaction.id}:`, error);
      }
    }

    return dueTransactions;
  }

  /**
   * Process a single recurring transaction
   */
  async processRecurringTransaction(recurringTransaction: RecurringTransaction): Promise<void> {
    try {
      // Create the new transaction instance
      const createDto: CreateTransactionDto = {
        type: recurringTransaction.type,
        amount: recurringTransaction.amount,
        description: recurringTransaction.description,
        date: recurringTransaction.nextDate.toISOString(),
        accountId: recurringTransaction.accountId,
        categoryId: recurringTransaction.categoryId,
        tags: recurringTransaction.tags,
        location: recurringTransaction.location,
        isRecurring: false, // Child transactions are not recurring themselves
        attachments: recurringTransaction.attachments,
        metadata: JSON.stringify({
          ...recurringTransaction.metadata,
          generatedFrom: recurringTransaction.id,
          generatedAt: new Date().toISOString(),
        }),
      };

      // Create the transaction
      await this.transactionsService.create(createDto, recurringTransaction.userId);

      // Update the parent transaction with the next scheduled date
      const nextScheduledDate = this.calculateNextDate(
        recurringTransaction.nextDate,
        recurringTransaction.recurringRule
      );

      const updatedRule = {
        ...recurringTransaction.recurringRule,
        nextDate: nextScheduledDate.toISOString(),
      };

      await this.prisma.transaction.update({
        where: { id: recurringTransaction.id },
        data: {
          recurringRule: JSON.stringify(updatedRule),
        },
      });

      this.logger.log(`Processed recurring transaction ${recurringTransaction.id}, next scheduled: ${nextScheduledDate}`);
    } catch (error) {
      this.logger.error(`Failed to process recurring transaction ${recurringTransaction.id}:`, error);
      throw error;
    }
  }

  /**
   * Process all due recurring transactions
   */
  async processAllDueRecurringTransactions(): Promise<{ processed: number; failed: number }> {
    const dueTransactions = await this.getDueRecurringTransactions();
    let processed = 0;
    let failed = 0;

    this.logger.log(`Found ${dueTransactions.length} due recurring transactions`);

    for (const transaction of dueTransactions) {
      try {
        await this.processRecurringTransaction(transaction);
        processed++;
      } catch (error) {
        failed++;
        this.logger.error(`Failed to process recurring transaction ${transaction.id}:`, error);
      }
    }

    this.logger.log(`Processed ${processed} recurring transactions, ${failed} failed`);
    return { processed, failed };
  }

  /**
   * Get all recurring transactions for a user
   */
  async getUserRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        isRecurring: true,
        parentTransactionId: null, // Only parent recurring transactions
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions
      .filter(t => t.recurringRule)
      .map(transaction => {
        const rule: RecurringRuleDto = JSON.parse(transaction.recurringRule!);
        const nextDate = rule.nextDate ? new Date(rule.nextDate) : this.calculateNextDate(transaction.date, rule);

        return {
          id: transaction.id,
          userId: transaction.userId,
          accountId: transaction.accountId,
          categoryId: transaction.categoryId,
          type: transaction.type as 'income' | 'expense' | 'transfer',
          amount: Number(transaction.amount),
          description: transaction.description,
          location: transaction.location,
          tags: transaction.tags ? JSON.parse(transaction.tags) : [],
          recurringRule: rule,
          attachments: transaction.attachments ? JSON.parse(transaction.attachments) : [],
          metadata: transaction.metadata ? JSON.parse(transaction.metadata) : undefined,
          nextDate,
          isActive: this.shouldProcessRecurring(rule, nextDate),
        };
      });
  }

  /**
   * Cancel a recurring transaction
   */
  async cancelRecurringTransaction(transactionId: string, userId: string): Promise<void> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        isRecurring: true,
      },
    });

    if (!transaction) {
      throw new Error('Recurring transaction not found');
    }

    // Update to mark as non-recurring (effectively canceling future occurrences)
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { isRecurring: false },
    });

    this.logger.log(`Canceled recurring transaction ${transactionId}`);
  }

  /**
   * Update a recurring transaction
   */
  async updateRecurringTransaction(
    transactionId: string,
    userId: string,
    updates: Partial<CreateTransactionDto>
  ): Promise<void> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        isRecurring: true,
      },
    });

    if (!transaction) {
      throw new Error('Recurring transaction not found');
    }

    const updateData: any = {};

    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.accountId !== undefined) updateData.accountId = updates.accountId;
    if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.tags !== undefined) updateData.tags = JSON.stringify(updates.tags);
    if (updates.attachments !== undefined) updateData.attachments = JSON.stringify(updates.attachments);
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
    if (updates.recurringRule !== undefined) {
      updateData.recurringRule = JSON.stringify(updates.recurringRule);
    }

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
    });

    this.logger.log(`Updated recurring transaction ${transactionId}`);
  }
}