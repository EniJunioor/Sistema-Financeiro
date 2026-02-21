import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFiltersDto } from '../dto';
import { PaginatedTransactions, Transaction, TransactionStats } from '../interfaces/transaction.interface';
import { MLCategorizationService } from './ml-categorization.service';
import { DeduplicationService } from './deduplication.service';
import { AnomalyDetectionService } from '../../anomaly-detection/services/anomaly-detection.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private mlCategorizationService: MLCategorizationService,
    @Inject(forwardRef(() => DeduplicationService)) private deduplicationService: DeduplicationService,
    @Inject(forwardRef(() => AnomalyDetectionService)) private anomalyDetectionService: AnomalyDetectionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateTransactionDto, userId: string): Promise<Transaction> {
    // Auto-categorize if no category provided
    let categoryId = dto.categoryId;
    if (!categoryId && dto.description) {
      const suggestion = await this.mlCategorizationService.suggestCategory(
        dto.description,
        dto.amount,
        userId
      );
      if (suggestion) {
        categoryId = suggestion.categoryId;
      }
    }

    // Parse tags and attachments
    const tags = dto.tags ? JSON.stringify(dto.tags) : null;
    const attachments = dto.attachments ? JSON.stringify(dto.attachments) : null;

    // Handle recurring rule
    let recurringRuleString: string | null = null;
    if (dto.isRecurring && dto.recurringRule) {
      // Calculate next date if not provided
      if (!dto.recurringRule.nextDate) {
        const currentDate = new Date(dto.date);
        const nextDate = this.calculateNextRecurringDate(currentDate, dto.recurringRule);
        dto.recurringRule.nextDate = nextDate.toISOString();
      }
      recurringRuleString = JSON.stringify(dto.recurringRule);
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        accountId: dto.accountId,
        categoryId,
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        date: new Date(dto.date),
        location: dto.location,
        tags,
        isRecurring: dto.isRecurring || false,
        recurringRule: recurringRuleString,
        attachments,
        metadata: dto.metadata,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          }
        }
      }
    });

    // Run anomaly detection on the new transaction
    try {
      await this.anomalyDetectionService.analyzeTransaction(userId, {
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        date: dto.date,
        accountId: dto.accountId,
        categoryId,
        location: dto.location,
      });
    } catch (error) {
      // Log error but don't fail transaction creation
      console.warn('Anomaly detection failed for transaction:', error.message);
    }

    // Clear cache for user's transactions
    await this.clearUserCache(userId);

    return this.formatTransaction(transaction);
  }

  private calculateNextRecurringDate(currentDate: Date, rule: any): Date {
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

  async findAll(userId: string, filters: TransactionFiltersDto): Promise<PaginatedTransactions> {
    const cacheKey = `transactions:${userId}:${JSON.stringify(filters)}`;
    const cached = await this.cacheManager.get<PaginatedTransactions>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc', ...filterOptions } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      userId,
      ...(filterOptions.type && { type: filterOptions.type }),
      ...(filterOptions.categoryId && { categoryId: filterOptions.categoryId }),
      ...(filterOptions.accountId && { accountId: filterOptions.accountId }),
      ...(filterOptions.startDate && filterOptions.endDate && {
        date: {
          gte: new Date(filterOptions.startDate),
          lte: new Date(filterOptions.endDate),
        }
      }),
      ...(filterOptions.minAmount && filterOptions.maxAmount && {
        amount: {
          gte: filterOptions.minAmount,
          lte: filterOptions.maxAmount,
        }
      }),
      ...(filterOptions.search && {
        OR: [
          { description: { contains: filterOptions.search } },
          { location: { contains: filterOptions.search } },
        ]
      }),
      ...(filterOptions.tags && filterOptions.tags.length > 0 && {
        tags: {
          contains: JSON.stringify(filterOptions.tags[0]) // Simple tag search
        }
      }),
    };

    // Get total count
    const total = await this.prisma.transaction.count({ where });

    // Get transactions
    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const result: PaginatedTransactions = {
      data: transactions.map(this.formatTransaction),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      }
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          }
        }
      }
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return this.formatTransaction(transaction);
  }

  async update(id: string, dto: UpdateTransactionDto, userId: string): Promise<Transaction> {
    // Check if transaction exists and belongs to user
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Parse tags and attachments if provided
    const updateData: any = { ...dto };
    if (dto.tags) {
      updateData.tags = JSON.stringify(dto.tags);
    }
    if (dto.attachments) {
      updateData.attachments = JSON.stringify(dto.attachments);
    }
    if ('date' in dto && dto.date) {
      updateData.date = new Date((dto as { date?: string }).date);
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          }
        }
      }
    });

    // Clear cache for user's transactions
    await this.clearUserCache(userId);

    return this.formatTransaction(transaction);
  }

  async remove(id: string, userId: string): Promise<void> {
    // Check if transaction exists and belongs to user
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    await this.prisma.transaction.delete({
      where: { id }
    });

    // Clear cache for user's transactions
    await this.clearUserCache(userId);
  }

  async bulkCategorizeByIds(
    userId: string,
    transactionIds: string[],
    categoryId: string,
  ): Promise<{ updated: number }> {
    const result = await this.prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        userId,
      },
      data: { categoryId, updatedAt: new Date() },
    });
    await this.clearUserCache(userId);
    return { updated: result.count };
  }

  async bulkDelete(userId: string, transactionIds: string[]): Promise<{ deleted: number }> {
    const result = await this.prisma.transaction.deleteMany({
      where: {
        id: { in: transactionIds },
        userId,
      },
    });
    await this.clearUserCache(userId);
    return { deleted: result.count };
  }

  async getStats(userId: string, startDate?: string, endDate?: string): Promise<TransactionStats> {
    const cacheKey = `stats:${userId}:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await this.cacheManager.get<TransactionStats>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const where = {
      userId,
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      }),
    };

    // Get aggregated data
    const [incomeSum, expenseSum, transactionCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalIncome = Number(incomeSum._sum.amount || 0);
    const totalExpenses = Number(expenseSum._sum.amount || 0);
    const netAmount = totalIncome - totalExpenses;
    const averageTransaction = transactionCount > 0 ? (totalIncome + totalExpenses) / transactionCount : 0;

    // Get category breakdown
    const categoryBreakdown = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...where, categoryId: { not: null } },
      _sum: { amount: true },
      _count: { categoryId: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const categoryBreakdownWithNames = await Promise.all(
      categoryBreakdown.map(async (item) => {
        const category = await this.prisma.category.findUnique({
          where: { id: item.categoryId! }
        });
        const amount = Number(item._sum.amount || 0);
        return {
          categoryId: item.categoryId!,
          categoryName: category?.name || 'Unknown',
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          count: item._count.categoryId,
        };
      })
    );

    const stats: TransactionStats = {
      totalIncome,
      totalExpenses,
      netAmount,
      transactionCount,
      averageTransaction,
      categoryBreakdown: categoryBreakdownWithNames,
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, stats, 600);

    return stats;
  }

  async searchTransactions(userId: string, query: string, limit: number = 10): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        OR: [
          { description: { contains: query } },
          { location: { contains: query } },
        ]
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return transactions.map(this.formatTransaction);
  }

  private formatTransaction(transaction: any): Transaction {
    return {
      ...transaction,
      amount: Number(transaction.amount),
      tags: transaction.tags ? JSON.parse(transaction.tags) : [],
      attachments: transaction.attachments ? JSON.parse(transaction.attachments) : [],
    };
  }

  private async clearUserCache(userId: string): Promise<void> {
    // In a real implementation, you might want to use a more sophisticated cache invalidation strategy
    const keys = [`transactions:${userId}:*`, `stats:${userId}:*`];
    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }

  /**
   * Create transaction with duplicate detection
   */
  async createWithDuplicateDetection(
    dto: CreateTransactionDto, 
    userId: string,
    checkDuplicates: boolean = true
  ): Promise<{ transaction: Transaction; duplicates?: any[] }> {
    let duplicates: any[] = [];

    // Check for duplicates before creating if requested
    if (checkDuplicates) {
      // Create a temporary transaction object for duplicate detection
      const tempTransaction = {
        id: 'temp-' + Date.now(),
        userId,
        accountId: dto.accountId,
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        date: new Date(dto.date),
        location: dto.location,
        tags: dto.tags ? JSON.stringify(dto.tags) : null,
        attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
        createdAt: new Date(),
      };

      // Find potential duplicates using the deduplication service
      try {
        duplicates = await this.deduplicationService.findDuplicatesForTransaction(
          tempTransaction,
          userId
        );
      } catch (error) {
        // Log error but don't fail transaction creation
        console.warn('Duplicate detection failed:', error.message);
      }
    }

    // Create the transaction
    const transaction = await this.create(dto, userId);

    return {
      transaction,
      duplicates: duplicates.length > 0 ? duplicates : undefined
    };
  }
}