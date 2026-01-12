import { Injectable } from '@nestjs/common';
import { ReportTemplate, ReportType } from '../dto/generate-report.dto';

export interface ReportTemplateConfig {
  name: string;
  description: string;
  sections: ReportSection[];
  chartTypes: ChartType[];
  defaultPeriod: 'month' | 'quarter' | 'year';
  includeComparisons: boolean;
  includePredictions: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'table' | 'chart' | 'text' | 'transactions';
  required: boolean;
  order: number;
  config?: Record<string, any>;
}

export interface ChartType {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'donut';
  title: string;
  dataSource: string;
  required: boolean;
}

@Injectable()
export class ReportTemplatesService {
  private templates: Map<ReportTemplate, ReportTemplateConfig> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // DRE (Demonstração do Resultado do Exercício)
    this.templates.set(ReportTemplate.DRE, {
      name: 'Demonstração do Resultado do Exercício (DRE)',
      description: 'Relatório financeiro que mostra receitas, despesas e resultado líquido do período',
      sections: [
        {
          id: 'header',
          title: 'Cabeçalho',
          type: 'summary',
          required: true,
          order: 1,
          config: { showPeriod: true, showCompany: true }
        },
        {
          id: 'revenue',
          title: 'Receitas',
          type: 'table',
          required: true,
          order: 2,
          config: { groupBy: 'category', showSubtotals: true }
        },
        {
          id: 'expenses',
          title: 'Despesas',
          type: 'table',
          required: true,
          order: 3,
          config: { groupBy: 'category', showSubtotals: true }
        },
        {
          id: 'net_result',
          title: 'Resultado Líquido',
          type: 'summary',
          required: true,
          order: 4,
          config: { showPercentages: true, highlightResult: true }
        },
        {
          id: 'revenue_chart',
          title: 'Gráfico de Receitas',
          type: 'chart',
          required: false,
          order: 5
        }
      ],
      chartTypes: [
        {
          id: 'revenue_breakdown',
          type: 'pie',
          title: 'Distribuição de Receitas',
          dataSource: 'income_by_category',
          required: false
        },
        {
          id: 'expense_breakdown',
          type: 'pie',
          title: 'Distribuição de Despesas',
          dataSource: 'expense_by_category',
          required: false
        }
      ],
      defaultPeriod: 'month',
      includeComparisons: true,
      includePredictions: false
    });

    // Cash Flow Report
    this.templates.set(ReportTemplate.CASH_FLOW, {
      name: 'Relatório de Fluxo de Caixa',
      description: 'Análise detalhada do fluxo de entrada e saída de recursos',
      sections: [
        {
          id: 'header',
          title: 'Cabeçalho',
          type: 'summary',
          required: true,
          order: 1
        },
        {
          id: 'cash_flow_summary',
          title: 'Resumo do Fluxo de Caixa',
          type: 'summary',
          required: true,
          order: 2,
          config: { showOpeningBalance: true, showClosingBalance: true }
        },
        {
          id: 'monthly_flow',
          title: 'Fluxo Mensal',
          type: 'table',
          required: true,
          order: 3,
          config: { groupBy: 'month', showCumulative: true }
        },
        {
          id: 'cash_flow_chart',
          title: 'Gráfico de Fluxo de Caixa',
          type: 'chart',
          required: true,
          order: 4
        },
        {
          id: 'projections',
          title: 'Projeções',
          type: 'summary',
          required: false,
          order: 5,
          config: { showPredictions: true, months: 3 }
        }
      ],
      chartTypes: [
        {
          id: 'cash_flow_line',
          type: 'line',
          title: 'Evolução do Fluxo de Caixa',
          dataSource: 'monthly_cash_flow',
          required: true
        },
        {
          id: 'cash_flow_bar',
          type: 'bar',
          title: 'Entradas vs Saídas',
          dataSource: 'income_vs_expense',
          required: false
        }
      ],
      defaultPeriod: 'year',
      includeComparisons: true,
      includePredictions: true
    });

