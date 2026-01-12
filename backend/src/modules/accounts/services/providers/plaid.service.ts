import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OpenBankingProviderInterface } from '../open-banking.service';

@Injectable()
export class PlaidService implements OpenBankingProviderInterface {
  private readonly logger = new Logger(PlaidService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly secret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get('PLAID_BASE_URL') || 'https://sandbox.plaid.com';
    this.clientId = this.configService.get('PLAID_CLIENT_ID');
    this.secret = this.configService.get('PLAID_SECRET');
  }

  async exchangeToken(publicToken: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/link/token/exchange`, {
          client_id: this.clientId,
          secret: this.secret,
          public_token: publicToken,
        }),
      );

      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      };
    } catch (error) {
      this.logger.error('Failed to exchange Plaid token:', error.response?.data || error.message);
      throw new Error(`Plaid token exchange failed: ${error.response?.data?.error_message || error.message}`);
    }
  }

  async getAccounts(accessToken: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/accounts/get`, {
          client_id: this.clientId,
          secret: this.secret,
          access_token: accessToken,
        }),
      );

      return response.data.accounts.map((account: any) => ({
        id: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        balance: account.balances.current || 0,
        currency: account.balances.iso_currency_code || 'USD',
        mask: account.mask,
        metadata: {
          officialName: account.official_name,
          persistentAccountId: account.persistent_account_id,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get Plaid accounts:', error.response?.data || error.message);
      throw new Error(`Failed to get accounts: ${error.response?.data?.error_message || error.message}`);
    }
  }

  async getTransactions(
    accessToken: string,
    accountId: string,
    options: { startDate?: Date; endDate?: Date } = {},
  ): Promise<any[]> {
    try {
      const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = options.endDate || new Date();

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/transactions/get`, {
          client_id: this.clientId,
          secret: this.secret,
          access_token: accessToken,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          account_ids: [accountId],
        }),
      );

      return response.data.transactions.map((transaction: any) => ({
        id: transaction.transaction_id,
        accountId: transaction.account_id,
        amount: Math.abs(transaction.amount),
        type: transaction.amount > 0 ? 'expense' : 'income',
        description: transaction.name,
        date: new Date(transaction.date),
        category: transaction.category?.[0] || 'Other',
        subcategory: transaction.category?.[1],
        location: transaction.location ? {
          address: transaction.location.address,
          city: transaction.location.city,
          region: transaction.location.region,
          postalCode: transaction.location.postal_code,
          country: transaction.location.country,
        } : null,
        metadata: {
          merchantName: transaction.merchant_name,
          paymentChannel: transaction.payment_channel,
          transactionType: transaction.transaction_type,
          accountOwner: transaction.account_owner,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get Plaid transactions:', error.response?.data || error.message);
      throw new Error(`Failed to get transactions: ${error.response?.data?.error_message || error.message}`);
    }
  }

  async getBalance(accessToken: string, accountId: string): Promise<number> {
    try {
      const accounts = await this.getAccounts(accessToken);
      const account = accounts.find(acc => acc.id === accountId);
      return account?.balance || 0;
    } catch (error) {
      this.logger.error('Failed to get Plaid balance:', error.message);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    // Plaid doesn't use refresh tokens in the same way as OAuth2
    // Access tokens are long-lived and don't need refreshing
    throw new Error('Plaid does not support token refresh');
  }

  async createLinkToken(userId: string, redirectUri?: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/link/token/create`, {
          client_id: this.clientId,
          secret: this.secret,
          client_name: 'Plataforma Financeira',
          country_codes: ['US', 'CA'],
          language: 'en',
          user: {
            client_user_id: userId,
          },
          products: ['transactions'],
          redirect_uri: redirectUri,
        }),
      );

      return response.data.link_token;
    } catch (error) {
      this.logger.error('Failed to create Plaid link token:', error.response?.data || error.message);
      throw new Error(`Failed to create link token: ${error.response?.data?.error_message || error.message}`);
    }
  }
}