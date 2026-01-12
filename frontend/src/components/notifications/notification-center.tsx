'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter, 
  Settings,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/components/providers/notification-provider';
import type { Notification, NotificationFilters } from '@/types/notification';
import Link from 'next/link';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    stats,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [filters, setFilters] = useState<NotificationFilters>({});

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread' && notification.isRead) return false;
    if (filters.type && notification.type !== filters.type) return false;
    return true;
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAll();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: Notification['type'], isRead: boolean) => {
    const opacity = isRead ? 'opacity-50' : '';
    switch (type) {
      case 'success':
        return `bg-green-50 border-green-200 ${opacity}`;
      case 'error':
        return `bg-red-50 border-red-200 ${opacity}`;
      case 'warning':
        return `bg-yellow-50 border-yellow-200 ${opacity}`;
      case 'info':
      default:
        return `bg-blue-50 border-blue-200 ${opacity}`;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('relative', className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Marcar todas como lidas
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilters({})}>
                      <Filter className="h-4 w-4 mr-2" />
                      Limpar filtros
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearAll} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar todas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings/notifications">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {stats && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{stats.total} total</span>
                <span>{stats.unread} não lidas</span>
                <span>{stats.recent} recentes</span>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
              <TabsList className="grid w-full grid-cols-2 mx-4 mb-4">
                <TabsTrigger value="all">
                  Todas ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Não lidas ({unreadCount})
                </TabsTrigger>
              </TabsList>
              
              <div className="px-4 mb-4">
                <div className="flex space-x-2">
                  <Button
                    variant={filters.type === undefined ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({})}
                    className="text-xs"
                  >
                    Todas
                  </Button>
                  <Button
                    variant={filters.type === 'info' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({ type: 'info' })}
                    className="text-xs"
                  >
                    Info
                  </Button>
                  <Button
                    variant={filters.type === 'success' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({ type: 'success' })}
                    className="text-xs"
                  >
                    Sucesso
                  </Button>
                  <Button
                    variant={filters.type === 'warning' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({ type: 'warning' })}
                    className="text-xs"
                  >
                    Aviso
                  </Button>
                  <Button
                    variant={filters.type === 'error' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({ type: 'error' })}
                    className="text-xs"
                  >
                    Erro
                  </Button>
                </div>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <NotificationList
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationBgColor={getNotificationBgColor}
                />
              </TabsContent>
              
              <TabsContent value="unread" className="mt-0">
                <NotificationList
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationBgColor={getNotificationBgColor}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getNotificationIcon: (type: Notification['type']) => React.ReactNode;
  getNotificationBgColor: (type: Notification['type'], isRead: boolean) => string;
}

function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onDelete,
  getNotificationIcon,
  getNotificationBgColor,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 px-4 pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <BellOff className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma notificação
        </h3>
        <p className="text-sm text-gray-500">
          Você está em dia! Não há notificações para mostrar.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-1 px-4 pb-4">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
            getNotificationIcon={getNotificationIcon}
            getNotificationBgColor={getNotificationBgColor}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getNotificationIcon: (type: Notification['type']) => React.ReactNode;
  getNotificationBgColor: (type: Notification['type'], isRead: boolean) => string;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  getNotificationIcon,
  getNotificationBgColor,
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm',
        getNotificationBgColor(notification.type, notification.isRead),
        !notification.isRead && 'ring-1 ring-blue-200'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className={cn(
              'text-sm font-medium',
              notification.isRead ? 'text-gray-600' : 'text-gray-900'
            )}>
              {notification.title}
            </h4>
            
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1" />
            )}
          </div>
          
          <p className={cn(
            'text-sm mt-1',
            notification.isRead ? 'text-gray-500' : 'text-gray-700'
          )}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            
            {notification.actionUrl && (
              <Link
                href={notification.actionUrl}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                Ver detalhes
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            )}
          </div>
        </div>
        
        {isHovered && (
          <div className="flex items-center space-x-1">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}