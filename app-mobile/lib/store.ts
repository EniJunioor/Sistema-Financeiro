/**
 * Store de dados - local (AsyncStorage) ou API (backend NestJS) quando logado
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import * as Auth from "./_core/auth";
import * as Api from "./api-services";
import type {
  Transaction,
  Account,
  Investment,
  Goal,
  UserSettings,
  TransactionFormData,
  AccountFormData,
  GoalFormData,
  InvestmentFormData,
} from "./types";
import {
  SAMPLE_TRANSACTIONS,
  SAMPLE_ACCOUNTS,
  SAMPLE_INVESTMENTS,
  SAMPLE_GOALS,
} from "./sample-data";
import { generateId } from "./formatters";

const KEYS = {
  TRANSACTIONS: "@financeiro:transactions",
  ACCOUNTS: "@financeiro:accounts",
  INVESTMENTS: "@financeiro:investments",
  GOALS: "@financeiro:goals",
  SETTINGS: "@financeiro:settings",
  INITIALIZED: "@financeiro:initialized",
};

const DEFAULT_SETTINGS: UserSettings = {
  userName: "Usuário",
  currency: "BRL",
  hideBalances: false,
  notifications: true,
};

// Generic storage helpers
async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Initialize with sample data on first launch
export async function initializeStore(): Promise<void> {
  const initialized = await AsyncStorage.getItem(KEYS.INITIALIZED);
  if (!initialized) {
    await setItem(KEYS.TRANSACTIONS, SAMPLE_TRANSACTIONS);
    await setItem(KEYS.ACCOUNTS, SAMPLE_ACCOUNTS);
    await setItem(KEYS.INVESTMENTS, SAMPLE_INVESTMENTS);
    await setItem(KEYS.GOALS, SAMPLE_GOALS);
    await setItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    await AsyncStorage.setItem(KEYS.INITIALIZED, "true");
  }
}

// ============ HOOKS ============

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await Auth.getSessionToken();
      if (token) {
        const data = await Api.fetchTransactions({ limit: 500 });
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(data);
      } else {
        const data = await getItem<Transaction[]>(KEYS.TRANSACTIONS, []);
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(data);
      }
    } catch (e) {
      console.warn("[Store] fetch transactions failed, using local:", e);
      const data = await getItem<Transaction[]>(KEYS.TRANSACTIONS, []);
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
      const token = await Auth.getSessionToken();
      const form: TransactionFormData = {
        type: tx.type,
        amount: String(tx.amount),
        description: tx.description,
        date: tx.date,
        categoryId: tx.categoryId,
        accountId: tx.accountId,
      };
      if (token) {
        try {
          const newTx = await Api.createTransaction(form);
          setTransactions((prev) => [newTx, ...prev]);
          return newTx;
        } catch (e) {
          throw e;
        }
      }
      const now = new Date().toISOString();
      const newTx: Transaction = {
        ...tx,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newTx, ...transactions];
      await setItem(KEYS.TRANSACTIONS, updated);
      if (tx.accountId) {
        const accounts = await getItem<Account[]>(KEYS.ACCOUNTS, []);
        const accIdx = accounts.findIndex((a) => a.id === tx.accountId);
        if (accIdx >= 0) {
          if (tx.type === "income") accounts[accIdx].balance += tx.amount;
          else if (tx.type === "expense") accounts[accIdx].balance -= tx.amount;
          await setItem(KEYS.ACCOUNTS, accounts);
        }
      }
      setTransactions(updated);
      return newTx;
    },
    [transactions]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const token = await Auth.getSessionToken();
      if (token) {
        try {
          await Api.deleteTransaction(id);
          setTransactions((prev) => prev.filter((t) => t.id !== id));
        } catch (e) {
          throw e;
        }
      } else {
        const updated = transactions.filter((t) => t.id !== id);
        await setItem(KEYS.TRANSACTIONS, updated);
        setTransactions(updated);
      }
    },
    [transactions]
  );

  return { transactions, loading, addTransaction, deleteTransaction, reload: load };
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await Auth.getSessionToken();
      if (token) {
        const data = await Api.fetchAccounts();
        setAccounts(data);
      } else {
        const data = await getItem<Account[]>(KEYS.ACCOUNTS, []);
        setAccounts(data);
      }
    } catch (e) {
      console.warn("[Store] fetch accounts failed, using local:", e);
      const data = await getItem<Account[]>(KEYS.ACCOUNTS, []);
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addAccount = useCallback(
    async (acc: Omit<Account, "id" | "createdAt" | "updatedAt">) => {
      const form: AccountFormData = {
        name: acc.name,
        type: acc.type,
        balance: String(acc.balance),
        currency: acc.currency,
      };
      const token = await Auth.getSessionToken();
      if (token) {
        try {
          const newAcc = await Api.createAccount(form);
          setAccounts((prev) => [...prev, newAcc]);
          return newAcc;
        } catch (e) {
          throw e;
        }
      }
      const now = new Date().toISOString();
      const newAcc: Account = {
        ...acc,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...accounts, newAcc];
      await setItem(KEYS.ACCOUNTS, updated);
      setAccounts(updated);
      return newAcc;
    },
    [accounts]
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      const token = await Auth.getSessionToken();
      if (token) {
        try {
          await Api.deleteAccount(id);
          setAccounts((prev) => prev.filter((a) => a.id !== id));
        } catch (e) {
          throw e;
        }
      } else {
        const updated = accounts.filter((a) => a.id !== id);
        await setItem(KEYS.ACCOUNTS, updated);
        setAccounts(updated);
      }
    },
    [accounts]
  );

  const totalBalance = accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  return { accounts, loading, addAccount, deleteAccount, totalBalance, reload: load };
}

export function useInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await Auth.getSessionToken();
      if (token) {
        const data = await Api.fetchInvestments();
        setInvestments(data);
      } else {
        const data = await getItem<Investment[]>(KEYS.INVESTMENTS, []);
        setInvestments(data);
      }
    } catch (e) {
      console.warn("[Store] fetch investments failed, using local:", e);
      const data = await getItem<Investment[]>(KEYS.INVESTMENTS, []);
      setInvestments(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addInvestment = useCallback(
    async (inv: Omit<Investment, "id" | "createdAt" | "updatedAt">) => {
      const form: InvestmentFormData = {
        symbol: inv.symbol,
        name: inv.name,
        type: inv.type,
        quantity: String(inv.quantity),
        averagePrice: String(inv.averagePrice),
        broker: inv.broker,
      };
      const token = await Auth.getSessionToken();
      if (token) {
        try {
          const newInv = await Api.createInvestment(form);
          setInvestments((prev) => [...prev, newInv]);
          return newInv;
        } catch (e) {
          throw e;
        }
      }
      const now = new Date().toISOString();
      const newInv: Investment = {
        ...inv,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...investments, newInv];
      await setItem(KEYS.INVESTMENTS, updated);
      setInvestments(updated);
      return newInv;
    },
    [investments]
  );

  const deleteInvestment = useCallback(
    async (id: string) => {
      const token = await Auth.getSessionToken();
      if (token) {
        try {
          await Api.deleteInvestment(id);
          setInvestments((prev) => prev.filter((i) => i.id !== id));
        } catch (e) {
          throw e;
        }
      } else {
        const updated = investments.filter((i) => i.id !== id);
        await setItem(KEYS.INVESTMENTS, updated);
        setInvestments(updated);
      }
    },
    [investments]
  );

  const totalInvested = investments.reduce(
    (sum, i) => sum + i.quantity * i.averagePrice,
    0
  );
  const totalCurrent = investments.reduce(
    (sum, i) => sum + i.quantity * i.currentPrice,
    0
  );
  const totalGain = totalCurrent - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return {
    investments,
    loading,
    addInvestment,
    deleteInvestment,
    totalInvested,
    totalCurrent,
    totalGain,
    totalGainPercent,
    reload: load,
  };
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await Auth.getSessionToken();
      if (token) {
        const data = await Api.fetchGoals();
        setGoals(data);
      } else {
        const data = await getItem<Goal[]>(KEYS.GOALS, []);
        setGoals(data);
      }
    } catch (e) {
      console.warn("[Store] fetch goals failed, using local:", e);
      const data = await getItem<Goal[]>(KEYS.GOALS, []);
      setGoals(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addGoal = useCallback(
    async (goal: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
      const form: GoalFormData = {
        name: goal.name,
        description: goal.description,
        type: goal.type,
        targetAmount: String(goal.targetAmount),
        currentAmount: String(goal.currentAmount),
        targetDate: goal.targetDate,
      };
      const token = await Auth.getSessionToken();
      if (token) {
        try {
          const newGoal = await Api.createGoal(form);
          setGoals((prev) => [...prev, newGoal]);
          return newGoal;
        } catch (e) {
          throw e;
        }
      }
      const now = new Date().toISOString();
      const newGoal: Goal = {
        ...goal,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...goals, newGoal];
      await setItem(KEYS.GOALS, updated);
      setGoals(updated);
      return newGoal;
    },
    [goals]
  );

  const updateGoal = useCallback(
    async (id: string, updates: Partial<Goal>) => {
      const token = await Auth.getSessionToken();
      if (token) {
        try {
          const updatedGoal = await Api.updateGoal(id, updates);
          setGoals((prev) => prev.map((g) => (g.id === id ? updatedGoal : g)));
        } catch (e) {
          throw e;
        }
      } else {
        const updated = goals.map((g) =>
          g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
        );
        await setItem(KEYS.GOALS, updated);
        setGoals(updated);
      }
    },
    [goals]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const token = await Auth.getSessionToken();
      if (token) {
        try {
          await Api.deleteGoal(id);
          setGoals((prev) => prev.filter((g) => g.id !== id));
        } catch (e) {
          throw e;
        }
      } else {
        const updated = goals.filter((g) => g.id !== id);
        await setItem(KEYS.GOALS, updated);
        setGoals(updated);
      }
    },
    [goals]
  );

  return { goals, loading, addGoal, updateGoal, deleteGoal, reload: load };
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getItem<UserSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
      // Se logado, usar nome do usuário autenticado
      const userInfo = await Auth.getUserInfo();
      if (userInfo?.name) {
        setSettings({ ...data, userName: userInfo.name });
      } else {
        setSettings(data);
      }
      setLoading(false);
    })();
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      const updated = { ...settings, ...updates };
      await setItem(KEYS.SETTINGS, updated);
      setSettings(updated);
    },
    [settings]
  );

  return { settings, loading, updateSettings };
}
