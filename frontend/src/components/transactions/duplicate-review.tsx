'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Calendar, DollarSign, MapPin, Tag } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  location?: string;
  tags?: string[];
  account?: {
    name: string;
    type: string;
  };
  category?: {
    name: string;
    color?: string;
  };
}

interface DuplicateMatch {
  id: string;
  originalTransaction: Transaction;
  duplicateTransaction: Transaction;
  confidence: number;
  matchingCriteria: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface DuplicateReviewProps {
  matches: DuplicateMatch[];
  onApprove: (matchId: string, keepTransactionId: string) => Promise<void>;
  onReject: (matchId: string) => Promise<void>;
  loading?: boolean;
}

export function DuplicateReview({ matches, onApprove, onReject, loading = false }: DuplicateReviewProps) {
  const [processingMatches, setProcessingMatches] = useState<Set<string>>(new Set());

  const handleApprove = async (match: DuplicateMatch, keepTransactionId: string) => {
    setProcessingMatches(prev => new Set(prev).add(match.id));
    try {
      await onApprove(match.id, keepTransactionId);
    } finally {
      setProcessingMatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(match.id);
        return newSet;
      });
    }
  };

  const handleReject = async (match: DuplicateMatch) => {
    setProcessingMatches(prev => new Set(prev).add(match.id));
    try {
      await onReject(match.id);
    } finally {
      setProcessingMatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(match.id);
        return newSet;
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-red-100 text-red-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analisando Duplicatas...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revisão de Duplicatas</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma duplicata encontrada! Suas transações estão organizadas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Duplicatas Encontradas ({matches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Encontramos possíveis transações duplicadas. Revise cada par e escolha qual manter.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {matches.map((match) => (
        <Card key={match.id} className="border-l-4 border-l-yellow-400">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={getConfidenceColor(match.confidence)}>
                  {getConfidenceLabel(match.confidence)} ({Math.round(match.confidence * 100)}%)
                </Badge>
                <div className="flex gap-1">
                  {match.matchingCriteria.map((criteria) => (
                    <Badge key={criteria} variant="outline" className="text-xs">
                      {criteria}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Transaction */}
              <TransactionCard
                transaction={match.originalTransaction}
                title="Transação Original"
                onKeep={() => handleApprove(match, match.originalTransaction.id)}
                disabled={processingMatches.has(match.id)}
                isProcessing={processingMatches.has(match.id)}
              />

              {/* Duplicate Transaction */}
              <TransactionCard
                transaction={match.duplicateTransaction}
                title="Possível Duplicata"
                onKeep={() => handleApprove(match, match.duplicateTransaction.id)}
                disabled={processingMatches.has(match.id)}
                isProcessing={processingMatches.has(match.id)}
              />
            </div>

            <Separator className="my-4" />

            <div className="flex justify-center gap-3">
              <Button
                variant="destructive"
                onClick={() => handleReject(match)}
                disabled={processingMatches.has(match.id)}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Não são Duplicatas
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface TransactionCardProps {
  transaction: Transaction;
  title: string;
  onKeep: () => void;
  disabled: boolean;
  isProcessing: boolean;
}

function TransactionCard({ transaction, title, onKeep, disabled, isProcessing }: TransactionCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-gray-600">{title}</h4>
        <Button
          size="sm"
          onClick={onKeep}
          disabled={disabled}
          className="flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" />
          {isProcessing ? 'Processando...' : 'Manter Esta'}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="font-medium text-lg">{transaction.description}</div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="h-4 w-4" />
          <span className="font-medium">{formatCurrency(transaction.amount)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(transaction.date)}</span>
        </div>

        {transaction.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{transaction.location}</span>
          </div>
        )}

        {transaction.account && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Conta:</span> {transaction.account.name}
          </div>
        )}

        {transaction.category && (
          <div className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: transaction.category.color || '#6b7280' }}
            />
            <span>{transaction.category.name}</span>
          </div>
        )}

        {transaction.tags && transaction.tags.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Tag className="h-4 w-4" />
            <div className="flex gap-1 flex-wrap">
              {transaction.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}