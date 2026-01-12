'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { DuplicateReview } from './duplicate-review';
import { useDeduplication } from '@/hooks/use-deduplication';
import { Search, Settings, AlertCircle, CheckCircle } from 'lucide-react';

interface DeduplicationSettings {
  dateToleranceDays: number;
  amountTolerancePercent: number;
  descriptionSimilarityThreshold: number;
  autoMergeThreshold: number;
  enabledCriteria: {
    date: boolean;
    amount: boolean;
    description: boolean;
    location: boolean;
    account: boolean;
  };
}

export function DeduplicationPage() {
  const {
    loading,
    error,
    detectDuplicatesInRange,
    approveDuplicateMerge,
    rejectDuplicateMatch,
    clearError
  } = useDeduplication();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [settings, setSettings] = useState<DeduplicationSettings>({
    dateToleranceDays: 3,
    amountTolerancePercent: 1.0,
    descriptionSimilarityThreshold: 0.8,
    autoMergeThreshold: 0.95,
    enabledCriteria: {
      date: true,
      amount: true,
      description: true,
      location: true,
      account: true,
    }
  });

  // Set default dates (last 30 days)
  React.useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const handleDetectDuplicates = async () => {
    if (!startDate || !endDate) {
      return;
    }

    clearError();
    const detectionResult = await detectDuplicatesInRange(startDate, endDate, settings);
    
    if (detectionResult) {
      setResult(detectionResult);
    }
  };

  const handleApproveMerge = async (matchId: string, keepTransactionId: string) => {
    const success = await approveDuplicateMerge(matchId, keepTransactionId);
    
    if (success && result) {
      // Remove the approved match from the results
      setResult({
        ...result,
        matches: result.matches.filter((match: any) => match.id !== matchId),
        duplicatesFound: result.duplicatesFound - 1,
        pendingReview: result.pendingReview - 1
      });
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    const success = await rejectDuplicateMatch(matchId);
    
    if (success && result) {
      // Remove the rejected match from the results
      setResult({
        ...result,
        matches: result.matches.filter((match: any) => match.id !== matchId),
        duplicatesFound: result.duplicatesFound - 1,
        pendingReview: result.pendingReview - 1
      });
    }
  };

  const updateSettings = (key: keyof DeduplicationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateCriteria = (criteria: keyof DeduplicationSettings['enabledCriteria'], enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      enabledCriteria: {
        ...prev.enabledCriteria,
        [criteria]: enabled
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Detecção de Duplicatas</h1>
        <p className="text-gray-600 mt-2">
          Identifique e gerencie transações duplicadas automaticamente
        </p>
      </div>

      {/* Detection Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Duplicatas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleDetectDuplicates}
              disabled={loading || !startDate || !endDate}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Analisando...' : 'Detectar Duplicatas'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <>
              <Separator />
              <div className="space-y-6">
                <h3 className="font-medium">Configurações de Detecção</h3>

                {/* Tolerance Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tolerância de Data (dias): {settings.dateToleranceDays}</Label>
                    <Slider
                      value={[settings.dateToleranceDays]}
                      onValueChange={([value]) => updateSettings('dateToleranceDays', value)}
                      max={30}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tolerância de Valor (%): {settings.amountTolerancePercent}</Label>
                    <Slider
                      value={[settings.amountTolerancePercent]}
                      onValueChange={([value]) => updateSettings('amountTolerancePercent', value)}
                      max={10}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Similaridade de Descrição: {Math.round(settings.descriptionSimilarityThreshold * 100)}%</Label>
                    <Slider
                      value={[settings.descriptionSimilarityThreshold]}
                      onValueChange={([value]) => updateSettings('descriptionSimilarityThreshold', value)}
                      max={1}
                      min={0}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Limite Auto-Merge: {Math.round(settings.autoMergeThreshold * 100)}%</Label>
                    <Slider
                      value={[settings.autoMergeThreshold]}
                      onValueChange={([value]) => updateSettings('autoMergeThreshold', value)}
                      max={1}
                      min={0.5}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Criteria Settings */}
                <div>
                  <Label className="text-base font-medium">Critérios de Comparação</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                    {Object.entries(settings.enabledCriteria).map(([key, enabled]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          id={key}
                          checked={enabled}
                          onCheckedChange={(checked) => updateCriteria(key as any, checked)}
                        />
                        <Label htmlFor={key} className="capitalize">
                          {key === 'date' ? 'Data' :
                           key === 'amount' ? 'Valor' :
                           key === 'description' ? 'Descrição' :
                           key === 'location' ? 'Local' :
                           key === 'account' ? 'Conta' : key}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.duplicatesFound}</div>
                <div className="text-sm text-blue-600">Duplicatas Encontradas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.autoMerged}</div>
                <div className="text-sm text-green-600">Auto-Mescladas</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{result.pendingReview}</div>
                <div className="text-sm text-yellow-600">Aguardando Revisão</div>
              </div>
            </div>

            {result.autoMerged > 0 && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.autoMerged} duplicata(s) foram automaticamente mescladas com alta confiança.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Duplicate Review */}
      {result && result.matches && result.matches.length > 0 && (
        <DuplicateReview
          matches={result.matches}
          onApprove={handleApproveMerge}
          onReject={handleRejectMatch}
          loading={loading}
        />
      )}
    </div>
  );
}