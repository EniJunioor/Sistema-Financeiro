import { api } from './api';
import type { 
  Notification, 
  NotificationPreferences, 
  NotificationFilters, 
  NotificationStats,
  PushNotificationPayload 
} from '@/types/notification';

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface NotificationApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

class NotificationsApi {
  private baseUrl = '/notifications';

  // Get user notifications with pagination and filters
  async getNotifications(
    page = 1, 
    limit = 20, 
    filters?: NotificationFilters
  ): Promise<PaginatedNotifications> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<NotificationApiResponse<PaginatedNotifications>>(
      `${this.baseUrl}?${params}`
    );
    
    return response.data.data;
  }

  // Get notification statistics
  async getNotificationStats(): Promise<NotificationStats> {
    const response = await api.get<NotificationApiResponse<NotificationStats>>(
      `${this.baseUrl}/stats`
    );
    
    return response.data.data;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`${this.baseUrl}/${notificationId}/read`);
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    await api.patch(`${this.baseUrl}/mark-read`, {
      notificationIds,
    });
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await api.patch(`${this.baseUrl}/mark-all-read`);
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${notificationId}`);
  }

  // Delete multiple notifications
  async deleteMultiple(notificationIds: string[]): Promise<void> {
    await api.request({
      method: 'DELETE',
      url: `${this.baseUrl}/bulk-delete`,
      data: { notificationIds },
    });
  }

  // Clear all notifications
  async clearAll(): Promise<void> {
    await api.delete(`${this.baseUrl}/clear-all`);
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<NotificationApiResponse<NotificationPreferences>>(
      `${this.baseUrl}/preferences`
    );
    
    return response.data.data;
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await api.patch<NotificationApiResponse<NotificationPreferences>>(
      `${this.baseUrl}/preferences`,
      preferences
    );
    
    return response.data.data;
  }

  // Test notification (for settings page)
  async sendTestNotification(type: 'email' | 'push' | 'browser'): Promise<void> {
    await api.post(`${this.baseUrl}/test`, { type });
  }

  // Subscribe to push notifications
  async subscribeToPush(subscription: PushSubscription): Promise<void> {
    await api.post(`${this.baseUrl}/push/subscribe`, {
      subscription: subscription.toJSON(),
    });
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<void> {
    await api.post(`${this.baseUrl}/push/unsubscribe`);
  }

  // Send custom notification (admin/system use)
  async sendNotification(payload: {
    userId?: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    actionUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const response = await api.post<NotificationApiResponse<Notification>>(
      `${this.baseUrl}/send`,
      payload
    );
    
    return response.data.data;
  }

  // Get unread count (for badge display)
  async getUnreadCount(): Promise<number> {
    const response = await api.get<NotificationApiResponse<{ count: number }>>(
      `${this.baseUrl}/unread-count`
    );
    
    return response.data.data.count;
  }
}

export const notificationsApi = new NotificationsApi();