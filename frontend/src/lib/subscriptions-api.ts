import { apiClient } from './api';
import type { Account } from '@/types/transaction';

export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  nextPaymentDate: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  categoryId?: string | null;
  accountId?: string | null;
  logo?: string | null;
  description?: string | null;
  metadata?: string | null;
  createdAt: string;
  updatedAt: string;
  account?: Account | null;
}

export interface CreateSubscriptionData {
  name: string;
  amount: number;
  currency?: string;
  frequency: SubscriptionFrequency;
  nextPaymentDate: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  logo?: string;
  description?: string;
  metadata?: string;
}

export interface UpdateSubscriptionData {
  name?: string;
  amount?: number;
  frequency?: SubscriptionFrequency;
  nextPaymentDate?: string;
  endDate?: string;
  isActive?: boolean;
  categoryId?: string;
  accountId?: string;
  logo?: string;
  description?: string;
}

export interface SubscriptionFilters {
  isActive?: boolean;
  categoryId?: string;
  accountId?: string;
}

export class SubscriptionsAPI {
  static async getSubscriptions(filters: SubscriptionFilters = {}): Promise<Subscription[]> {
    const params = new URLSearchParams();

    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.accountId) params.append('accountId', filters.accountId);

    const response = await apiClient.get<Subscription[]>(`/subscriptions?${params.toString()}`);
    return response.data;
  }

  /** Assinaturas que vencem nos próximos `days` dias. */
  static async getUpcoming(days = 30): Promise<Subscription[]> {
    const response = await apiClient.get<Subscription[]>(`/subscriptions/upcoming?days=${days}`);
    return response.data;
  }

  static async getSubscription(id: string): Promise<Subscription> {
    const response = await apiClient.get<Subscription>(`/subscriptions/${id}`);
    return response.data;
  }

  static async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    const response = await apiClient.post<Subscription>('/subscriptions', data);
    return response.data;
  }

  static async updateSubscription(
    id: string,
    data: UpdateSubscriptionData,
  ): Promise<Subscription> {
    const response = await apiClient.patch<Subscription>(`/subscriptions/${id}`, data);
    return response.data;
  }

  static async deleteSubscription(id: string): Promise<void> {
    await apiClient.delete(`/subscriptions/${id}`);
  }
}

export default SubscriptionsAPI;
