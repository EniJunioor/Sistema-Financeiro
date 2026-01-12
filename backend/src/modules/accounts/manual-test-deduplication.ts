/**
 * Manual Test Script for Transaction Deduplication
 * 
 * This script demonstrates the deduplication logic that would be used
 * when importing transactions from Open Banking providers.
 */

interface Transaction {
  id?: string;
  amount: number;
  description: string;
  date: Date;
  accountId: string;
  providerTransactionId?: string;
}

class DeduplicationService {
  /**
   * Detects potential duplicate transactions based on multiple criteria
   */
  static detectDuplicates(
    newTransaction: Transaction,
    existingTransactions: Transaction[]
  ): Transaction[] {
    const duplicates: Transaction[] = [];
    const tolerance = 0.01; // $0.01 tolerance for amount matching
    const timeTolerance = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    for (const existing of existingTransactions) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Exact amount match (high weight)
      if (Math.abs(newTransaction.amount - existing.amount) <= tolerance) {
        score += 40;
        reasons.push('exact_amount');
      }

      // 2. Date proximity (within 24 hours)
      const timeDiff = Math.abs(newTransaction.date.getTime() - existing.date.getTime());
      if (timeDiff <= timeTolerance) {
        score += 30;
        reasons.push('date_proximity');
      }

      // 3. Description similarity
      const similarity = this.calculateStringSimilarity(
        newTransaction.description.toLowerCase(),
        existing.description.toLowerCase()
      );
      if (similarity > 0.8) {
        score += 20;
        reasons.push('description_similarity');
      }

      // 4. Same account
      if (newTransaction.accountId === existing.accountId) {
        score += 10;
        reasons.push('same_account');
      }

      // 5. Provider transaction ID match (if available)
      if (newTransaction.providerTransactionId && 
          existing.providerTransactionId &&
          newTransaction.providerTransactionId === existing.providerTransactionId) {
        score += 50;
        reasons.push('provider_id_match');
      }

      // Consider it a duplicate if score is high enough
      if (score >= 70) {
        duplicates.push({
          ...existing,
          metadata: { score, reasons }
        } as any);
      }
    }

    return duplicates;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }
}

// Test the deduplication logic
function testDeduplication() {
  console.log('🔍 Testing Transaction Deduplication Logic\n');

  const existingTransactions: Transaction[] = [
    {
      id: '1',
      amount: 25.50,
      description: 'STARBUCKS COFFEE #1234',
      date: new Date('2024-01-15T10:30:00Z'),
      accountId: 'account-1',
      providerTransactionId: 'plaid-txn-123'
    },
    {
      id: '2',
      amount: 1200.00,
      description: 'SALARY DEPOSIT - COMPANY ABC',
      date: new Date('2024-01-15T09:00:00Z'),
      accountId: 'account-1'
    },
    {
      id: '3',
      amount: 45.75,
      description: 'GROCERY STORE PURCHASE',
      date: new Date('2024-01-14T18:45:00Z'),
      accountId: 'account-2'
    }
  ];

  // Test Case 1: Exact duplicate (same provider transaction ID)
  console.log('Test Case 1: Exact Duplicate Detection');
  const exactDuplicate: Transaction = {
    amount: 25.50,
    description: 'STARBUCKS COFFEE #1234',
    date: new Date('2024-01-15T10:30:00Z'),
    accountId: 'account-1',
    providerTransactionId: 'plaid-txn-123'
  };

  const duplicates1 = DeduplicationService.detectDuplicates(exactDuplicate, existingTransactions);
  console.log(`Found ${duplicates1.length} duplicates:`, duplicates1.map(d => (d as any).metadata));
  console.log('✅ Expected: 1 duplicate with high score\n');

  // Test Case 2: Similar transaction (different description, same amount/date)
  console.log('Test Case 2: Similar Transaction Detection');
  const similarTransaction: Transaction = {
    amount: 25.50,
    description: 'Starbucks Coffee Store',
    date: new Date('2024-01-15T10:35:00Z'), // 5 minutes later
    accountId: 'account-1'
  };

  const duplicates2 = DeduplicationService.detectDuplicates(similarTransaction, existingTransactions);
  console.log(`Found ${duplicates2.length} duplicates:`, duplicates2.map(d => (d as any).metadata));
  console.log('✅ Expected: 1 duplicate with moderate score\n');

  // Test Case 3: Different transaction (should not be flagged)
  console.log('Test Case 3: Different Transaction (No Duplicates)');
  const differentTransaction: Transaction = {
    amount: 15.99,
    description: 'AMAZON PURCHASE',
    date: new Date('2024-01-16T14:20:00Z'),
    accountId: 'account-1'
  };

  const duplicates3 = DeduplicationService.detectDuplicates(differentTransaction, existingTransactions);
  console.log(`Found ${duplicates3.length} duplicates:`, duplicates3.map(d => (d as any).metadata));
  console.log('✅ Expected: 0 duplicates\n');

  // Test Case 4: Cross-account duplicate (manual entry vs imported)
  console.log('Test Case 4: Cross-Account Duplicate Detection');
  const crossAccountDuplicate: Transaction = {
    amount: 45.75,
    description: 'Grocery Store Purchase',
    date: new Date('2024-01-14T19:00:00Z'), // 15 minutes later
    accountId: 'account-1' // Different account
  };

  const duplicates4 = DeduplicationService.detectDuplicates(crossAccountDuplicate, existingTransactions);
  console.log(`Found ${duplicates4.length} duplicates:`, duplicates4.map(d => (d as any).metadata));
  console.log('✅ Expected: 1 duplicate with moderate score (different account penalty)\n');

  console.log('🎉 Deduplication testing completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDeduplication();
}

export { DeduplicationService, testDeduplication };