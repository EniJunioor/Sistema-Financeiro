'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssetAllocation } from '@/hooks/use-investments';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

interface AssetAllocationChartProps {
  className?: string;
}

export function AssetAllocationChart({ className }: AssetAllocationChartProps) {
  const { data: allocation, isLoading, error } = useAssetAllocation();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Alocação de Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !allocation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Alocação de Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Erro ao carregar dados de alocação
          </p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Valor: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            Percentual: {formatPercentage(data.percentage)}
          </p>
          <p className="text-sm text-muted-foreground">
            Ativos: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = (data: any[]) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name} (${formatPercentage(percentage)})`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = (data: any[]) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#0088FE" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderAllocationTable = (data: any[]) => (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.count} ativos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatCurrency(item.value)}</p>
            <p className="text-sm text-muted-foreground">
              {formatPercentage(item.percentage)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Alocação de Ativos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="type" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="type">Por Tipo</TabsTrigger>
            <TabsTrigger value="sector">Por Setor</TabsTrigger>
            <TabsTrigger value="broker">Por Corretora</TabsTrigger>
            <TabsTrigger value="currency">Por Moeda</TabsTrigger>
          </TabsList>

          <TabsContent value="type" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-4">Distribuição por Tipo</h4>
                {renderPieChart(allocation.byType)}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-4">Detalhes</h4>
                {renderAllocationTable(allocation.byType)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sector" className="space-y-4">
            {allocation.bySector.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Distribuição por Setor</h4>
                  {renderBarChart(allocation.bySector)}
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-4">Detalhes</h4>
                  {renderAllocationTable(allocation.bySector)}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum setor definido para os investimentos
              </p>
            )}
          </TabsContent>

          <TabsContent value="broker" className="space-y-4">
            {allocation.byBroker.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Distribuição por Corretora</h4>
                  {renderPieChart(allocation.byBroker)}
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-4">Detalhes</h4>
                  {renderAllocationTable(allocation.byBroker)}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma corretora definida para os investimentos
              </p>
            )}
          </TabsContent>

          <TabsContent value="currency" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-4">Distribuição por Moeda</h4>
                {renderPieChart(allocation.byCurrency)}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-4">Detalhes</h4>
                {renderAllocationTable(allocation.byCurrency)}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}