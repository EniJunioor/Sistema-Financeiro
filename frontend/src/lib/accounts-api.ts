import { apiClient } from './api';

export interface OpenBankingProvider {
  id: string;
  name: string;
  logo?: string;
  countries: string[];
  features: string[];
}

export interface ConnectAccountRequest {
  provider: 'plaid' | 'truelayer' | 'pluggy' | 'belvo';
  authCode: string;
  providerAccountId?: string;
  redirectUri?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAccountRequest {
  name?: string;
  isActive?: boolean;
}

export interface AccountFilters {
  type?: 'checking' | 'savings' | 'credit_card' | 'investment';
  provider?: string;
  isActive?: boolean;
}

export interface SyncAccountRequest {
  startDate?: string;
  endDate?: string;
  forceFullSync?: boolean;
}

export interface AuthUrlRequest {
  redirectUri: string;
}

export interface AuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSync?: string;
  nextSync?: string;
  queueSize: number;
}

export interface AccountTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  status: 'pending' | 'approved' | 'rejected';
  categoryId?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedAccountTransactions {
  data: AccountTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AccountsAPI {
  // Get all user accounts
  static async getAccounts(filters?: AccountFilters) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.provider) params.append('provider', filters.provider);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await apiClient.get(`/accounts?${params.toString()}`);
    return response.data;
  }

  // Get account by ID
  static async getAccount(accountId: string) {
    const response = await apiClient.get(`/accounts/${accountId}`);
    return response.data;
  }

  // Connect new account
  static async connectAccount(data: ConnectAccountRequest) {
    const response = await apiClient.post('/accounts/connect', data);
    return response.data;
  }

  // Update account
  static async updateAccount(accountId: string, data: UpdateAccountRequest) {
    const response = await apiClient.put(`/accounts/${accountId}`, data);
    return response.data;
  }

  // Disconnect account
  static async disconnectAccount(accountId: string) {
    await apiClient.delete(`/accounts/${accountId}`);
  }

  // Sync account manually
  static async syncAccount(accountId: string, data?: SyncAccountRequest) {
    const response = await apiClient.post(`/accounts/${accountId}/sync`, data || {});
    return response.data;
  }

  // Get account transactions
  static async getAccountTransactions(
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedAccountTransactions> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(`/accounts/${accountId}/transactions?${params.toString()}`);
    return response.data;
  }

  // Get supported providers
  static async getSupportedProviders(): Promise<OpenBankingProvider[]> {
    const response = await apiClient.get('/accounts/providers/supported');
    return response.data;
  }

  // Get auth URL for provider
  static async getAuthUrl(provider: string, data: AuthUrlRequest): Promise<AuthUrlResponse> {
    const response = await apiClient.post(`/accounts/providers/${provider}/auth-url`, data);
    return response.data;
  }

  // Get sync status
  static async getSyncStatus(): Promise<SyncStatus> {
    const response = await apiClient.get('/accounts/sync/status');
    return response.data;
  }

  // Sync all accounts
  static async syncAllAccounts() {
    const response = await apiClient.post('/accounts/sync/all');
    return response.data;
  }
}