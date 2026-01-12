export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  balance: number;
  currency: string;
  provider: string;
  providerAccountId: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  date: string;
  type: 'debit' | 'credit';
  category?: string;
  merchant?: string;
  location?: string;
  balance?: number;
  pending: boolean;
  createdAt: string;
  updatedAt: string;
}