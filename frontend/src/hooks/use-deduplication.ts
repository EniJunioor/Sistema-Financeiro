'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface DeduplicationSettings {
  dateToleranceDays?: number;
  amountTolerancePercent?: number;
  descriptionSimilarityThreshold?: number;
  autoMergeThreshold?: number;
  enabledCriteria?: {
    date?: boolean;
    amount?: boolean;
    description?: boolean;
    location?: boolean;
    account?: boolean;
  };
}

interface DuplicateMatch {
  id: string;
  originalTransaction: any;
  duplicateTransaction: any;
  confidence: number;
  matchingCriteria: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface DeduplicationResult {
  duplicatesFound: number;
  matches: DuplicateMatch[];
  autoMerged: number;
  pendingReview: number;
}

export function useDeduplication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectDuplicatesInRange = useCallback(async (
    startDate: string,
    endDate: string,
    settings?: DeduplicationSettings
  ): Promise<DeduplicationResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<DeduplicationResult>('/transactions/deduplication/detect-range', {
        startDate,
        endDate,
        settings
      });

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Erro ao detectar duplicatas';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const detectDuplicatesForTransaction = useCallback(async (
    transactionId: string,
    settings?: DeduplicationSettings
  ): Promise<DuplicateMatch[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<DuplicateMatch[]>('/transactions/deduplication/detect-transaction', {
        transactionId,
        settings
      });

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Erro ao detectar duplicatas';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveDuplicateMerge = useCallback(async (
    matchId: string,
    keepTransactionId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/transactions/deduplication/approve-merge', {
        matchId,
        keepTransactionId
      });

      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Erro ao aprovar merge de duplicatas';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectDuplicateMatch = useCallback(async (
    matchId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/transactions/deduplication/reject-match', {
        matchId
      });

      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Erro ao rejeitar duplicata';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    detectDuplicatesInRange,
    detectDuplicatesForTransaction,
    approveDuplicateMerge,
    rejectDuplicateMatch,
    clearError
  };
}