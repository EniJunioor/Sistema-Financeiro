/**
 * Configurações da aplicação mobile
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
export const API_VERSION = '/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY_2FA: '/auth/2fa/verify',
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    CREATE: '/transactions',
    UPDATE: (id: string) => `/transactions/${id}`,
    DELETE: (id: string) => `/transactions/${id}`,
    UPLOAD_RECEIPT: '/transactions/upload-receipt',
  },
  ACCOUNTS: {
    LIST: '/accounts',
    CONNECT: '/accounts/connect',
    SYNC: (id: string) => `/accounts/${id}/sync`,
  },
  INVESTMENTS: {
    LIST: '/investments',
    PORTFOLIO: '/investments/portfolio',
  },
  GOALS: {
    LIST: '/goals',
    CREATE: '/goals',
  },
  PIX: {
    GENERATE_QR: '/pix/generate-qr',
    PAY: '/pix/pay',
    HISTORY: '/pix/history',
  },
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  OFFLINE_QUEUE: 'offline_queue',
} as const;

export const APP_CONFIG = {
  SYNC_INTERVAL: 2 * 60 * 60 * 1000, // 2 horas
  OFFLINE_QUEUE_LIMIT: 100,
  MAX_RECEIPT_SIZE: 10 * 1024 * 1024, // 10MB
  LOCATION_ACCURACY: {
    HIGH: 0,
    MEDIUM: 100,
    LOW: 1000,
  },
} as const;