    // Tax Report
    this.templates.set(ReportTemplate.TAX_REPORT, {
      name: 'Relatório Fiscal',
      description: 'Relatório para declaração de imposto de renda e obrigações fiscais',
      sections: [
        {
          id: 'header',
          title: 'Cabeçalho',
          type: 'summary',
          required: true,
          order: 1
        },
        {
          id: 'taxable_income',
          title: 'Rendimentos Tributáveis',
          type: 'table',
          required: true,
          order: 2,
          config: { groupBy: 'source', showTaxes: true }
        },
        {
          id: 'deductions',
          title: 'Deduções',
          type: 'table',
          required: true,
          order: 3,
          config: { groupBy: 'category', showLimits: true }
        },
        {
          id: 'investments_gains',
          title: 'Ganhos de Capital',
          type: 'table',
          required: true,
          order: 4,
          config: { showBuyDate: true, showSellDate: true, calculateTax: true }
        },
        {
          id: 'tax_summary',
          title: 'Resumo Fiscal',
          type: 'summary',
          required: true,
          order: 5,
          config: { showTotalTax: true, showRefund: true }
        }
      ],
      chartTypes: [
        {
          id: 'income_sources',
          type: 'pie',
          title: 'Fontes de Renda',
          dataSource: 'income_by_source',
          required: false
        }
      ],
      defaultPeriod: 'year',
      includeComparisons: false,
      includePredictions: false
    });

    // Balance Sheet
    this.templates.set(ReportTemplate.BALANCE_SHEET, {
      name: 'Balanço Patrimonial',
      description: 'Demonstração da situação patrimonial e financeira',
      sections: [
        {
          id: 'header',
          title: 'Cabeçalho',
          type: 'summary',
          required: true,
          order: 1
        },
        {
          id: 'assets',
          title: 'Ativos',
          type: 'table',
          required: true,
          order: 2,
          config: { groupBy: 'type', showSubtotals: true }
        },
        {
          id: 'liabilities',
          title: 'Passivos',
          type: 'table',
          required: true,
          order: 3,
          config: { groupBy: 'type', showSubtotals: true }
        },
        {
          id: 'equity',
          title: 'Patrimônio Líquido',
          type: 'summary',
          required: true,
          order: 4,
          config: { showEvolution: true }
        }
      ],
      chartTypes: [
        {
          id: 'asset_distribution',
          type: 'pie',
          title: 'Distribuição de Ativos',
          dataSource: 'assets_by_type',
          required: false
        },
        {
          id: 'net_worth_evolution',
          type: 'line',
          title: 'Evolução do Patrimônio Líquido',
          dataSource: 'net_worth_history',
          required: false
        }
      ],
      defaultPeriod: 'quarter',
      includeComparisons: true,
      includePredictions: false
    });

    // Investment Summary
    this.templates.set(ReportTemplate.INVESTMENT_SUMMARY, {
      name: 'Resumo de Investimentos',
      description: 'Análise completa da carteira de investimentos',
      sections: [
        {
          id: 'header',
          title: 'Cabeçalho',
          type: 'summary',
          required: true,
          order: 1
        },
        {
          id: 'portfolio_summary',
          title: 'Resumo da Carteira',
          type: 'summary',
          required: true,
          order: 2,
          config: { showTotalValue: true, showReturn: true, showRisk: true }
        },
        {
          id: 'asset_allocation',
          title: 'Alocação de Ativos',
          type: 'table',
          required: true,
          order: 3,
          config: { groupBy: 'asset_class', showPercentages: true }
        },
        {
          id: 'performance',
          title: 'Performance',
          type: 'table',
          required: true,
          order: 4,
          config: { showReturns: true, showBenchmark: true }
        },
        {
          id: 'transactions',
          title: 'Movimentações',
          type: 'transactions',
          required: false,
          order: 5,
          config: { transactionType: 'investment', limit: 50 }
        }
      ],
      chartTypes: [
        {
          id: 'allocation_pie',
          type: 'pie',
          title: 'Alocação por Classe de Ativo',
          dataSource: 'allocation_by_class',
          required: true
        },
        {
          id: 'performance_line',
          type: 'line',
          title: 'Performance vs Benchmark',
          dataSource: 'performance_vs_benchmark',
          required: true
        },
        {
          id: 'sector_allocation',
          type: 'donut',
          title: 'Alocação por Setor',
          dataSource: 'allocation_by_sector',
          required: false
        }
      ],
      defaultPeriod: 'quarter',
      includeComparisons: true,
      includePredictions: true
    });

