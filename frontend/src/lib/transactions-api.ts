import apiClient from './api';
import type {
  Transaction,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  PaginatedTransactions,
  Category,
  Account,
  CategorySuggestion,
  ImportResult,
  RecurringTransaction,
  QueueStats,
} from '@/types/transaction';

export class TransactionsAPI {
  // Transaction CRUD operations
  static async getTransactions(filters: TransactionFilters = {}): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get<PaginatedTransactions>(`/transactions?${params.toString()}`);
    return response.data;
  }

  static async getTransaction(id: string): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  }

  static async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const response = await apiClient.post<Transaction>('/transactions', data);
    return response.data;
  }

  static async updateTransaction(data: UpdateTransactionData): Promise<Transaction> {
    const { id, ...updateData } = data;
    const response = await apiClient.put<Transaction>(`/transactions/${id}`, updateData);
    return response.data;
  }

  static async deleteTransaction(id: string): Promise<void> {
    await apiClient.delete(`/transactions/${id}`);
  }

  // Category operations
  static async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  }

  static async createCategory(data: { name: string; icon?: string; color?: string; parentId?: string }): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
  }

  static async suggestCategory(description: string, amount: number): Promise<CategorySuggestion[]> {
    const response = await apiClient.post<CategorySuggestion[]>('/transactions/suggest-category', {
      description,
      amount,
    });
    return response.data;
  }

  // Account operations
  static async getAccounts(): Promise<Account[]> {
    const response = await apiClient.get<Account[]>('/accounts');
    return response.data;
  }

  // File upload operations
  static async uploadAttachment(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ url: string; filename: string }>('/transactions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  static async processOCR(file: File): Promise<{
    amount?: number;
    description?: string;
    date?: string;
    merchant?: string;
    confidence: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{
      amount?: number;
      description?: string;
      date?: string;
      merchant?: string;
      confidence: number;
    }>('/transactions/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Import operations
  static async importFromCSV(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ImportResult>('/transactions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Bulk operations
  static async bulkCategorize(transactionIds: string[], categoryId: string): Promise<void> {
    await apiClient.post('/transactions/bulk-categorize', {
      transactionIds,
      categoryId,
    });
  }

  static async bulkDelete(transactionIds: string[]): Promise<void> {
    await apiClient.post('/transactions/bulk-delete', {
      transactionIds,
    });
  }

  // Recurring transactions operations
  static async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    const response = await apiClient.get<RecurringTransaction[]>('/transactions/recurring');
    return response.data;
  }

  static async updateRecurringTransaction(id: string, data: Partial<CreateTransactionData>): Promise<void> {
    await apiClient.patch(`/transactions/recurring/${id}`, data);
  }

  static async cancelRecurringTransaction(id: string): Promise<void> {
    await apiClient.delete(`/transactions/recurring/${id}`);
  }

  static async triggerRecurringProcessing(): Promise<void> {
    await apiClient.post('/transactions/recurring/process');
  }

  static async getQueueStats(): Promise<QueueStats> {
    const response = await apiClient.get<QueueStats>('/transactions/recurring/queue-stats');
    return response.data;
  }
}