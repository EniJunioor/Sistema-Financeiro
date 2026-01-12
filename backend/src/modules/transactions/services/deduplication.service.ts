import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Transaction } from '../interfaces/transaction.interface';

export interface DuplicateMatch {
  id: string;
  originalTransaction: Transaction;
  duplicateTransaction: Transaction;
  confidence: number;
  matchingCriteria: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface DeduplicationResult {
  duplicatesFound: number;
  matches: DuplicateMatch[];
  autoMerged: number;
  pendingReview: number;
}

export interface DeduplicationSettings {
  userId: string;
  dateToleranceDays: number;
  amountTolerancePercent: number;
  descriptionSimilarityThreshold: number;
  autoMergeThreshold: number;
  enabledCriteria: {
    date?: boolean;
    amount?: boolean;
    description?: boolean;
    location?: boolean;
    account?: boolean;
  };
}

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Detect potential duplicates for a single transaction
   */
  async detectDuplicatesForTransaction(
    transactionId: string,
    userId: string,
    settings?: Partial<DeduplicationSettings>
  ): Promise<DuplicateMatch[]> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: {
        account: true,
        category: true,
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return this.findDuplicatesForTransaction(transaction, userId, settings);
  }

  /**
   * Detect duplicates for all transactions in a date range
   */
  async detectDuplicatesInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    settings?: Partial<DeduplicationSettings>
  ): Promise<DeduplicationResult> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: 'desc' }
    });

    const allMatches: DuplicateMatch[] = [];
    let autoMerged = 0;

    // Process transactions in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      for (const transaction of batch) {
        const matches = await this.findDuplicatesForTransaction(
          transaction,
          userId,
          settings,
          transactions.filter(t => t.id !== transaction.id)
        );

        // Filter out already processed matches
        const newMatches = matches.filter(match => 
          !allMatches.some(existing => 
            (existing.originalTransaction.id === match.originalTransaction.id && 
             existing.duplicateTransaction.id === match.duplicateTransaction.id) ||
            (existing.originalTransaction.id === match.duplicateTransaction.id && 
             existing.duplicateTransaction.id === match.originalTransaction.id)
          )
        );

        allMatches.push(...newMatches);

        // Auto-merge high confidence matches
        const highConfidenceMatches = newMatches.filter(match => 
          match.confidence >= (settings?.autoMergeThreshold || 0.9)
        );

        for (const match of highConfidenceMatches) {
          await this.autoMergeDuplicate(match);
          autoMerged++;
        }
      }
    }

    const pendingReview = allMatches.filter(match => 
      match.confidence < (settings?.autoMergeThreshold || 0.9)
    ).length;

    return {
      duplicatesFound: allMatches.length,
      matches: allMatches,
      autoMerged,
      pendingReview
    };
  }

  /**
   * Find duplicates for a specific transaction (public method)
   */
  async findDuplicatesForTransaction(
    transaction: any,
    userId: string,
    settings?: Partial<DeduplicationSettings>,
    candidateTransactions?: any[]
  ): Promise<DuplicateMatch[]> {
    const deduplicationSettings = await this.getDeduplicationSettings(userId, settings);
    
    // Get candidate transactions if not provided
    if (!candidateTransactions) {
      const dateRange = this.calculateDateRange(
        new Date(transaction.date),
        deduplicationSettings.dateToleranceDays
      );

      candidateTransactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          id: { not: transaction.id },
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          }
        },
        include: {
          account: true,
          category: true,
        }
      });
    }

    const matches: DuplicateMatch[] = [];

    for (const candidate of candidateTransactions) {
      if (candidate.id === transaction.id) continue;

      const matchResult = this.calculateSimilarity(
        transaction,
        candidate,
        deduplicationSettings
      );

      if (matchResult.confidence > 0.5) { // Minimum threshold
        matches.push({
          id: `${transaction.id}-${candidate.id}`,
          originalTransaction: this.formatTransaction(transaction),
          duplicateTransaction: this.formatTransaction(candidate),
          confidence: matchResult.confidence,
          matchingCriteria: matchResult.matchingCriteria,
          status: 'pending',
          createdAt: new Date()
        });
      }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate similarity between two transactions
   */
  private calculateSimilarity(
    transaction1: any,
    transaction2: any,
    settings: DeduplicationSettings
  ): { confidence: number; matchingCriteria: string[] } {
    const criteria: { name: string; weight: number; score: number }[] = [];
    const matchingCriteria: string[] = [];

    // Date similarity
    if (settings.enabledCriteria.date !== false) {
      const dateScore = this.calculateDateSimilarity(
        new Date(transaction1.date),
        new Date(transaction2.date),
        settings.dateToleranceDays
      );
      criteria.push({ name: 'date', weight: 0.25, score: dateScore });
      if (dateScore > 0.8) matchingCriteria.push('date');
    }

    // Amount similarity
    if (settings.enabledCriteria.amount !== false) {
      const amountScore = this.calculateAmountSimilarity(
        Number(transaction1.amount),
        Number(transaction2.amount),
        settings.amountTolerancePercent
      );
      criteria.push({ name: 'amount', weight: 0.3, score: amountScore });
      if (amountScore > 0.9) matchingCriteria.push('amount');
    }

    // Description similarity
    if (settings.enabledCriteria.description !== false) {
      const descriptionScore = this.calculateDescriptionSimilarity(
        transaction1.description,
        transaction2.description,
        settings.descriptionSimilarityThreshold
      );
      criteria.push({ name: 'description', weight: 0.25, score: descriptionScore });
      if (descriptionScore > settings.descriptionSimilarityThreshold) {
        matchingCriteria.push('description');
      }
    }

    // Location similarity
    if (settings.enabledCriteria.location !== false && transaction1.location && transaction2.location) {
      const locationScore = this.calculateLocationSimilarity(
        transaction1.location,
        transaction2.location
      );
      criteria.push({ name: 'location', weight: 0.1, score: locationScore });
      if (locationScore > 0.8) matchingCriteria.push('location');
    }

    // Account similarity
    if (settings.enabledCriteria.account !== false) {
      const accountScore = transaction1.accountId === transaction2.accountId ? 1.0 : 0.0;
      criteria.push({ name: 'account', weight: 0.1, score: accountScore });
      if (accountScore === 1.0) matchingCriteria.push('account');
    }

    // Calculate weighted confidence score
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore = criteria.reduce((sum, c) => sum + (c.score * c.weight), 0);
    const confidence = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return { confidence, matchingCriteria };
  }

  /**
   * Calculate date similarity (1.0 = same date, decreases with distance)
   */
  private calculateDateSimilarity(date1: Date, date2: Date, toleranceDays: number): number {
    const diffDays = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 0) return 1.0;
    if (diffDays > toleranceDays) return 0.0;
    
    return Math.max(0, 1 - (diffDays / toleranceDays));
  }

  /**
   * Calculate amount similarity (1.0 = exact match, decreases with percentage difference)
   */
  private calculateAmountSimilarity(amount1: number, amount2: number, tolerancePercent: number): number {
    if (amount1 === amount2) return 1.0;
    
    const percentDiff = Math.abs(amount1 - amount2) / Math.max(amount1, amount2) * 100;
    
    if (percentDiff > tolerancePercent) return 0.0;
    
    return Math.max(0, 1 - (percentDiff / tolerancePercent));
  }

  /**
   * Calculate description similarity using Levenshtein distance
   */
  private calculateDescriptionSimilarity(desc1: string, desc2: string, threshold: number): number {
    if (!desc1 || !desc2) return 0.0;
    
    const similarity = this.calculateLevenshteinSimilarity(
      desc1.toLowerCase().trim(),
      desc2.toLowerCase().trim()
    );
    
    return similarity >= threshold ? similarity : 0.0;
  }

  /**
   * Calculate location similarity
   */
  private calculateLocationSimilarity(loc1: string, loc2: string): number {
    if (!loc1 || !loc2) return 0.0;
    
    return this.calculateLevenshteinSimilarity(
      loc1.toLowerCase().trim(),
      loc2.toLowerCase().trim()
    );
  }

  /**
   * Calculate Levenshtein similarity (0.0 to 1.0)
   */
  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1.0;
    
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Auto-merge a duplicate transaction
   */
  private async autoMergeDuplicate(match: DuplicateMatch): Promise<void> {
    try {
      // Keep the older transaction (by creation date) and delete the newer one
      const keepTransaction = match.originalTransaction.createdAt <= match.duplicateTransaction.createdAt
        ? match.originalTransaction
        : match.duplicateTransaction;
      
      const deleteTransaction = keepTransaction.id === match.originalTransaction.id
        ? match.duplicateTransaction
        : match.originalTransaction;

      // Log the merge action
      this.logger.log(`Auto-merging duplicate transactions: keeping ${keepTransaction.id}, deleting ${deleteTransaction.id}`);

      // Delete the duplicate transaction
      await this.prisma.transaction.delete({
        where: { id: deleteTransaction.id }
      });

      // Store merge history for learning
      await this.storeMergeHistory(match, 'auto_merged');

    } catch (error) {
      this.logger.error(`Failed to auto-merge duplicate: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Manually approve a duplicate merge
   */
  async approveDuplicateMerge(
    matchId: string,
    userId: string,
    keepTransactionId: string
  ): Promise<void> {
    // Parse match ID to get transaction IDs
    const [originalId, duplicateId] = matchId.split('-');
    
    const deleteTransactionId = keepTransactionId === originalId ? duplicateId : originalId;

    // Verify both transactions belong to the user
    const transactions = await this.prisma.transaction.findMany({
      where: {
        id: { in: [originalId, duplicateId] },
        userId
      }
    });

    if (transactions.length !== 2) {
      throw new Error('Invalid transaction IDs or unauthorized access');
    }

    // Delete the unwanted transaction
    await this.prisma.transaction.delete({
      where: { id: deleteTransactionId }
    });

    // Store merge history for learning
    const match: DuplicateMatch = {
      id: matchId,
      originalTransaction: transactions.find(t => t.id === originalId) as any,
      duplicateTransaction: transactions.find(t => t.id === duplicateId) as any,
      confidence: 1.0, // User approved
      matchingCriteria: [],
      status: 'approved',
      createdAt: new Date()
    };

    await this.storeMergeHistory(match, 'user_approved');

    this.logger.log(`User ${userId} approved duplicate merge: kept ${keepTransactionId}, deleted ${deleteTransactionId}`);
  }

  /**
   * Reject a duplicate match
   */
  async rejectDuplicateMatch(matchId: string, userId: string): Promise<void> {
    // Parse match ID to get transaction IDs
    const [originalId, duplicateId] = matchId.split('-');

    // Verify both transactions belong to the user
    const transactions = await this.prisma.transaction.findMany({
      where: {
        id: { in: [originalId, duplicateId] },
        userId
      }
    });

    if (transactions.length !== 2) {
      throw new Error('Invalid transaction IDs or unauthorized access');
    }

    // Store rejection for learning
    const match: DuplicateMatch = {
      id: matchId,
      originalTransaction: transactions.find(t => t.id === originalId) as any,
      duplicateTransaction: transactions.find(t => t.id === duplicateId) as any,
      confidence: 0.0, // User rejected
      matchingCriteria: [],
      status: 'rejected',
      createdAt: new Date()
    };

    await this.storeMergeHistory(match, 'user_rejected');

    this.logger.log(`User ${userId} rejected duplicate match: ${matchId}`);
  }

  /**
   * Get deduplication settings for a user
   */
  private async getDeduplicationSettings(
    userId: string,
    overrides?: Partial<DeduplicationSettings>
  ): Promise<DeduplicationSettings> {
    // Default settings - in a real implementation, these could be stored in the database
    const defaultSettings: DeduplicationSettings = {
      userId,
      dateToleranceDays: 3,
      amountTolerancePercent: 1.0,
      descriptionSimilarityThreshold: 0.8,
      autoMergeThreshold: 0.95,
      enabledCriteria: {
        date: true,
        amount: true,
        description: true,
        location: true,
        account: true,
      }
    };

    // Apply user-specific settings from database if they exist
    // TODO: Implement user settings storage and retrieval

    // Apply any overrides and merge enabledCriteria properly
    const mergedSettings = { ...defaultSettings, ...overrides };
    if (overrides?.enabledCriteria) {
      mergedSettings.enabledCriteria = {
        ...defaultSettings.enabledCriteria,
        ...overrides.enabledCriteria
      };
    }

    return mergedSettings;
  }

  /**
   * Store merge history for machine learning
   */
  private async storeMergeHistory(match: DuplicateMatch, action: string): Promise<void> {
    // In a real implementation, this would store the merge history in a dedicated table
    // for machine learning to improve future duplicate detection
    
    this.logger.debug(`Storing merge history: ${action} for match ${match.id} with confidence ${match.confidence}`);
    
    // TODO: Implement merge history storage for ML learning
    // This could include:
    // - User decision (approved/rejected)
    // - Match confidence and criteria
    // - Transaction characteristics
    // - User patterns over time
  }

  /**
   * Calculate date range for duplicate search
   */
  private calculateDateRange(centerDate: Date, toleranceDays: number): { start: Date; end: Date } {
    const start = new Date(centerDate);
    start.setDate(start.getDate() - toleranceDays);
    
    const end = new Date(centerDate);
    end.setDate(end.getDate() + toleranceDays);
    
    return { start, end };
  }

  /**
   * Format transaction for API response
   */
  private formatTransaction(transaction: any): Transaction {
    return {
      ...transaction,
      amount: Number(transaction.amount),
      tags: transaction.tags ? JSON.parse(transaction.tags) : [],
      attachments: transaction.attachments ? JSON.parse(transaction.attachments) : [],
    };
  }
}