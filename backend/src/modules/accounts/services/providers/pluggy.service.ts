import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OpenBankingProviderInterface } from '../open-banking.service';

@Injectable()
export class PluggyService implements OpenBankingProviderInterface {
  private readonly logger = new Logger(PluggyService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get('PLUGGY_BASE_URL') || 'https://api.pluggy.ai';
    this.clientId = this.configService.get('PLUGGY_CLIENT_ID');
    this.clientSecret = this.configService.get('PLUGGY_CLIENT_SECRET');
  }

  async exchangeToken(authCode: string): Promise<any> {
    try {
      // Pluggy uses a different flow - typically you get an itemId from their widget
      // This is a simplified implementation
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth`, {
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          itemId: authCode, // In Pluggy, this would be the itemId from their widget
        }),
      );

      return {
        accessToken: response.data.accessToken,
        itemId: authCode,
      };
    } catch (error) {
      this.logger.error('Failed to exchange Pluggy token:', error.response?.data || error.message);
      throw new Error(`Pluggy token exchange failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getAccounts(accessToken: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/accounts`, {
          headers: {
            'X-API-KEY': this.clientId,
            'Authorization': `Bearer ${accessToken}`,
          },
        }),
      );

      return response.data.results.map((account: any) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance || 0,
        currency: account.currencyCode || 'BRL',
        number: account.number,
        metadata: {
          bankName: account.bankData?.name,
          bankCode: account.bankData?.code,
          agency: account.bankData?.agency,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get Pluggy accounts:', error.response?.data || error.message);
      throw new Error(`Failed to get accounts: ${error.response?.data?.message || error.message}`);
    }
  }

  async getTransactions(
    accessToken: string,
    accountId: string,
    options: { startDate?: Date; endDate?: Date } = {},
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('accountId', accountId);
      
      if (options.startDate) {
        params.append('from', options.startDate.toISOString().split('T')[0]);
      }
      if (options.endDate) {
        params.append('to', options.endDate.toISOString().split('T')[0]);
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/transactions?${params.toString()}`, {
          headers: {
            'X-API-KEY': this.clientId,
            'Authorization': `Bearer ${accessToken}`,
          },
        }),
      );

      return response.data.results.map((transaction: any) => ({
        id: transaction.id,
        accountId,
        amount: Math.abs(transaction.amount),
        type: transaction.amount > 0 ? 'income' : 'expense',
        description: transaction.description,
        date: new Date(transaction.date),
        category: transaction.category?.name || 'Other',
        metadata: {
          categoryId: transaction.category?.id,
          balance: transaction.balance,
          paymentData: transaction.paymentData,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get Pluggy transactions:', error.response?.data || error.message);
      throw new Error(`Failed to get transactions: ${error.response?.data?.message || error.message}`);
    }
  }

  async getBalance(accessToken: string, accountId: string): Promise<number> {
    try {
      const accounts = await this.getAccounts(accessToken);
      const account = accounts.find(acc => acc.id === accountId);
      return account?.balance || 0;
    } catch (error) {
      this.logger.error('Failed to get Pluggy balance:', error.message);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    // Pluggy typically uses long-lived tokens that don't need refreshing
    // This would depend on their specific implementation
    throw new Error('Pluggy token refresh not implemented');
  }

  async createConnectToken(userId: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/connect_token`, {
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          clientUserId: userId,
        }),
      );

      return response.data.connectToken;
    } catch (error) {
      this.logger.error('Failed to create Pluggy connect token:', error.response?.data || error.message);
      throw new Error(`Failed to create connect token: ${error.response?.data?.message || error.message}`);
    }
  }
}