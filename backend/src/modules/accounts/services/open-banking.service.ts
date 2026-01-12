import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { TokenEncryptionService } from './token-encryption.service';
import { PlaidService } from './providers/plaid.service';
import { TrueLayerService } from './providers/truelayer.service';
import { PluggyService } from './providers/pluggy.service';
import { BelvoService } from './providers/belvo.service';
import { ConnectAccountDto, OpenBankingProvider } from '../dto/connect-account.dto';
import { SyncAccountDto } from '../dto/sync-account.dto';

export interface OpenBankingProviderInterface {
  exchangeToken(authCode: string, redirectUri?: string): Promise<any>;
  getAccounts(accessToken: string): Promise<any[]>;
  getTransactions(accessToken: string, accountId: string, options?: any): Promise<any[]>;
  getBalance(accessToken: string, accountId: string): Promise<number>;
  refreshToken?(refreshToken: string): Promise<any>;
}

export interface ConnectedAccount {
  providerAccountId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  accessToken: string;
  refreshToken?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class OpenBankingService {
  private readonly logger = new Logger(OpenBankingService.name);
  private readonly providers: Map<string, OpenBankingProviderInterface>;

  constructor(
    private readonly accountsService: AccountsService,
    private readonly tokenEncryption: TokenEncryptionService,
    private readonly plaidService: PlaidService,
    private readonly trueLayerService: TrueLayerService,
    private readonly pluggyService: PluggyService,
    private readonly belvoService: BelvoService,
  ) {
    this.providers = new Map<string, OpenBankingProviderInterface>([
      [OpenBankingProvider.PLAID, this.plaidService],
      [OpenBankingProvider.TRUELAYER, this.trueLayerService],
      [OpenBankingProvider.PLUGGY, this.pluggyService],
      [OpenBankingProvider.BELVO, this.belvoService],
    ]);
  }

  async connectAccount(userId: string, connectDto: ConnectAccountDto) {
    const provider = this.getProvider(connectDto.provider);
    
    try {
      // Exchange authorization code for access token
      const tokenData = await provider.exchangeToken(
        connectDto.authCode,
        connectDto.redirectUri,
      );

      // Get account information from provider
      const providerAccounts = await provider.getAccounts(tokenData.accessToken);

      // Create accounts in our database
      const createdAccounts = [];
      for (const providerAccount of providerAccounts) {
        // Check if account already exists
        const existingAccount = await this.accountsService.findByProvider(
          userId,
          connectDto.provider,
          providerAccount.id,
        );

        if (existingAccount) {
          this.logger.warn(
            `Account ${providerAccount.id} already exists for user ${userId}`,
          );
          continue;
        }

        // Encrypt tokens before storing
        const encryptedAccessToken = this.tokenEncryption.encrypt(tokenData.accessToken);
        const encryptedRefreshToken = tokenData.refreshToken 
          ? this.tokenEncryption.encrypt(tokenData.refreshToken)
          : null;

        const accountData = {
          user: { connect: { id: userId } },
          type: this.mapAccountType(providerAccount.type),
          provider: connectDto.provider,
          providerAccountId: providerAccount.id,
          name: providerAccount.name,
          balance: providerAccount.balance || 0,
          currency: providerAccount.currency || 'BRL',
          isActive: true,
          lastSyncAt: new Date(),
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: tokenData.expiresIn 
            ? new Date(Date.now() + tokenData.expiresIn * 1000)
            : null,
          metadata: JSON.stringify({
            ...providerAccount.metadata,
            ...connectDto.metadata,
          }),
        };

        const account = await this.accountsService.create(accountData);
        createdAccounts.push(account);

        this.logger.log(
          `Connected account ${account.id} for user ${userId} via ${connectDto.provider}`,
        );
      }

      return {
        success: true,
        accounts: createdAccounts,
        message: `Successfully connected ${createdAccounts.length} account(s)`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to connect account for user ${userId}:`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to connect account: ${error.message}`,
      );
    }
  }

  async syncAccount(userId: string, accountId: string, syncDto: SyncAccountDto = {}) {
    const account = await this.accountsService.findOneByUser(userId, accountId);
    
    if (!account.provider || account.provider === 'manual') {
      throw new BadRequestException('Cannot sync manual accounts');
    }

    const provider = this.getProvider(account.provider as OpenBankingProvider);

    try {
      // Get and decrypt access token
      if (!account.accessToken) {
        throw new BadRequestException('No access token found for account');
      }
      
      let accessToken = this.tokenEncryption.decrypt(account.accessToken);
      
      // Check if token needs refreshing
      if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
        if (account.refreshToken && provider.refreshToken) {
          const refreshToken = this.tokenEncryption.decrypt(account.refreshToken);
          const newTokenData = await provider.refreshToken(refreshToken);
          
          // Update stored tokens
          await this.updateAccountTokens(accountId, newTokenData);
          accessToken = newTokenData.accessToken;
        } else {
          throw new BadRequestException('Access token expired and no refresh token available');
        }
      }

      // Get fresh account data
      const providerAccounts = await provider.getAccounts(accessToken);
      const providerAccount = providerAccounts.find(
        acc => acc.id === account.providerAccountId,
      );

      if (!providerAccount) {
        throw new BadRequestException('Account not found at provider');
      }

      // Update balance
      await this.accountsService.updateBalance(accountId, providerAccount.balance);

      // Sync transactions
      const startDate = syncDto.startDate 
        ? new Date(syncDto.startDate)
        : syncDto.forceFullSync 
          ? new Date('2020-01-01') // Far back date for full sync
          : account.lastSyncAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const endDate = syncDto.endDate ? new Date(syncDto.endDate) : new Date();

      const transactions = await provider.getTransactions(
        accessToken,
        account.providerAccountId,
        { startDate, endDate },
      );

      // TODO: Process and save transactions (implement in TransactionsService)
      // This would involve deduplication, categorization, etc.
      
      // Clear any previous sync errors
      await this.clearSyncError(accountId);
      
      // Update last sync time
      await this.accountsService.updateLastSync(accountId);

      this.logger.log(
        `Synced ${transactions.length} transactions for account ${accountId}`,
      );

      return {
        success: true,
        transactionCount: transactions.length,
        lastSyncAt: new Date(),
      };
    } catch (error) {
      // Store sync error
      await this.setSyncError(accountId, error.message);
      
      this.logger.error(
        `Failed to sync account ${accountId}:`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to sync account: ${error.message}`,
      );
    }
  }

  async getAuthUrl(provider: string, userId: string, redirectUri: string) {
    // Most providers will have a method to generate auth URLs
    // This is a simplified implementation
    const baseUrls = {
      [OpenBankingProvider.PLAID]: 'https://cdn.plaid.com/link/v2/stable/link.html',
      [OpenBankingProvider.TRUELAYER]: 'https://auth.truelayer.com',
      [OpenBankingProvider.PLUGGY]: 'https://api.pluggy.ai/auth',
      [OpenBankingProvider.BELVO]: 'https://api.belvo.com/auth',
    };

    const authUrl = baseUrls[provider as OpenBankingProvider];
    if (!authUrl) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    return {
      authUrl: `${authUrl}?redirect_uri=${encodeURIComponent(redirectUri)}&user_id=${userId}`,
      provider,
    };
  }

  getSupportedProviders() {
    return [
      {
        id: OpenBankingProvider.PLAID,
        name: 'Plaid',
        description: 'Connect US and Canadian bank accounts',
        countries: ['US', 'CA'],
        logo: '/logos/plaid.png',
      },
      {
        id: OpenBankingProvider.TRUELAYER,
        name: 'TrueLayer',
        description: 'Connect European bank accounts',
        countries: ['GB', 'ES', 'FR', 'DE', 'IT'],
        logo: '/logos/truelayer.png',
      },
      {
        id: OpenBankingProvider.PLUGGY,
        name: 'Pluggy',
        description: 'Connect Brazilian bank accounts',
        countries: ['BR'],
        logo: '/logos/pluggy.png',
      },
      {
        id: OpenBankingProvider.BELVO,
        name: 'Belvo',
        description: 'Connect Latin American bank accounts',
        countries: ['MX', 'CO', 'BR'],
        logo: '/logos/belvo.png',
      },
    ];
  }

  async syncAllUserAccounts(userId: string) {
    this.logger.log(`Syncing all accounts for user ${userId}`);

    const userAccounts = await this.accountsService.findAllByUser(userId, {
      isActive: true,
    });

    const syncableAccounts = userAccounts.accounts.filter(
      account => account.provider && account.provider !== 'manual'
    );

    // Sync each account individually
    const syncResults = [];
    for (const account of syncableAccounts) {
      try {
        const result = await this.syncAccount(userId, account.id);
        syncResults.push({
          accountId: account.id,
          success: true,
          ...result,
        });
      } catch (error) {
        syncResults.push({
          accountId: account.id,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      accountCount: syncableAccounts.length,
      results: syncResults,
      message: `Synced ${syncableAccounts.length} accounts`,
    };
  }

  private async updateAccountTokens(accountId: string, tokenData: any) {
    const encryptedAccessToken = this.tokenEncryption.encrypt(tokenData.accessToken);
    const encryptedRefreshToken = tokenData.refreshToken 
      ? this.tokenEncryption.encrypt(tokenData.refreshToken)
      : null;

    await this.accountsService.update('system', accountId, {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: tokenData.expiresIn 
        ? new Date(Date.now() + tokenData.expiresIn * 1000)
        : null,
    } as any);
  }

  private async setSyncError(accountId: string, errorMessage: string) {
    await this.accountsService.update('system', accountId, {
      syncError: errorMessage,
    } as any);
  }

  private async clearSyncError(accountId: string) {
    await this.accountsService.update('system', accountId, {
      syncError: null,
    } as any);
  }

  private getProvider(providerName: OpenBankingProvider): OpenBankingProviderInterface {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new BadRequestException(`Unsupported provider: ${providerName}`);
    }
    return provider;
  }

  private mapAccountType(providerType: string): string {
    // Map provider-specific account types to our standard types
    const typeMapping: Record<string, string> = {
      // Plaid types
      'depository': 'checking',
      'credit': 'credit_card',
      'investment': 'investment',
      'loan': 'loan',
      
      // TrueLayer types
      'TRANSACTION': 'checking',
      'SAVINGS': 'savings',
      'CREDIT_CARD': 'credit_card',
      
      // Pluggy types
      'BANK': 'checking',
      'CREDIT': 'credit_card',
      
      // Belvo types
      'checking_account': 'checking',
      'savings_account': 'savings',
      'credit_card': 'credit_card',
    };

    return typeMapping[providerType] || 'checking';
  }
}