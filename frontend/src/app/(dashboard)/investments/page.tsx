'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortfolioOverview } from '@/components/investments/portfolio-overview';
import { AssetAllocationChart } from '@/components/investments/asset-allocation-chart';
import { PerformanceChart } from '@/components/investments/performance-chart';
import { InvestmentsList } from '@/components/investments/investments-list';
import { InvestmentForm } from '@/components/investments/investment-form';
import { Plus, BarChart3, PieChart, TrendingUp, List } from 'lucide-react';

export default function InvestmentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investimentos</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe e gerencie sua carteira de investimentos
          </p>
        </div>
        <InvestmentForm />
      </div>

      {/* Portfolio Overview */}
      <PortfolioOverview />

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="allocation" className="flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>Alocação</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Análise</span>
          </TabsTrigger>
          <TabsTrigger value="holdings" className="flex items-center space-x-2">
            <List className="h-4 w-4" />
            <span>Posições</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceChart />
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <AssetAllocationChart />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid gap-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Análise Avançada</h3>
              <p className="text-muted-foreground mb-4">
                Métricas de risco, diversificação e comparação com benchmarks
              </p>
              <p className="text-sm text-muted-foreground">
                Esta funcionalidade será implementada em breve
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="holdings" className="space-y-6">
          <InvestmentsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}