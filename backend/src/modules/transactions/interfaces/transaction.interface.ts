export interface PaginatedTransactions {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  accountId?: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: Date;
  location?: string;
  tags?: string[];
  isRecurring: boolean;
  recurringRule?: string;
  attachments?: string[];
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
  account?: {
    id: string;
    name: string;
    type: string;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  averageTransaction: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
    count: number;
  }[];
}