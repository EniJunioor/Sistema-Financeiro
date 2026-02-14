/**
 * Tipos TypeScript para o App Financeiro
 */

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  accountId?: string;
  tags: string[];
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = "checking" | "savings" | "credit_card" | "investment";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InvestmentType = "stock" | "fund" | "etf" | "crypto" | "bond";

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currency: string;
  broker?: string;
  sector?: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalType = "savings" | "spending_limit" | "investment";

export interface Goal {
  id: string;
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface UserSettings {
  userName: string;
  currency: string;
  hideBalances: boolean;
  notifications: boolean;
}

// Form types
export interface TransactionFormData {
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
  categoryId: string;
  accountId?: string;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  balance: string;
  currency: string;
}

export interface InvestmentFormData {
  symbol: string;
  name: string;
  type: InvestmentType;
  quantity: string;
  averagePrice: string;
  broker?: string;
}

export interface GoalFormData {
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: string;
  currentAmount: string;
  deadline?: string;
  targetDate?: string;
}
