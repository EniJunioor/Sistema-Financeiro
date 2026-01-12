export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  browserNotifications: boolean;
  smsNotifications: boolean;
  categories: {
    transactions: boolean;
    goals: boolean;
    investments: boolean;
    security: boolean;
    marketing: boolean;
    system: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
  updatedAt: string;
}

export interface NotificationSettings {
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
  autoHide: boolean;
  autoHideDuration: number; // in milliseconds
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible: number;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  duration?: number;
  actionUrl?: string;
  actions?: NotificationAction[];
  persistent?: boolean;
  showProgress?: boolean;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface NotificationFilters {
  type?: 'info' | 'warning' | 'success' | 'error';
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    info: number;
    warning: number;
    success: number;
    error: number;
  };
  recent: number; // notifications from last 24h
}

// WebSocket notification message types
export interface NotificationWebSocketMessage {
  type: 'notification_created' | 'notification_updated' | 'notification_deleted' | 'notification_read';
  data: Notification;
  timestamp: string;
}

// Push notification payload
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

// Notification categories for better organization
export type NotificationCategory = 
  | 'transaction'
  | 'goal'
  | 'investment'
  | 'security'
  | 'system'
  | 'marketing'
  | 'anomaly'
  | 'reminder';

export interface CategorizedNotification extends Notification {
  category: NotificationCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
}