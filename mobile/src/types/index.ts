/**
 * Tipos TypeScript compartilhados para o app mobile
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  twoFactorEnabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  category?: Category;
  accountId?: string;
  account?: Account;
  location?: Location;
  tags: string[];
  attachments: string[];
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  balance: number;
  currency: string;
  provider?: string;
  isActive: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
}

export interface Receipt {
  id: string;
  transactionId: string;
  imageUri: string;
  ocrData?: OCRData;
  createdAt: string;
}

export interface OCRData {
  merchant?: string;
  amount?: number;
  date?: string;
  items?: string[];
  confidence: number;
}

export interface PIXPayment {
  id: string;
  amount: number;
  recipient: string;
  description?: string;
  qrCode?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface OfflineAction {
  id: string;
  type: 'create_transaction' | 'update_transaction' | 'delete_transaction';
  data: any;
  timestamp: number;
  retries: number;
}

export interface AppState {
  isOnline: boolean;
  isAuthenticated: boolean;
  user: User | null;
  syncInProgress: boolean;
}
