import { Injectable } from '@nestjs/common';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration, ChartType as ChartJSType } from 'chart.js';

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export interface ChartOptions {
  title: string;
  width: number;
  height: number;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  showLegend?: boolean;
  showGrid?: boolean;
  currency?: string;
  colors?: string[];
}

@Injectable()
export class ChartGeneratorService {
  private chartJSNodeCanvas: ChartJSNodeCanvas;
  private defaultColors = [
    '#10B981', // Green
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  constructor() {
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 800,
      height: 600,
      backgroundColour: 'white',
      chartCallback: (ChartJS) => {
        // Register any additional plugins if needed
        ChartJS.defaults.font.family = 'Arial, sans-serif';
        ChartJS.defaults.font.size = 12;
      },
    });
  }

  async generateChart(data: ChartData, options: ChartOptions): Promise<Buffer> {
    const chartConfig = this.buildChartConfig(data, options);
    
    // Create a new canvas instance with the specified dimensions
    const canvas = new ChartJSNodeCanvas({
      width: options.width,
      height: options.height,
      backgroundColour: 'white',
    });

    return await canvas.renderToBuffer(chartConfig);
  }

  async generateBase64Chart(data: ChartData, options: ChartOptions): Promise<string> {
    const buffer = await this.generateChart(data, options);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  private buildChartConfig(data: ChartData, options: ChartOptions): ChartConfiguration {
    const chartType = this.mapChartType(options.type);
    const colors = options.colors || this.defaultColors;

    // Apply colors to datasets
    const datasets = data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || this.getBackgroundColors(colors, options.type, data.labels.length, index),
      borderColor: dataset.borderColor || colors[index % colors.length],
      borderWidth: dataset.borderWidth || (options.type === 'line' ? 2 : 1),
      fill: dataset.fill !== undefined ? dataset.fill : options.type === 'area',
    }));

    const config: ChartConfiguration = {
      type: chartType,
      data: {
        labels: data.labels,
        datasets,
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: options.title,
            font: {
              size: 16,
              weight: 'bold',
            },
            padding: 20,
          },
          legend: {
            display: options.showLegend !== false,
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                
                const value = context.parsed.y || context.parsed;
                if (options.currency) {
                  label += this.formatCurrency(value, options.currency);
                } else {
                  label += this.formatNumber(value);
                }
                
                return label;
              },
            },
          },
        },
        scales: this.buildScales(options),
        elements: {
          point: {
            radius: options.type === 'line' ? 4 : 0,
            hoverRadius: 6,
          },
          line: {
            tension: 0.2,
          },
        },
      },
    };

    return config;
  }

  private mapChartType(type: string): ChartJSType {
    switch (type) {
      case 'line':
      case 'area':
        return 'line';
      case 'bar':
        return 'bar';
      case 'pie':
        return 'pie';
      case 'doughnut':
        return 'doughnut';
      default:
        return 'line';
    }
  }

  private getBackgroundColors(colors: string[], chartType: string, dataLength: number, datasetIndex: number): string | string[] {
    if (chartType === 'pie' || chartType === 'doughnut') {
      // For pie/doughnut charts, return array of colors for each slice
      return colors.slice(0, dataLength);
    } else {
      // For other charts, return single color with transparency
      const color = colors[datasetIndex % colors.length];
      return this.addAlpha(color, 0.7);
    }
  }

  private addAlpha(color: string, alpha: number): string {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private buildScales(options: ChartOptions): any {
    if (options.type === 'pie' || options.type === 'doughnut') {
      return {};
    }

    return {
      x: {
        display: true,
        grid: {
          display: options.showGrid !== false,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          display: options.showGrid !== false,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value: any) => {
            if (options.currency) {
              return this.formatCurrency(value, options.currency);
            }
            return this.formatNumber(value);
          },
        },
      },
    };
  }

  private formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Predefined chart generators for common financial charts
  async generateIncomeExpenseChart(
    incomeData: Array<{ month: string; amount: number }>,
    expenseData: Array<{ month: string; amount: number }>,
    options: Partial<ChartOptions> = {}
  ): Promise<Buffer> {
    const labels = incomeData.map(d => d.month);
    const chartData: ChartData = {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData.map(d => d.amount),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
        },
        {
          label: 'Despesas',
          data: expenseData.map(d => d.amount),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
        },
      ],
    };

    return this.generateChart(chartData, {
      title: 'Receitas vs Despesas',
      width: 800,
      height: 400,
      type: 'line',
      currency: 'BRL',
      ...options,
    });
  }

  async generateCategoryPieChart(
    categoryData: Array<{ category: string; amount: number }>,
    options: Partial<ChartOptions> = {}
  ): Promise<Buffer> {
    const chartData: ChartData = {
      labels: categoryData.map(d => d.category),
      datasets: [
        {
          label: 'Valor',
          data: categoryData.map(d => d.amount),
        },
      ],
    };

    return this.generateChart(chartData, {
      title: 'Gastos por Categoria',
      width: 600,
      height: 400,
      type: 'pie',
      currency: 'BRL',
      ...options,
    });
  }

  async generateCashFlowChart(
    cashFlowData: Array<{ month: string; netFlow: number; cumulativeFlow: number }>,
    options: Partial<ChartOptions> = {}
  ): Promise<Buffer> {
    const labels = cashFlowData.map(d => d.month);
    const chartData: ChartData = {
      labels,
      datasets: [
        {
          label: 'Fluxo Mensal',
          data: cashFlowData.map(d => d.netFlow),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
        },
        {
          label: 'Fluxo Acumulado',
          data: cashFlowData.map(d => d.cumulativeFlow),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
        },
      ],
    };

    return this.generateChart(chartData, {
      title: 'Fluxo de Caixa',
      width: 800,
      height: 400,
      type: 'line',
      currency: 'BRL',
      ...options,
    });
  }

  async generateInvestmentAllocationChart(
    allocationData: Array<{ assetClass: string; percentage: number; value: number }>,
    options: Partial<ChartOptions> = {}
  ): Promise<Buffer> {
    const chartData: ChartData = {
      labels: allocationData.map(d => `${d.assetClass} (${d.percentage.toFixed(1)}%)`),
      datasets: [
        {
          label: 'Valor Investido',
          data: allocationData.map(d => d.value),
        },
      ],
    };

    return this.generateChart(chartData, {
      title: 'Alocação de Investimentos',
      width: 600,
      height: 400,
      type: 'doughnut',
      currency: 'BRL',
      ...options,
    });
  }
}