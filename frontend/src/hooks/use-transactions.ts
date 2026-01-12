'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransactionsAPI } from '@/lib/transactions-api';
import type {
  Transaction,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  PaginatedTransactions,
  Category,
  Account,
  CategorySuggestion,
  RecurringTransaction,
  QueueStats,
} from '@/types/transaction';

export function useTransactions(filters: TransactionFilters = {}) {
  const queryClient = useQueryClient();

  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useQuery<PaginatedTransactions>({
    queryKey: ['transactions', filters],
    queryFn: () => TransactionsAPI.getTransactions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: TransactionsAPI.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: TransactionsAPI.updateTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: TransactionsAPI.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const createTransaction = useCallback(
    (data: CreateTransactionData) => createMutation.mutateAsync(data),
    [createMutation]
  );

  const updateTransaction = useCallback(
    (data: UpdateTransactionData) => updateMutation.mutateAsync(data),
    [updateMutation]
  );

  const deleteTransaction = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  );

  return {
    transactions: transactions?.data || [],
    pagination: transactions ? {
      total: transactions.total,
      page: transactions.page,
      limit: transactions.limit,
      totalPages: transactions.totalPages,
    } : null,
    isLoading,
    error,
    refetch,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useTransaction(id: string) {
  return useQuery<Transaction>({
    queryKey: ['transaction', id],
    queryFn: () => TransactionsAPI.getTransaction(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: TransactionsAPI.getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: TransactionsAPI.getAccounts,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCategorySuggestion() {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = useCallback(async (description: string, amount: number) => {
    if (!description.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await TransactionsAPI.suggestCategory(description, amount);
      setSuggestions(result);
    } catch (error) {
      console.error('Error getting category suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    getSuggestions,
  };
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAttachment = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await TransactionsAPI.uploadAttachment(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  const processOCR = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      return await TransactionsAPI.processOCR(file);
    } catch (error) {
      console.error('Error processing OCR:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadAttachment,
    processOCR,
    isUploading,
    uploadProgress,
  };
}

// Recurring Transactions Hooks
export function useRecurringTransactions() {
  const queryClient = useQueryClient();

  const {
    data: recurringTransactions = [],
    isLoading,
    error,
    refetch,
  } = useQuery<RecurringTransaction[]>({
    queryKey: ['recurring-transactions'],
    queryFn: TransactionsAPI.getRecurringTransactions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) =>
      TransactionsAPI.updateRecurringTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: TransactionsAPI.cancelRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
  });

  const triggerProcessingMutation = useMutation({
    mutationFn: TransactionsAPI.triggerRecurringProcessing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
  });

  const updateRecurringTransaction = useCallback(
    (id: string, data: Partial<CreateTransactionData>) =>
      updateMutation.mutateAsync({ id, data }),
    [updateMutation]
  );

  const cancelRecurringTransaction = useCallback(
    (id: string) => cancelMutation.mutateAsync(id),
    [cancelMutation]
  );

  const triggerProcessing = useCallback(
    () => triggerProcessingMutation.mutateAsync(),
    [triggerProcessingMutation]
  );

  return {
    recurringTransactions,
    isLoading,
    error,
    refetch,
    updateRecurringTransaction,
    cancelRecurringTransaction,
    triggerProcessing,
    isUpdating: updateMutation.isPending,
    isCanceling: cancelMutation.isPending,
    isProcessing: triggerProcessingMutation.isPending,
  };
}

export function useQueueStats() {
  return useQuery<QueueStats>({
    queryKey: ['queue-stats'],
    queryFn: TransactionsAPI.getQueueStats,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    staleTime: 10 * 1000, // 10 seconds
  });
}