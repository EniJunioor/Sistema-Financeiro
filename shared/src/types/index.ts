// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified?: Date;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction types
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
  tags: string[];
  isRecurring: boolean;
  recurringRule?: any;
  attachments: string[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Account types
export interface Account {
  id: string;
  userId: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  provider?: string;
  providerAccountId?: string;
  name: string;
  balance: number;
  currency: string;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Investment types
export interface Investment {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  type: 'stock' | 'fund' | 'etf' | 'crypto' | 'bond';
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  currency: string;
  broker?: string;
  sector?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Goal types
export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'savings' | 'spending_limit' | 'investment';
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  categoryId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}