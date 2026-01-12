/**
 * Manual Test Script for Automatic Synchronization
 * 
 * This script demonstrates the automatic sync functionality
 * that runs every 2 hours to keep accounts up to date.
 */

interface MockAccount {
  id: string;
  userId: string;
  provider: string;
  name: string;
  lastSyncAt: Date;
  isActive: boolean;
}

interface SyncResult {
  accountId: string;
  success: boolean;
  transactionCount?: number;
  error?: string;
  duration: number;
}

class MockSyncService {
  private accounts: MockAccount[] = [
    {
      id: 'acc-1',
      userId: 'user-1',
      provider: 'plaid',
      name: 'Chase Checking',
      lastSyncAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      isActive: true
    },
    {
      id: 'acc-2',
      userId: 'user-1',
      provider: 'truelayer',
      name: 'Barclays Savings',
      lastSyncAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      isActive: true
    },
    {
      id: 'acc-3',
      userId: 'user-2',
      provider: 'pluggy',
      name: 'Banco do Brasil',
      lastSyncAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      isActive: true
    },
    {
      id: 'acc-4',
      userId: 'user-2',
      provider: 'manual',
      name: 'Cash Account',
      lastSyncAt: new Date(),
      isActive: true
    },
    {
      id: 'acc-5',
      userId: 'user-3',
      provider: 'belvo',
      name: 'BBVA Mexico',
      lastSyncAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      isActive: false // Inactive account
    }
  ];

  /**
   * Get accounts that need synchronization
   */
  getAccountsForSync(): MockAccount[] {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    return this.accounts.filter(account => 
      account.isActive && 
      account.provider !== 'manual' &&
      account.lastSyncAt < twoHoursAgo
    );
  }

  /**
   * Simulate syncing a single account
   */
  async syncAccount(account: MockAccount): Promise<SyncResult> {
    const startTime = Date.now();
    
    // Simulate different sync scenarios
    const random = Math.random();
    
    if (random < 0.1) {
      // 10% chance of failure
      return {
        accountId: account.id,
        success: false,
        error: 'Rate limit exceeded',
        duration: Date.now() - startTime
      };
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const transactionCount = Math.floor(Math.random() * 20) + 1;
    
    return {
      accountId: account.id,
      success: true,
      transactionCount,
      duration: Date.now() - startTime
    };
  }

  /**
   * Simulate the scheduled sync process
   */
  async runScheduledSync(): Promise<{
    totalAccounts: number;
    syncedAccounts: number;
    failedAccounts: number;
    results: SyncResult[];
    totalDuration: number;
  }> {
    const startTime = Date.now();
    console.log('🔄 Starting scheduled account synchronization...\n');

    const accountsToSync = this.getAccountsForSync();
    console.log(`Found ${accountsToSync.length} accounts that need synchronization:`);
    
    accountsToSync.forEach(account => {
      const hoursAgo = Math.round((Date.now() - account.lastSyncAt.getTime()) / (1000 * 60 * 60));
      console.log(`  - ${account.name} (${account.provider}) - Last sync: ${hoursAgo}h ago`);
    });
    console.log();

    const results: SyncResult[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Process accounts with staggered delays (5 seconds apart)
    for (let i = 0; i < accountsToSync.length; i++) {
      const account = accountsToSync[i];
      
      if (i > 0) {
        console.log('⏳ Waiting 5 seconds before next sync (rate limiting)...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      console.log(`🔄 Syncing ${account.name} (${account.provider})...`);
      
      try {
        const result = await this.syncAccount(account);
        results.push(result);
        
        if (result.success) {
          syncedCount++;
          console.log(`✅ Success: ${result.transactionCount} transactions synced in ${result.duration}ms`);
          
          // Update last sync time
          account.lastSyncAt = new Date();
        } else {
          failedCount++;
          console.log(`❌ Failed: ${result.error}`);
        }
      } catch (error) {
        failedCount++;
        const result: SyncResult = {
          accountId: account.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0
        };
        results.push(result);
        console.log(`❌ Exception: ${result.error}`);
      }
      
      console.log();
    }

    const totalDuration = Date.now() - startTime;
    
    return {
      totalAccounts: accountsToSync.length,
      syncedAccounts: syncedCount,
      failedAccounts: failedCount,
      results,
      totalDuration
    };
  }

  /**
   * Display sync statistics
   */
  displaySyncStats(stats: any) {
    console.log('📊 Synchronization Summary:');
    console.log(`  Total accounts processed: ${stats.totalAccounts}`);
    console.log(`  Successfully synced: ${stats.syncedAccounts}`);
    console.log(`  Failed syncs: ${stats.failedAccounts}`);
    console.log(`  Total duration: ${(stats.totalDuration / 1000).toFixed(2)}s`);
    
    if (stats.syncedAccounts > 0) {
      const totalTransactions = stats.results
        .filter((r: SyncResult) => r.success)
        .reduce((sum: number, r: SyncResult) => sum + (r.transactionCount || 0), 0);
      console.log(`  Total transactions imported: ${totalTransactions}`);
    }
    
    console.log();
    
    if (stats.failedAccounts > 0) {
      console.log('❌ Failed Accounts:');
      stats.results
        .filter((r: SyncResult) => !r.success)
        .forEach((r: SyncResult) => {
          const account = this.accounts.find(a => a.id === r.accountId);
          console.log(`  - ${account?.name} (${account?.provider}): ${r.error}`);
        });
      console.log();
    }
  }

  /**
   * Test retry mechanism for failed syncs
   */
  async testRetryMechanism() {
    console.log('🔄 Testing Retry Mechanism for Failed Syncs\n');
    
    const failedAccount: MockAccount = {
      id: 'retry-test',
      userId: 'user-test',
      provider: 'plaid',
      name: 'Test Retry Account',
      lastSyncAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      isActive: true
    };

    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      console.log(`Attempt ${attempt}/${maxRetries}:`);
      
      // Simulate higher failure rate for testing
      const result = await this.syncAccount(failedAccount);
      
      if (result.success) {
        console.log(`✅ Sync succeeded on attempt ${attempt}`);
        break;
      } else {
        console.log(`❌ Attempt ${attempt} failed: ${result.error}`);
        
        if (attempt < maxRetries) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    
    if (attempt >= maxRetries) {
      console.log(`❌ All ${maxRetries} attempts failed. Account marked for manual review.`);
    }
    
    console.log();
  }
}

// Main test function
async function testAutomaticSync() {
  console.log('🚀 Testing Automatic Synchronization System\n');
  
  const syncService = new MockSyncService();
  
  // Test 1: Regular scheduled sync
  console.log('=== Test 1: Scheduled Synchronization ===\n');
  const stats = await syncService.runScheduledSync();
  syncService.displaySyncStats(stats);
  
  // Test 2: Retry mechanism
  console.log('=== Test 2: Retry Mechanism ===\n');
  await syncService.testRetryMechanism();
  
  console.log('🎉 Automatic synchronization testing completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAutomaticSync().catch(console.error);
}

export { MockSyncService, testAutomaticSync };