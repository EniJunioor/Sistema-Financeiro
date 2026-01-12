import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OpenBankingProviderInterface } from '../open-banking.service';

@Injectable()
export class BelvoService implements OpenBankingProviderInterface {
  private readonly logger = new Logger(BelvoService.name);
  private readonly baseUrl: string;
  private readonly secretId: string;
  private readonly secretPassword: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get('BELVO_BASE_URL') || 'https://api.belvo.com';
    this.secretId = this.configService.get('BELVO_SECRET_ID');
    this.secretPassword = this.configService.get('BELVO_SECRET_PASSWORD');
  }

  private getAuthHeaders() {
    const credentials = Buffer.from(`${this.secretId}:${this.secretPassword}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  async exchangeToken(linkId: string): Promise<any> {
    try {
      // In Belvo, you typically work with links (connections) rather than exchanging tokens
      // This is a simplified implementation
      return {
        accessToken: linkId, // Belvo uses the link ID as the access identifier
        linkId,
      };
    } catch (error) {
      this.logger.error('Failed to exchange Belvo token:', error.response?.data || error.message);
      throw new Error(`Belvo token exchange failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async getAccounts(linkId: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/accounts/`, {
          link: linkId,
        }, {
          headers: this.getAuthHeaders(),
        }),
      );

      return response.data.map((account: any) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance?.current || 0,
        currency: account.currency,
        number: account.number,
        metadata: {
          institution: account.institution?.name,
          category: account.category,
          publicIdentificationName: account.public_identification_name,
          publicIdentificationValue: account.public_identification_value,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get Belvo accounts:', error.response?.data || error.message);
      throw new Error(`Failed to get accounts: ${error.response?.data?.detail || error.message}`);
    }
  }

  async getTransactions(
    linkId: string,
    accountId: string,
    options: { startDate?: Date; endDate?: Date } = {},
  ): Promise<any[]> {
    try {
      const requestBody: any = {
        link: linkId,
        account: accountId,
      };

      if (options.startDate) {
        requestBody.date_from = options.startDate.toISOString().split('T')[0];
      }
      if (options.endDate) {
        requestBody.date_to = options.endDate.toISOString().split('T')[0];
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/transactions/`, requestBody, {
          headers: this.getAuthHeaders(),
        }),
      );

      return response.data.map((transaction: any) => ({
        id: transaction.id,
        accountId,
        amount: Math.abs(transaction.amount),
        type: transaction.type === 'INFLOW' ? 'income' : 'expense',
        description: transaction.description,
        date: new Date(transaction.accounting_date || transaction.value_date),
        category: transaction.category || 'Other',
        metadata: {
          reference: transaction.reference,
          observations: transaction.observations,
          merchant: transaction.merchant,
          status: transaction.status,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get Belvo transactions:', error.response?.data || error.message);
      throw new Error(`Failed to get transactions: ${error.response?.data?.detail || error.message}`);
    }
  }

  async getBalance(linkId: string, accountId: string): Promise<number> {
    try {
      const accounts = await this.getAccounts(linkId);
      const account = accounts.find(acc => acc.id === accountId);
      return account?.balance || 0;
    } catch (error) {
      this.logger.error('Failed to get Belvo balance:', error.message);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    // Belvo doesn't use refresh tokens in the traditional sense
    // Links are long-lived and managed differently
    throw new Error('Belvo does not support token refresh');
  }

  async createLink(institution: string, username: string, password: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/links/`, {
          institution,
          username,
          password,
        }, {
          headers: this.getAuthHeaders(),
        }),
      );

      return {
        linkId: response.data.id,
        status: response.data.status,
        institution: response.data.institution,
      };
    } catch (error) {
      this.logger.error('Failed to create Belvo link:', error.response?.data || error.message);
      throw new Error(`Failed to create link: ${error.response?.data?.detail || error.message}`);
    }
  }

  async getInstitutions(country?: string): Promise<any[]> {
    try {
      const params = country ? `?country_code=${country}` : '';
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/institutions/${params}`, {
          headers: this.getAuthHeaders(),
        }),
      );

      return response.data.results.map((institution: any) => ({
        id: institution.id,
        name: institution.display_name,
        country: institution.country_code,
        type: institution.type,
        website: institution.website,
        logo: institution.logo,
      }));
    } catch (error) {
      this.logger.error('Failed to get Belvo institutions:', error.response?.data || error.message);
      throw new Error(`Failed to get institutions: ${error.response?.data?.detail || error.message}`);
    }
  }
}