    // Spending Breakdown
    this.templates.set(ReportTemplate.SPENDING_BREAKDOWN, {
      name: 'Análise de Gastos',
      description: 'Análise detalhada dos padrões de gastos e despesas',
      sections: [
        {
          id: 'header',
          title: 'Cabeçalho',
          type: 'summary',
          required: true,
          order: 1
        },
        {
          id: 'spending_summary',
          title: 'Resumo de Gastos',
          type: 'summary',
          required: true,
          order: 2,
          config: { showTotal: true, showAverage: true, showTrend: true }
        },
        {
          id: 'category_breakdown',
          title: 'Gastos por Categoria',
          type: 'table',
          required: true,
          order: 3,
          config: { groupBy: 'category', showPercentages: true, showTrend: true }
        },
        {
          id: 'monthly_trends',
          title: 'Tendências Mensais',
          type: 'chart',
          required: true,
          order: 4
        },
        {
          id: 'spending_patterns',
          title: 'Padrões de Gastos',
          type: 'summary',
          required: false,
          order: 5,
          config: { showDayOfWeek: true, showSeasonality: true }
        },
        {
          id: 'top_transactions',
          title: 'Maiores Transações',
          type: 'transactions',
          required: false,
          order: 6,
          config: { transactionType: 'expense', limit: 20, sortBy: 'amount' }
        }
      ],
      chartTypes: [
        {
          id: 'category_pie',
          type: 'pie',
          title: 'Gastos por Categoria',
          dataSource: 'expense_by_category',
          required: true
        },
        {
          id: 'monthly_trend',
          type: 'line',
          title: 'Tendência Mensal de Gastos',
          dataSource: 'monthly_expenses',
          required: true
        },
        {
          id: 'weekly_pattern',
          type: 'bar',
          title: 'Padrão Semanal de Gastos',
          dataSource: 'weekly_spending_pattern',
          required: false
        }
      ],
      defaultPeriod: 'month',
      includeComparisons: true,
      includePredictions: true
    });
  }

  getTemplate(template: ReportTemplate): ReportTemplateConfig | undefined {
    return this.templates.get(template);
  }

  getAllTemplates(): Map<ReportTemplate, ReportTemplateConfig> {
    return new Map(this.templates);
  }

  getTemplatesByType(reportType: ReportType): ReportTemplateConfig[] {
    const templates: ReportTemplateConfig[] = [];
    
    switch (reportType) {
      case ReportType.FINANCIAL_SUMMARY:
        templates.push(
          this.templates.get(ReportTemplate.DRE)!,
          this.templates.get(ReportTemplate.SPENDING_BREAKDOWN)!
        );
        break;
      case ReportType.CASH_FLOW:
        templates.push(this.templates.get(ReportTemplate.CASH_FLOW)!);
        break;
      case ReportType.INCOME_STATEMENT:
        templates.push(this.templates.get(ReportTemplate.DRE)!);
        break;
      case ReportType.BALANCE_SHEET:
        templates.push(this.templates.get(ReportTemplate.BALANCE_SHEET)!);
        break;
      case ReportType.TAX_REPORT:
        templates.push(this.templates.get(ReportTemplate.TAX_REPORT)!);
        break;
      case ReportType.INVESTMENT_PORTFOLIO:
        templates.push(this.templates.get(ReportTemplate.INVESTMENT_SUMMARY)!);
        break;
      case ReportType.SPENDING_ANALYSIS:
        templates.push(this.templates.get(ReportTemplate.SPENDING_BREAKDOWN)!);
        break;
      default:
        // Return all templates for custom reports
        templates.push(...Array.from(this.templates.values()));
    }

    return templates.filter(Boolean);
  }

  validateTemplate(template: ReportTemplate, customConfig?: Record<string, any>): boolean {
    const templateConfig = this.getTemplate(template);
    if (!templateConfig) {
      return false;
    }

    // Validate required sections are present
    const requiredSections = templateConfig.sections.filter(s => s.required);
    if (customConfig?.excludeSections) {
      const excludedSections = customConfig.excludeSections as string[];
      const hasRequiredExcluded = requiredSections.some(s => excludedSections.includes(s.id));
      if (hasRequiredExcluded) {
        return false;
      }
    }

    return true;
  }

  getDefaultConfig(template: ReportTemplate): Record<string, any> {
    const templateConfig = this.getTemplate(template);
    if (!templateConfig) {
      return {};
    }

    return {
      includeCharts: templateConfig.chartTypes.length > 0,
      includeComparisons: templateConfig.includeComparisons,
      includePredictions: templateConfig.includePredictions,
      defaultPeriod: templateConfig.defaultPeriod,
      sections: templateConfig.sections.map(s => ({
        id: s.id,
        enabled: true,
        config: s.config || {}
      })),
      charts: templateConfig.chartTypes.map(c => ({
        id: c.id,
        enabled: c.required,
        config: {}
      }))
    };
  }
}