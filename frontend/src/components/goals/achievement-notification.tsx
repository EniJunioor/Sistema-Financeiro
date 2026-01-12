'use client';

import { useState, useEffect } from 'react';
import { Trophy, X, Sparkles, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'badge' | 'level_up' | 'goal_completed' | 'streak' | 'milestone';
  points?: number;
  level?: number;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

export function AchievementNotification({ 
  achievement, 
  onDismiss, 
  autoHide = true, 
  duration = 5000 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsAnimating(true), 100);
    
    // Auto-hide after duration
    if (autoHide) {
      const hideTimer = setTimeout(() => {
        handleDismiss();
      }, duration);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [autoHide, duration]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  const getTypeConfig = (type: Achievement['type']) => {
    switch (type) {
      case 'badge':
        return {
          bgColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
          textColor: 'text-white',
          borderColor: 'border-yellow-300',
          icon: Trophy,
          label: 'Badge Conquistado!',
        };
      case 'level_up':
        return {
          bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
          textColor: 'text-white',
          borderColor: 'border-purple-300',
          icon: Star,
          label: 'Nível Aumentado!',
        };
      case 'goal_completed':
        return {
          bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
          textColor: 'text-white',
          borderColor: 'border-green-300',
          icon: Trophy,
          label: 'Meta Concluída!',
        };
      case 'streak':
        return {
          bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
          textColor: 'text-white',
          borderColor: 'border-orange-300',
          icon: Sparkles,
          label: 'Sequência Mantida!',
        };
      case 'milestone':
        return {
          bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          textColor: 'text-white',
          borderColor: 'border-blue-300',
          icon: Star,
          label: 'Marco Alcançado!',
        };
      default:
        return {
          bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
          textColor: 'text-white',
          borderColor: 'border-gray-300',
          icon: Trophy,
          label: 'Conquista!',
        };
    }
  };

  if (!isVisible) return null;

  const config = getTypeConfig(achievement.type);
  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card 
        className={cn(
          'w-80 shadow-2xl border-2 transform transition-all duration-300 ease-out',
          config.borderColor,
          isAnimating 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
        )}
      >
        <CardContent className={cn('p-0 overflow-hidden', config.bgColor)}>
          <div className="relative p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/20" />
              <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/10" />
              <div className="absolute top-1/2 left-1/4 w-4 h-4 rounded-full bg-white/15" />
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Content */}
            <div className="relative">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white border-white/30 text-xs"
                    >
                      {config.label}
                    </Badge>
                    {achievement.points && (
                      <Badge 
                        variant="secondary" 
                        className="bg-white/20 text-white border-white/30 text-xs"
                      >
                        +{achievement.points} XP
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className={cn('font-semibold text-lg mb-1', config.textColor)}>
                    {achievement.title}
                  </h3>
                  
                  <p className={cn('text-sm opacity-90', config.textColor)}>
                    {achievement.description}
                  </p>

                  {achievement.level && (
                    <div className="mt-2">
                      <p className={cn('text-sm font-medium', config.textColor)}>
                        Nível {achievement.level} alcançado!
                      </p>
                    </div>
                  )}
                </div>

                {/* Achievement icon/emoji */}
                <div className="flex-shrink-0">
                  <div className="text-3xl">
                    {achievement.icon}
                  </div>
                </div>
              </div>

              {/* Celebration animation */}
              <div className="absolute -top-2 -right-2 pointer-events-none">
                <div className="animate-bounce">
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar for auto-hide */}
          {autoHide && (
            <div className="h-1 bg-white/20">
              <div 
                className="h-full bg-white/40 transition-all ease-linear"
                style={{
                  width: '100%',
                  animation: `shrink ${duration}ms linear forwards`,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Hook for managing achievement notifications
export function useAchievementNotifications() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const showAchievement = (achievement: Achievement) => {
    setAchievements(prev => [...prev, achievement]);
  };

  const dismissAchievement = (achievementId: string) => {
    setAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  const clearAll = () => {
    setAchievements([]);
  };

  return {
    achievements,
    showAchievement,
    dismissAchievement,
    clearAll,
  };
}

// Achievement Notifications Container
interface AchievementNotificationsProps {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}

export function AchievementNotifications({ 
  achievements, 
  onDismiss 
}: AchievementNotificationsProps) {
  return (
    <>
      {achievements.map((achievement, index) => (
        <div
          key={achievement.id}
          style={{ 
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index,
          }}
        >
          <AchievementNotification
            achievement={achievement}
            onDismiss={() => onDismiss(achievement.id)}
          />
        </div>
      ))}
    </>
  );
}