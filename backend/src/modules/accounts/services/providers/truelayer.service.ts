import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OpenBankingProviderInterface } from '../open-banking.service';

@Injectable()
export class TrueLayerService implements OpenBankingProviderInterface {
  private readonly logger = new Logger(TrueLayerService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get('TRUELAYER_BASE_URL') || 'https://api.truelayer.com';
    this.clientId = this.configService.get('TRUELAYER_CLIENT_ID');
    this.clientSecret = this.configService.get('TRUELAYER_CLIENT_SECRET');
  }

  async exchangeToken(authCode: string, redirectUri?: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/connect/token`, {
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: authCode,
          redirect_uri: redirectUri,
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      this.logger.error('Failed to exchange TrueLayer token:', error.response?.data || error.message);
      throw new Error(`TrueLayer token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async getAccounts(accessToken: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/data/v1/accounts`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }),
      );

      return response.data.results.map((account: any) => ({
        id: account.account_id,
        name: account.display_name,
        type: account.account_type,
        balance: account.balance?.current || 0,
        currency: account.currency,
        provider: account.provider?.display_name,
        metadata: {
          accountNumber: account.account_number,
          sortCode: account.sort_code,
          iban: account.iban,
          bic: account.bic,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get TrueLayer accounts:', error.response?.data || error.message);
      throw new Error(`Failed to get accounts: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async getTransactions(
    accessToken: string,
    accountId: string,
    options: { startDate?: Date; endDate?: Date } = {},
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (options.startDate) {
        params.append('from', options.startDate.toISOString().split('T')[0]);
      }
      if (options.endDate) {
        params.append('to', options.endDate.toISOString().split('T')[0]);
      }

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/data/v1/accounts/${accountId}/transactions?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return response.data.results.map((transaction: any) => ({
        id: transaction.transaction_id,
        accountId,
        amount: Math.abs(transaction.amount),
        type: transaction.amount > 0 ? 'income' : 'expense',
        description: transaction.description,
        date: new Date(transaction.timestamp),
        category: transaction.transaction_category || 'Other',
        metadata: {
          transactionType: transaction.transaction_type,
          merchantName: transaction.merchant_name,
          runningBalance: transaction.running_balance,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get TrueLayer transactions:', error.response?.data || error.message);
      throw new Error(`Failed to get transactions: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async getBalance(accessToken: string, accountId: string): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/data/v1/accounts/${accountId}/balance`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }),
      );

      return response.data.results[0]?.current || 0;
    } catch (error) {
      this.logger.error('Failed to get TrueLayer balance:', error.response?.data || error.message);
      throw new Error(`Failed to get balance: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/connect/token`, {
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      this.logger.error('Failed to refresh TrueLayer token:', error.response?.data || error.message);
      throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }
}