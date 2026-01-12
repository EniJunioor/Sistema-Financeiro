export interface Transaction {
  id: string;
  userId: string;
  accountId?: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  location?: string;
  tags: string[];
  isRecurring: boolean;
  recurringRule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    nextDate?: string;
  };
  parentTransactionId?: string;
  attachments: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  category?: Category;
  parentTransaction?: Transaction;
  childTransactions?: Transaction[];
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  balance: number;
  currency: string;
  isActive: boolean;
  provider?: string;
  providerAccountId?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string;
  isSystem: boolean;
  parent?: Category;
  children?: Category[];
}

export interface TransactionFilters {
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTransactionData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  accountId?: string;
  categoryId?: string;
  tags?: string[];
  location?: string;
  isRecurring?: boolean;
  recurringRule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    nextDate?: string;
  };
  attachments?: string[];
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {
  id: string;
}

export interface CategorySuggestion {
  categoryId: string;
  category: Category;
  confidence: number;
  reason: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  accountId?: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  location?: string;
  tags: string[];
  recurringRule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    nextDate?: string;
  };
  attachments: string[];
  metadata?: Record<string, any>;
  nextDate: string;
  isActive: boolean;
  account?: Account;
  category?: Category;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}