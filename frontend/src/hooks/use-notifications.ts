'use client';

import { useCallback } from 'react';
import { useNotifications as useNotificationContext } from '@/components/providers/notification-provider';
import type { ToastNotification } from '@/types/notification';

export function useNotifications() {
  const context = useNotificationContext();

  // Convenience methods for showing different types of toasts
  const showSuccess = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    context.showToast({
      title,
      message,
      type: 'success',
      duration: 5000,
      ...options,
    });
  }, [context]);

  const showError = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    context.showToast({
      title,
      message,
      type: 'error',
      duration: 8000,
      ...options,
    });
  }, [context]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    context.showToast({
      title,
      message,
      type: 'warning',
      duration: 6000,
      ...options,
    });
  }, [context]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    context.showToast({
      title,
      message,
      type: 'info',
      duration: 5000,
      ...options,
    });
  }, [context]);

  // Convenience method for showing notifications with actions
  const showWithActions = useCallback((
    title: string, 
    message: string, 
    actions: ToastNotification['actions'],
    options?: Partial<ToastNotification>
  ) => {
    context.showToast({
      title,
      message,
      type: 'info',
      actions,
      persistent: true,
      ...options,
    });
  }, [context]);

  // Method for showing confirmation notifications
  const showConfirmation = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: Partial<ToastNotification>
  ) => {
    context.showToast({
      title,
      message,
      type: 'warning',
      persistent: true,
      actions: [
        {
          label: 'Confirmar',
          action: onConfirm,
          variant: 'default',
        },
        {
          label: 'Cancelar',
          action: onCancel || (() => {}),
          variant: 'outline',
        },
      ],
      ...options,
    });
  }, [context]);

  // Method for showing loading notifications
  const showLoading = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return context.showToast({
      title,
      message,
      type: 'info',
      persistent: true,
      showProgress: false,
      ...options,
    });
  }, [context]);

  return {
    ...context,
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showWithActions,
    showConfirmation,
    showLoading,
  };
}

// Hook for browser notification permission
export function useBrowserNotifications() {
  const { requestPermission, subscribeToPush, unsubscribeFromPush } = useNotificationContext();

  const checkPermission = useCallback(() => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }, []);

  const isSupported = useCallback(() => {
    return 'Notification' in window;
  }, []);

  const isPushSupported = useCallback(() => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }, []);

  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/icons/notification-icon.png',
        badge: '/icons/notification-badge.png',
        ...options,
      });
    }
    return null;
  }, []);

  return {
    checkPermission,
    isSupported,
    isPushSupported,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showBrowserNotification,
  };
}

// Hook for notification statistics and analytics
export function useNotificationStats() {
  const { stats, notifications } = useNotificationContext();

  const getRecentNotifications = useCallback((hours = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return notifications.filter(n => new Date(n.createdAt) > cutoff);
  }, [notifications]);

  const getNotificationsByType = useCallback((type: 'info' | 'warning' | 'success' | 'error') => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  const getNotificationsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return notifications.filter(n => {
      const notificationDate = new Date(n.createdAt);
      return notificationDate >= startDate && notificationDate <= endDate;
    });
  }, [notifications]);

  return {
    stats,
    getRecentNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    getNotificationsByDateRange,
  };
}