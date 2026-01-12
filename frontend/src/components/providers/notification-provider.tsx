'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/notifications-api';
import { getDashboardWebSocket } from '@/lib/websocket';
import type { 
  Notification, 
  NotificationPreferences, 
  NotificationStats,
  ToastNotification,
  NotificationSettings,
  NotificationWebSocketMessage
} from '@/types/notification';

interface NotificationContextType {
  // Notifications data
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  settings: NotificationSettings;
  
  // Loading states
  isLoading: boolean;
  isLoadingPreferences: boolean;
  
  // Toast notifications
  toasts: ToastNotification[];
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Toast actions
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  dismissToast: (toastId: string) => void;
  clearToasts: () => void;
  
  // Push notifications
  requestPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<void>;
  
  // Real-time updates
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    sound: true,
    vibration: true,
    showPreview: true,
    autoHide: true,
    autoHideDuration: 5000,
    position: 'top-right',
    maxVisible: 5,
  });

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(1, 50),
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: () => notificationsApi.getNotificationStats(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => notificationsApi.getPreferences(),
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: notificationsApi.clearAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    },
  });

  // WebSocket setup for real-time notifications
  useEffect(() => {
    const ws = getDashboardWebSocket();
    
    const handleMessage = (message: any) => {
      if (message.type.startsWith('notification_')) {
        const notificationMessage = message as NotificationWebSocketMessage;
        
        switch (notificationMessage.type) {
          case 'notification_created':
            // Add new notification to the list
            queryClient.setQueryData(['notifications'], (old: any) => {
              if (!old) return old;
              return {
                ...old,
                notifications: [notificationMessage.data, ...old.notifications],
                total: old.total + 1,
              };
            });
            
            // Update unread count
            queryClient.setQueryData(['notifications', 'unread-count'], (old: number = 0) => old + 1);
            
            // Show toast notification if enabled
            if (settings.showPreview) {
              showToast({
                title: notificationMessage.data.title,
                message: notificationMessage.data.message,
                type: notificationMessage.data.type,
                actionUrl: notificationMessage.data.actionUrl,
                duration: settings.autoHide ? settings.autoHideDuration : undefined,
              });
            }
            
            // Show browser notification if permission granted
            if (Notification.permission === 'granted' && preferences?.browserNotifications) {
              new Notification(notificationMessage.data.title, {
                body: notificationMessage.data.message,
                icon: '/icons/notification-icon.png',
                tag: notificationMessage.data.id,
                data: { actionUrl: notificationMessage.data.actionUrl },
              });
            }
            break;
            
          case 'notification_read':
            // Update notification read status
            queryClient.setQueryData(['notifications'], (old: any) => {
              if (!old) return old;
              return {
                ...old,
                notifications: old.notifications.map((n: Notification) =>
                  n.id === notificationMessage.data.id ? { ...n, isRead: true } : n
                ),
              };
            });
            
            // Update unread count
            queryClient.setQueryData(['notifications', 'unread-count'], (old: number = 0) => Math.max(0, old - 1));
            break;
            
          case 'notification_deleted':
            // Remove notification from list
            queryClient.setQueryData(['notifications'], (old: any) => {
              if (!old) return old;
              return {
                ...old,
                notifications: old.notifications.filter((n: Notification) => n.id !== notificationMessage.data.id),
                total: old.total - 1,
              };
            });
            break;
        }
        
        // Invalidate stats to keep them fresh
        queryClient.invalidateQueries({ queryKey: ['notifications', 'stats'] });
      }
    };

    ws.addListener(handleMessage);
    ws.connect();
    setIsConnected(ws.isConnected());

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      setIsConnected(ws.isConnected());
    }, 5000);

    return () => {
      ws.removeListener(handleMessage);
      clearInterval(connectionCheck);
    };
  }, [queryClient, settings, preferences]);

  // Toast management
  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastNotification = { ...toast, id };
    
    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit number of visible toasts
      return updated.slice(0, settings.maxVisible);
    });

    // Auto-hide toast if duration is specified
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, toast.duration);
    }
  }, [settings.maxVisible]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Push notification functions
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await notificationsApi.subscribeToPush(subscription);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }, []);

  const unsubscribeFromPush = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await notificationsApi.unsubscribeFromPush();
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }, []);

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Persist to localStorage
    localStorage.setItem('notification-settings', JSON.stringify({ ...settings, ...newSettings }));
  }, [settings]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved notification settings:', error);
      }
    }
  }, []);

  const value: NotificationContextType = {
    // Data
    notifications: notificationsData?.notifications || [],
    unreadCount,
    stats: stats || null,
    preferences: preferences || null,
    settings,
    
    // Loading states
    isLoading,
    isLoadingPreferences,
    
    // Toast notifications
    toasts,
    
    // Actions
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    clearAll: clearAllMutation.mutateAsync,
    updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
      await updatePreferencesMutation.mutateAsync(preferences);
    },
    updateSettings,
    
    // Toast actions
    showToast,
    dismissToast,
    clearToasts,
    
    // Push notifications
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    
    // Real-time
    isConnected,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}