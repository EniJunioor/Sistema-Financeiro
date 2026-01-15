'use client';

import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
] as const;

export function PeriodSelector({
  currentPeriod = '30d',
  startDate,
  endDate,
  onPeriodChange,
  onCustomDateChange,
}: PeriodSelectorProps) {
  const handlePeriodChange = (value: string) => {
    const period = value as AnalyticsQuery['period'];
    onPeriodChange(period);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium text-gray-700">
              Período de análise
            </Label>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={currentPeriod === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange(option.value)}
                className={`text-[10px] sm:text-xs ${currentPeriod === option.value ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              >
                <span className="truncate">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}