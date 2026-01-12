'use client';

import { PortfolioOverview } from '@/components/investments/portfolio-overview';
import { AssetAllocationChart } from '@/components/investments/asset-allocation-chart';
import { PerformanceChart } from '@/components/investments/performance-chart';

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Carteira</h1>
        <p className="text-gray-600 mt-2">
          Visão completa da sua carteira de investimentos
        </p>
      </div>

      <PortfolioOverview />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceChart />
        <AssetAllocationChart />
      </div>
    </div>
  );
}