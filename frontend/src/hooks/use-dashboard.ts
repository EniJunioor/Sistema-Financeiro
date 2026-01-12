'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardAPI, type AnalyticsQuery } from '@/lib/dashboard-api';
import type { DashboardData, FinancialSummary, TrendAnalysis, PeriodComparison, WebSocketMessage } from '@/types/dashboard';

export function useDashboard(initialQuery: AnalyticsQuery = {}) {
  const [query, setQuery] = useState<AnalyticsQuery>(initialQuery);
  const queryClient = useQueryClient();

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useQuery<DashboardData | null>({
    queryKey: ['dashboard', query],
    queryFn: async () => {
      try {
        return await DashboardAPI.getDashboardData(query);
      } catch (error: any) {
        // If authentication fails or API is not available, return null
        // The component will use mock data instead
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          console.warn('Dashboard API not available, using mock data');
          return null;
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false, // Disable auto-refetch when using mock data
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors or API not available
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const updateQuery = useCallback((newQuery: Partial<AnalyticsQuery>) => {
    setQuery(prev => ({ ...prev, ...newQuery }));
  }, []);

  const setPeriod = useCallback((period: AnalyticsQuery['period']) => {
    updateQuery({ period, startDate: undefined, endDate: undefined });
  }, [updateQuery]);

  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    updateQuery({ period: 'custom', startDate, endDate });
  }, [updateQuery]);

  return {
    dashboardData,
    isLoading,
    error,
    refetch,
    query,
    updateQuery,
    setPeriod,
    setCustomDateRange,
  };
}

export function useFinancialSummary(query: AnalyticsQuery = {}) {
  return useQuery<FinancialSummary>({
    queryKey: ['financial-summary', query],
    queryFn: () => DashboardAPI.getFinancialSummary(query),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTrendAnalysis(query: AnalyticsQuery = {}) {
  return useQuery<TrendAnalysis>({
    queryKey: ['trend-analysis', query],
    queryFn: () => DashboardAPI.getTrendAnalysis(query),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePeriodComparison(query: AnalyticsQuery = {}) {
  return useQuery<PeriodComparison>({
    queryKey: ['period-comparison', query],
    queryFn: () => DashboardAPI.getPeriodComparison(query),
    staleTime: 2 * 60 * 1000,
  });
}

// WebSocket hook for real-time updates
export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    // Try to connect to WebSocket, fallback to mock if not available
    const connectWebSocket = () => {
      try {
        // Check if WebSocket is available in the environment
        if (typeof WebSocket !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL) {
          const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
          
          ws.onopen = () => {
            setIsConnected(true);
            console.log('Dashboard WebSocket connected');
          };

          ws.onmessage = (event) => {
            try {
              const message: WebSocketMessage = JSON.parse(event.data);
              setLastMessage(message);
              
              // Invalidate relevant queries based on message type
              switch (message.type) {
                case 'transaction_created':
                case 'transaction_updated':
                case 'transaction_deleted':
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                  queryClient.invalidateQueries({ queryKey: ['transactions'] });
                  break;
                case 'balance_updated':
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                  queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
                  break;
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          };

          ws.onclose = () => {
            setIsConnected(false);
            console.log('Dashboard WebSocket disconnected');
          };

          ws.onerror = (error) => {
            console.error('Dashboard WebSocket error:', error);
            setIsConnected(false);
          };

          return () => {
            ws.close();
          };
        } else {
          // Fallback to mock updates for development
          setIsConnected(true);
          
          const interval = setInterval(() => {
            const mockMessage: WebSocketMessage = {
              type: 'balance_updated',
              data: { timestamp: new Date().toISOString() },
              timestamp: new Date().toISOString(),
            };
            
            setLastMessage(mockMessage);
          }, 30000); // Every 30 seconds

          return () => {
            clearInterval(interval);
            setIsConnected(false);
          };
        }
      } catch (error) {
        console.error('Error setting up WebSocket connection:', error);
        setIsConnected(false);
        return () => {};
      }
    };

    const cleanup = connectWebSocket();
    
    return cleanup;
  }, [queryClient]);

  return {
    isConnected,
    lastMessage,
  };
}

export function useFinancialOverview() {
  return useQuery({
    queryKey: ['financial-overview'],
    queryFn: DashboardAPI.getFinancialOverview,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCashFlowAnalysis(months: number = 12) {
  return useQuery({
    queryKey: ['cash-flow-analysis', months],
    queryFn: () => DashboardAPI.getCashFlowAnalysis(months),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSpendingPatterns() {
  return useQuery({
    queryKey: ['spending-patterns'],
    queryFn: DashboardAPI.getSpendingPatterns,
    staleTime: 10 * 60 * 1000,
  });
}