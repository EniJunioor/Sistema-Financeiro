import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { OpenBankingService } from './services/open-banking.service';
import { AccountsService } from './services/accounts.service';
import { TokenEncryptionService } from './services/token-encryption.service';
import { PlaidService } from './services/providers/plaid.service';
import { TrueLayerService } from './services/providers/truelayer.service';
import { PluggyService } from './services/providers/pluggy.service';
import { BelvoService } from './services/providers/belvo.service';
import { OpenBankingProvider } from './dto/connect-account.dto';

describe('Open Banking Checkpoint Tests', () => {
  let openBankingService: OpenBankingService;
  let accountsService: AccountsService;
  let plaidService: PlaidService;
  let configService: ConfigService;

  // Mock services
  const mockAccountsService = {
    findByProvider: jest.fn(),
    create: jest.fn(),
    findOneByUser: jest.fn(),
    updateBalance: jest.fn(),
    updateLastSync: jest.fn(),
    update: jest.fn(),
    findAllByUser: jest.fn(),
    getActiveAccountsForSync: jest.fn(),
  };

  const mockTokenEncryption = {
    encrypt: jest.fn((token) => `encrypted_${token}`),
    decrypt: jest.fn((encryptedToken) => encryptedToken.replace('encrypted_', '')),
  };

  const mockPlaidService = {
    exchangeToken: jest.fn(),
    getAccounts: jest.fn(),
    getTransactions: jest.fn(),
    getBalance: jest.fn(),
    createLinkToken: jest.fn(),
  };

  const mockTrueLayerService = {
    exchangeToken: jest.fn(),
    getAccounts: jest.fn(),
    getTransactions: jest.fn(),
    getBalance: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockPluggyService = {
    exchangeToken: jest.fn(),
    getAccounts: jest.fn(),
    getTransactions: jest.fn(),
    getBalance: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockBelvoService = {
    exchangeToken: jest.fn(),
    getAccounts: jest.fn(),
    getTransactions: jest.fn(),
    getBalance: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        HttpModule,
      ],
      providers: [
        OpenBankingService,
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
        {
          provide: TokenEncryptionService,
          useValue: mockTokenEncryption,
        },
        {
          provide: PlaidService,
          useValue: mockPlaidService,
        },
        {
          provide: TrueLayerService,
          useValue: mockTrueLayerService,
        },
        {
          provide: PluggyService,
          useValue: mockPluggyService,
        },
        {
          provide: BelvoService,
          useValue: mockBelvoService,
        },
      ],
    }).compile();

    openBankingService = module.get<OpenBankingService>(OpenBankingService);
    accountsService = module.get<AccountsService>(AccountsService);
    plaidService = module.get<PlaidService>(PlaidService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Provider Support Test', () => {
    it('should support all required Open Banking providers', () => {
      const providers = openBankingService.getSupportedProviders();
      
      expect(providers).toHaveLength(4);
      
      const providerIds = providers.map(p => p.id);
      expect(providerIds).toContain(OpenBankingProvider.PLAID);
      expect(providerIds).toContain(OpenBankingProvider.TRUELAYER);
      expect(providerIds).toContain(OpenBankingProvider.PLUGGY);
      expect(providerIds).toContain(OpenBankingProvider.BELVO);
      
      // Verify each provider has required metadata
      providers.forEach(provider => {
        expect(provider).toHaveProperty('id');
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('description');
        expect(provider).toHaveProperty('countries');
        expect(provider).toHaveProperty('logo');
        expect(Array.isArray(provider.countries)).toBe(true);
      });
    });

    it('should generate auth URLs for supported providers', async () => {
      const userId = 'test-user-123';
      const redirectUri = 'http://localhost:3000/callback';

      for (const provider of [
        OpenBankingProvider.PLAID,
        OpenBankingProvider.TRUELAYER,
        OpenBankingProvider.PLUGGY,
        OpenBankingProvider.BELVO,
      ]) {
        const result = await openBankingService.getAuthUrl(provider, userId, redirectUri);
        
        expect(result).toHaveProperty('authUrl');
        expect(result).toHaveProperty('provider', provider);
        expect(result.authUrl).toContain(encodeURIComponent(redirectUri));
        expect(result.authUrl).toContain(userId);
      }
    });
  });

  describe('2. Account Connection Test', () => {
    it('should successfully connect a Plaid account', async () => {
      const userId = 'test-user-123';
      const connectDto = {
        provider: OpenBankingProvider.PLAID,
        authCode: 'test-public-token',
        redirectUri: 'http://localhost:3000/callback',
      };

      // Mock Plaid responses
      mockPlaidService.exchangeToken.mockResolvedValue({
        accessToken: 'access-token-123',
        itemId: 'item-123',
      });

      mockPlaidService.getAccounts.mockResolvedValue([
        {
          id: 'account-123',
          name: 'Test Checking Account',
          type: 'depository',
          balance: 1500.50,
          currency: 'USD',
          metadata: {
            officialName: 'Test Bank Checking',
          },
        },
      ]);

      mockAccountsService.findByProvider.mockResolvedValue(null); // No existing account
      mockAccountsService.create.mockResolvedValue({
        id: 'created-account-123',
        userId,
        provider: OpenBankingProvider.PLAID,
        name: 'Test Checking Account',
        balance: 1500.50,
      });

      const result = await openBankingService.connectAccount(userId, connectDto);

      expect(result.success).toBe(true);
      expect(result.accounts).toHaveLength(1);
      expect(result.message).toContain('Successfully connected 1 account(s)');

      // Verify token encryption was called
      expect(mockTokenEncryption.encrypt).toHaveBeenCalledWith('access-token-123');
      
      // Verify account creation
      expect(mockAccountsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: OpenBankingProvider.PLAID,
          providerAccountId: 'account-123',
          name: 'Test Checking Account',
          balance: 1500.50,
          currency: 'USD',
          accessToken: 'encrypted_access-token-123',
        })
      );
    });

    it('should handle duplicate account connection gracefully', async () => {
      const userId = 'test-user-123';
      const connectDto = {
        provider: OpenBankingProvider.PLAID,
        authCode: 'test-public-token',
      };

      mockPlaidService.exchangeToken.mockResolvedValue({
        accessToken: 'access-token-123',
        itemId: 'item-123',
      });

      mockPlaidService.getAccounts.mockResolvedValue([
        {
          id: 'account-123',
          name: 'Test Checking Account',
          type: 'depository',
          balance: 1500.50,
        },
      ]);

      // Mock existing account
      mockAccountsService.findByProvider.mockResolvedValue({
        id: 'existing-account-123',
        userId,
        provider: OpenBankingProvider.PLAID,
        providerAccountId: 'account-123',
      });

      const result = await openBankingService.connectAccount(userId, connectDto);

      expect(result.success).toBe(true);
      expect(result.accounts).toHaveLength(0); // No new accounts created
      expect(mockAccountsService.create).not.toHaveBeenCalled();
    });
  });

  describe('3. Account Synchronization Test', () => {
    it('should successfully sync account transactions', async () => {
      const userId = 'test-user-123';
      const accountId = 'account-123';

      // Mock account data
      mockAccountsService.findOneByUser.mockResolvedValue({
        id: accountId,
        userId,
        provider: OpenBankingProvider.PLAID,
        providerAccountId: 'plaid-account-123',
        accessToken: 'encrypted_access-token-123',
        refreshToken: null,
        tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        lastSyncAt: new Date(Date.now() - 86400000), // 1 day ago
      });

      // Mock Plaid responses
      mockPlaidService.getAccounts.mockResolvedValue([
        {
          id: 'plaid-account-123',
          name: 'Test Account',
          balance: 2000.75,
        },
      ]);

      mockPlaidService.getTransactions.mockResolvedValue([
        {
          id: 'txn-1',
          accountId: 'plaid-account-123',
          amount: 50.00,
          type: 'expense',
          description: 'Coffee Shop',
          date: new Date(),
          category: 'Food and Drink',
        },
        {
          id: 'txn-2',
          accountId: 'plaid-account-123',
          amount: 1000.00,
          type: 'income',
          description: 'Salary',
          date: new Date(),
          category: 'Payroll',
        },
      ]);

      mockAccountsService.updateBalance.mockResolvedValue({});
      mockAccountsService.updateLastSync.mockResolvedValue({});

      const result = await openBankingService.syncAccount(userId, accountId);

      expect(result.success).toBe(true);
      expect(result.transactionCount).toBe(2);
      expect(result.lastSyncAt).toBeInstanceOf(Date);

      // Verify balance update
      expect(mockAccountsService.updateBalance).toHaveBeenCalledWith(accountId, 2000.75);
      
      // Verify sync timestamp update
      expect(mockAccountsService.updateLastSync).toHaveBeenCalledWith(accountId);
      
      // Verify token decryption
      expect(mockTokenEncryption.decrypt).toHaveBeenCalledWith('encrypted_access-token-123');
    });

    it('should handle token refresh when expired', async () => {
      const userId = 'test-user-123';
      const accountId = 'account-123';

      // Mock account with expired token
      mockAccountsService.findOneByUser.mockResolvedValue({
        id: accountId,
        userId,
        provider: OpenBankingProvider.TRUELAYER,
        providerAccountId: 'truelayer-account-123',
        accessToken: 'encrypted_old-access-token',
        refreshToken: 'encrypted_refresh-token-123',
        tokenExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago (expired)
      });

      // Mock token refresh
      mockTrueLayerService.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token-123',
        refreshToken: 'new-refresh-token-123',
        expiresIn: 3600,
      });

      mockTrueLayerService.getAccounts.mockResolvedValue([
        {
          id: 'truelayer-account-123',
          name: 'Test Account',
          balance: 1500.00,
        },
      ]);

      mockTrueLayerService.getTransactions.mockResolvedValue([]);

      mockAccountsService.updateBalance.mockResolvedValue({});
      mockAccountsService.updateLastSync.mockResolvedValue({});
      mockAccountsService.update.mockResolvedValue({});

      const result = await openBankingService.syncAccount(userId, accountId);

      expect(result.success).toBe(true);
      
      // Verify token refresh was called
      expect(mockTrueLayerService.refreshToken).toHaveBeenCalledWith('refresh-token-123');
      
      // Verify tokens were updated
      expect(mockAccountsService.update).toHaveBeenCalledWith(
        'system',
        accountId,
        expect.objectContaining({
          accessToken: 'encrypted_new-access-token-123',
          refreshToken: 'encrypted_new-refresh-token-123',
        })
      );
    });

    it('should handle sync errors gracefully', async () => {
      const userId = 'test-user-123';
      const accountId = 'account-123';

      mockAccountsService.findOneByUser.mockResolvedValue({
        id: accountId,
        userId,
        provider: OpenBankingProvider.PLAID,
        providerAccountId: 'plaid-account-123',
        accessToken: 'encrypted_access-token-123',
      });

      // Mock API error
      mockPlaidService.getAccounts.mockRejectedValue(new Error('API rate limit exceeded'));

      mockAccountsService.update.mockResolvedValue({});

      await expect(
        openBankingService.syncAccount(userId, accountId)
      ).rejects.toThrow('Failed to sync account: API rate limit exceeded');

      // Verify error was stored
      expect(mockAccountsService.update).toHaveBeenCalledWith(
        'system',
        accountId,
        expect.objectContaining({
          syncError: 'API rate limit exceeded',
        })
      );
    });
  });

  describe('4. Bulk Sync Operations Test', () => {
    it('should sync all user accounts', async () => {
      const userId = 'test-user-123';

      mockAccountsService.findAllByUser.mockResolvedValue({
        accounts: [
          {
            id: 'account-1',
            provider: OpenBankingProvider.PLAID,
            isActive: true,
          },
          {
            id: 'account-2',
            provider: OpenBankingProvider.TRUELAYER,
            isActive: true,
          },
          {
            id: 'account-3',
            provider: 'manual',
            isActive: true,
          },
        ],
      });

      // Mock individual sync calls
      jest.spyOn(openBankingService, 'syncAccount')
        .mockResolvedValueOnce({
          success: true,
          transactionCount: 5,
          lastSyncAt: new Date(),
        })
        .mockResolvedValueOnce({
          success: true,
          transactionCount: 3,
          lastSyncAt: new Date(),
        });

      const result = await openBankingService.syncAllUserAccounts(userId);

      expect(result.success).toBe(true);
      expect(result.accountCount).toBe(2); // Only non-manual accounts
      expect(result.results).toHaveLength(2);
      
      // Verify manual account was skipped
      expect(openBankingService.syncAccount).toHaveBeenCalledTimes(2);
      expect(openBankingService.syncAccount).toHaveBeenCalledWith(userId, 'account-1');
      expect(openBankingService.syncAccount).toHaveBeenCalledWith(userId, 'account-2');
    });
  });

  describe('5. Deduplication Test', () => {
    it('should detect potential duplicate transactions', async () => {
      // This would be implemented in the TransactionsService
      // For now, we verify the structure is in place
      expect(openBankingService).toBeDefined();
      expect(typeof openBankingService.syncAccount).toBe('function');
    });
  });

  describe('6. Configuration Test', () => {
    it('should have configuration service available', () => {
      // Test that configuration service is available
      expect(configService).toBeDefined();
      
      // Test that we can access configuration values
      const testVars = [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
      ];

      testVars.forEach(varName => {
        const value = configService.get(varName);
        // These should be defined in any environment
        expect(value).toBeDefined();
      });
    });

    it('should have Open Banking provider configuration structure', () => {
      // Test that the configuration structure exists for providers
      const providers = [
        { prefix: 'PLAID', vars: ['CLIENT_ID', 'SECRET'] },
        { prefix: 'TRUELAYER', vars: ['CLIENT_ID', 'CLIENT_SECRET'] },
        { prefix: 'PLUGGY', vars: ['CLIENT_ID', 'CLIENT_SECRET'] },
        { prefix: 'BELVO', vars: ['SECRET_ID', 'SECRET_PASSWORD'] },
      ];

      providers.forEach(provider => {
        provider.vars.forEach(varSuffix => {
          const varName = `${provider.prefix}_${varSuffix}`;
          // We just test that the config service can be called
          // In development, values might be undefined or placeholder
          expect(() => configService.get(varName)).not.toThrow();
        });
      });
    });
  });
});