/**
 * Serviços de API para integração com backend NestJS
 */
import { apiCall } from "./_core/api";
import type {
  Transaction,
  Account,
  Goal,
  Investment,
  TransactionFormData,
  AccountFormData,
  GoalFormData,
  InvestmentFormData,
} from "./types";

const BASE = "api/v1";

// ─── Helpers para mapear resposta da API ───
function mapTransaction(raw: any): Transaction {
  const date = typeof raw.date === "string" ? raw.date : raw.date?.toISOString?.() ?? new Date().toISOString();
  return {
    id: raw.id,
    type: raw.type,
    amount: Number(raw.amount),
    description: raw.description,
    date,
    categoryId: raw.categoryId ?? raw.category?.id ?? "",
    accountId: raw.accountId ?? raw.account?.id,
    tags: Array.isArray(raw.tags) ? raw.tags : (raw.tags ? JSON.parse(raw.tags) : []),
    isRecurring: !!raw.isRecurring,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

function mapAccount(raw: any): Account {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    balance: Number(raw.balance ?? 0),
    currency: raw.currency ?? "BRL",
    isActive: raw.isActive !== false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

function mapGoal(raw: any): Goal {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    type: raw.type,
    targetAmount: Number(raw.targetAmount ?? 0),
    currentAmount: Number(raw.currentAmount ?? 0),
    targetDate: raw.targetDate,
    isActive: raw.isActive !== false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

function mapInvestment(raw: any): Investment {
  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    type: raw.type,
    quantity: Number(raw.quantity ?? 0),
    averagePrice: Number(raw.averagePrice ?? 0),
    currentPrice: Number(raw.currentPrice ?? raw.averagePrice ?? 0),
    currency: raw.currency ?? "BRL",
    broker: raw.broker,
    sector: raw.sector,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

// ─── Transações ───
export async function fetchTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Transaction[]> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit ?? 100));
  if (params?.type) q.set("type", params.type);
  if (params?.startDate) q.set("startDate", params.startDate);
  if (params?.endDate) q.set("endDate", params.endDate);
  const res = await apiCall<{ data?: any[]; meta?: any }>(
    `${BASE}/transactions?${q.toString()}`
  );
  const data = (res as any).data ?? (Array.isArray(res) ? res : []);
  return (data ?? []).map(mapTransaction);
}

export async function createTransaction(form: TransactionFormData): Promise<Transaction> {
  // categoryId do sample-data (cat-1, cat-10) não é válido no backend; enviar undefined para auto-categorização
  const catId = form.categoryId && !form.categoryId.startsWith("cat-") ? form.categoryId : undefined;
  const body = {
    type: form.type,
    amount: parseFloat(form.amount) || 0,
    description: form.description,
    date: form.date || new Date().toISOString(),
    categoryId: catId,
    accountId: form.accountId || undefined,
  };
  const raw = await apiCall<any>(`${BASE}/transactions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapTransaction(raw);
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiCall(`${BASE}/transactions/${id}`, { method: "DELETE" });
}

// ─── Categorias ───
export async function fetchCategories(): Promise<{ id: string; name: string; icon?: string; color?: string }[]> {
  const res = await apiCall<any[]>(`${BASE}/transactions/categories`);
  const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
  return list.map((c: any) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
  }));
}

// ─── Contas ───
export async function fetchAccounts(): Promise<Account[]> {
  const res = await apiCall<{ accounts?: any[] }>(`${BASE}/accounts`);
  const list = (res as any).accounts ?? (Array.isArray(res) ? res : []);
  return list.map(mapAccount);
}

export async function createAccount(form: AccountFormData): Promise<Account> {
  const body = {
    name: form.name,
    type: form.type,
    balance: parseFloat(form.balance) || 0,
    currency: form.currency ?? "BRL",
  };
  const raw = await apiCall<any>(`${BASE}/accounts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapAccount(raw);
}

export async function deleteAccount(id: string): Promise<void> {
  await apiCall(`${BASE}/accounts/${id}`, { method: "DELETE" });
}

// ─── Metas ───
export async function fetchGoals(): Promise<Goal[]> {
  const res = await apiCall<any[]>(`${BASE}/goals`);
  const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
  return list.map(mapGoal);
}

export async function createGoal(form: GoalFormData): Promise<Goal> {
  const body = {
    name: form.name,
    description: form.description,
    type: form.type ?? "savings",
    targetAmount: parseFloat(form.targetAmount) || 0,
    targetDate: form.targetDate ?? form.deadline,
    isActive: true,
  };
  const raw = await apiCall<any>(`${BASE}/goals`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapGoal(raw);
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
  const raw = await apiCall<any>(`${BASE}/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return mapGoal(raw);
}

export async function deleteGoal(id: string): Promise<void> {
  await apiCall(`${BASE}/goals/${id}`, { method: "DELETE" });
}

// ─── Investimentos ───
export async function fetchInvestments(): Promise<Investment[]> {
  const res = await apiCall<any[]>(`${BASE}/investments`);
  const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
  return list.map(mapInvestment);
}

export async function createInvestment(form: InvestmentFormData): Promise<Investment> {
  const body = {
    symbol: form.symbol,
    name: form.name,
    type: form.type,
    quantity: parseFloat(form.quantity) || 0,
    averagePrice: parseFloat(form.averagePrice) || 0,
    broker: form.broker,
  };
  const raw = await apiCall<any>(`${BASE}/investments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapInvestment(raw);
}

export async function deleteInvestment(id: string): Promise<void> {
  await apiCall(`${BASE}/investments/${id}`, { method: "DELETE" });
}

// ─── Câmbio (público, não requer auth) ───
export interface CurrencyRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const FRANKFURTER_URL = "https://api.frankfurter.app";

export async function fetchCurrenciesRates(
  base = "BRL",
  symbols = "USD,EUR,CAD"
): Promise<CurrencyRates> {
  try {
    const q = new URLSearchParams({ base, symbols });
    const res = await apiCall<CurrencyRates>(`${BASE}/currencies/rates?${q.toString()}`);
    return res;
  } catch {
    // Fallback: chamar Frankfurter diretamente (quando backend indisponível)
    try {
      const url = `${FRANKFURTER_URL}/latest?from=${base}&to=${symbols}`;
      const res = await fetch(url);
      const data = await res.json();
      return {
        base: data.base ?? base,
        date: data.date ?? new Date().toISOString().slice(0, 10),
        rates: data.rates ?? {},
      };
    } catch {
      return { base: "BRL", date: new Date().toISOString().slice(0, 10), rates: {} };
    }
  }
}
