'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AnalyticsQuery } from '@/lib/dashboard-api';

interface PeriodSelectorProps {
  currentPeriod: AnalyticsQuery['period'];
  startDate?: string;
  endDate?: string;
  onPeriodChange: (period: AnalyticsQuery['period']) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
}

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '1y', label: 'Último ano' },
  { value: 'current_month', label: 'Mês atual' },
  { value: 'current_year', label: 'Ano atual' },
  { value: 'custom', label: 'Período personalizado' },
] as const;

export function PeriodSelector({
  currentPeriod = '30d',
  startDate,
  endDate,
  onPeriodChange,
  onCustomDateChange,
}: PeriodSelectorProps) {
  const [customStartDate, setCustomStartDate] = useState(startDate || '');
  const [customEndDate, setCustomEndDate] = useState(endDate || '');

  const handlePeriodChange = (value: string) => {
    const period = value as AnalyticsQuery['period'];
    onPeriodChange(period);
  };

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      onCustomDateChange(customStartDate, customEndDate);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <Label htmlFor="period-select" className="text-sm font-medium">
              Período de análise
            </Label>
          </div>
          
          <Select value={currentPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger id="period-select">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentPeriod === 'custom' && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="start-date" className="text-xs">
                    Data inicial
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formatDateForInput(customStartDate)}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end-date" className="text-xs">
                    Data final
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formatDateForInput(customEndDate)}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={handleCustomDateSubmit}
                disabled={!customStartDate || !customEndDate}
                size="sm"
                className="w-full"
              >
                Aplicar período personalizado
              </Button>
            </div>
          )}

          {/* Quick period buttons */}
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.slice(0, 4).map((option) => (
              <Button
                key={option.value}
                variant={currentPeriod === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}