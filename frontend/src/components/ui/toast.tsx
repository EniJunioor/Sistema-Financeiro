'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ToastNotification } from '@/types/notification';

interface ToastProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  index: number;
}

export function Toast({ toast, onDismiss, position, index }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration && toast.duration > 0 && toast.showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration! / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            handleDismiss();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.duration, toast.showProgress]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  };

  const getTypeConfig = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          icon: CheckCircle,
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          icon: AlertCircle,
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: AlertTriangle,
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: Info,
        };
    }
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 transition-all duration-300 ease-out';
    
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-4 right-4 transform ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`;
      case 'top-left':
        return `${baseClasses} top-4 left-4 transform ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4 transform ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4 transform ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`;
      case 'top-center':
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`;
      case 'bottom-center':
        return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  const offset = 10; // Stack toasts with slight offset
  const config = getTypeConfig(toast.type);
  const Icon = config.icon;

  return (
    <div 
      className={getPositionClasses()}
      style={{ 
        transform: `translateY(${index * offset}px)`,
        zIndex: 50 - index,
      }}
    >
      <Card className={cn('w-80 shadow-lg border', config.bgColor)}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={cn('font-medium text-sm mb-1', config.textColor)}>
                {toast.title}
              </h4>
              <p className={cn('text-sm opacity-90', config.textColor)}>
                {toast.message}
              </p>
              
              {toast.actions && toast.actions.length > 0 && (
                <div className="flex space-x-2 mt-3">
                  {toast.actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={() => {
                        action.action();
                        if (!toast.persistent) {
                          handleDismiss();
                        }
                      }}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {!toast.persistent && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {toast.showProgress && toast.duration && toast.duration > 0 && (
            <div className="mt-3">
              <Progress value={progress} className="h-1" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastContainer({ toasts, onDismiss, position }: ToastContainerProps) {
  return (
    <>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          position={position}
          index={index}
        />
      ))}
    </>
  );
}