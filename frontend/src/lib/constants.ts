export const APP_NAME = 'Plataforma Financeira'
export const APP_DESCRIPTION = 'Gestão financeira pessoal e de pequenos negócios'

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  REGISTER: '/register',
  TRANSACTIONS: '/transactions',
  INVESTMENTS: '/investments',
  GOALS: '/goals',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    CREATE: '/transactions',
    UPDATE: (id: string) => `/transactions/${id}`,
    DELETE: (id: string) => `/transactions/${id}`,
  },
  INVESTMENTS: {
    LIST: '/investments',
    CREATE: '/investments',
    UPDATE: (id: string) => `/investments/${id}`,
    DELETE: (id: string) => `/investments/${id}`,
  },
  GOALS: {
    LIST: '/goals',
    CREATE: '/goals',
    UPDATE: (id: string) => `/goals/${id}`,
    DELETE: (id: string) => `/goals/${id}`,
  },
} as const

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
} as const

export const INVESTMENT_TYPES = {
  STOCK: 'stock',
  FUND: 'fund',
  ETF: 'etf',
  CRYPTO: 'crypto',
  BOND: 'bond',
} as const

export const GOAL_TYPES = {
  SAVINGS: 'savings',
  SPENDING_LIMIT: 'spending_limit',
  INVESTMENT: 'investment',
} as const