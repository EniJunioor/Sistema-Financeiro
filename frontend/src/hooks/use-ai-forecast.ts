'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AIForecast } from '@/types/dashboard';
import { apiClient as api } from '@/lib/api';

interface AIForecastParams {
  forecastMonths?: number;
  includeAnomalies?: boolean;
  includeSeasonalAdjustments?: boolean;
  includeCategoryForecasts?: boolean;
  // Analytics query params
  startDate?: string;
  endDate?: string;
  accountIds?: string[];
  categoryIds?: string[];
  transactionTypes?: string[];
}

interface UseAIForecastReturn {
  forecast: AIForecast | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
}

export function useAIForecast(params: AIForecastParams = {}): UseAIForecastReturn {
  const [isRefetching, setIsRefetching] = useState(false);

  const queryParams = new URLSearchParams();
  
  // Forecast-specific params
  if (params.forecastMonths) {
    queryParams.append('forecastMonths', params.forecastMonths.toString());
  }
  if (params.includeAnomalies !== undefined) {
    queryParams.append('includeAnomalies', params.includeAnomalies.toString());
  }
  if (params.includeSeasonalAdjustments !== undefined) {
    queryParams.append('includeSeasonalAdjustments', params.includeSeasonalAdjustments.toString());
  }
  if (params.includeCategoryForecasts !== undefined) {
    queryParams.append('includeCategoryForecasts', params.includeCategoryForecasts.toString());
  }

  // Analytics query params
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  if (params.accountIds?.length) {
    params.accountIds.forEach(id => queryParams.append('accountIds', id));
  }
  if (params.categoryIds?.length) {
    params.categoryIds.forEach(id => queryParams.append('categoryIds', id));
  }
  if (params.transactionTypes?.length) {
    params.transactionTypes.forEach(type => queryParams.append('transactionTypes', type));
  }

  const {
    data: forecast,
    isLoading,
    error,
    refetch: originalRefetch,
  } = useQuery({
    queryKey: ['ai-forecast', params],
    queryFn: async (): Promise<AIForecast> => {
      const response = await api.get(`/reports/ai-forecast?${queryParams.toString()}`);
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const refetch = async () => {
    setIsRefetching(true);
    try {
      await originalRefetch();
    } finally {
      setIsRefetching(false);
    }
  };

  return {
    forecast: forecast || null,
    isLoading,
    error: error as Error | null,
    refetch,
    isRefetching,
  };
}

export function useSpendingPredictions(params: AIForecastParams = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.forecastMonths) {
    queryParams.append('forecastMonths', params.forecastMonths.toString());
  }
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  if (params.accountIds?.length) {
    params.accountIds.forEach(id => queryParams.append('accountIds', id));
  }
  if (params.categoryIds?.length) {
    params.categoryIds.forEach(id => queryParams.append('categoryIds', id));
  }

  return useQuery({
    queryKey: ['spending-predictions', params],
    queryFn: async () => {
      const response = await api.get(`/reports/spending-predictions?${queryParams.toString()}`);
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });
}

export function useIncomePredictions(params: AIForecastParams = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.forecastMonths) {
    queryParams.append('forecastMonths', params.forecastMonths.toString());
  }
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  if (params.accountIds?.length) {
    params.accountIds.forEach(id => queryParams.append('accountIds', id));
  }

  return useQuery({
    queryKey: ['income-predictions', params],
    queryFn: async () => {
      const response = await api.get(`/reports/income-predictions?${queryParams.toString()}`);
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });
}

export function useAnomalyDetection(params: Omit<AIForecastParams, 'forecastMonths'> = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  if (params.accountIds?.length) {
    params.accountIds.forEach(id => queryParams.append('accountIds', id));
  }
  if (params.categoryIds?.length) {
    params.categoryIds.forEach(id => queryParams.append('categoryIds', id));
  }

  return useQuery({
    queryKey: ['anomaly-detection', params],
    queryFn: async () => {
      const response = await api.get(`/reports/anomaly-detection?${queryParams.toString()}`);
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

// Helper hook for getting forecast insights only
export function useForecastInsights(params: AIForecastParams = {}) {
  const { forecast, isLoading, error } = useAIForecast(params);
  
  return {
    insights: forecast?.insights || [],
    confidenceScore: forecast?.confidenceScore || 0,
    modelAccuracy: forecast?.modelAccuracy || 0,
    isLoading,
    error,
  };
}