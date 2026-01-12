export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  supportedFormats: ReportFormat[];
  defaultPeriod: string;
  icon?: string;
  category: 'financial' | 'tax' | 'investment' | 'custom';
}

export type ReportType = 
  | 'financial_summary'
  | 'cash_flow'
  | 'income_statement'
  | 'balance_sheet'
  | 'tax_report'
  | 'investment_portfolio'
  | 'spending_analysis'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  template?: string;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  accounts?: string[];
  includeCharts?: boolean;
  includeTransactions?: boolean;
  includeAIPredictions?: boolean;
  customConfig?: Record<string, any>;
  title?: string;
  description?: string;
}

export interface ScheduleConfig {
  cronExpression: string;
  emailRecipients: string[];
  scheduleName: string;
  isActive: boolean;
}

export interface ReportPreview {
  sections: ReportSection[];
  estimatedPages: number;
  estimatedSize: string;
  generationTime: string;
}

export interface ReportSection {
  id: string;
  name: string;
  type: 'summary' | 'chart' | 'table' | 'text';
  enabled: boolean;
  order: number;
  config?: Record<string, any>;
}

export interface GeneratedReport {
  id: string;
  config: ReportConfig;
  metadata: {
    reportId: string;
    type: ReportType;
    format: ReportFormat;
    generatedAt: string;
    fileSize: number;
    fileName: string;
  };
  summary: {
    totalTransactions: number;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    categoriesIncluded: number;
    accountsIncluded: number;
  };
  fileUrl?: string;
  fileData?: string;
}

export interface ScheduledReport {
  id: string;
  userId: string;
  reportConfig: ReportConfig;
  scheduleConfig: ScheduleConfig;
  nextExecution: string;
  lastExecution?: string;
  executionHistory: ReportExecution[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportExecution {
  id: string;
  executedAt: string;
  status: 'success' | 'failed' | 'pending';
  fileSize?: number;
  fileName?: string;
  error?: string;
  emailsSent: number;
}

export interface ShareConfig {
  expiresIn: number; // hours
  password?: string;
  allowDownload: boolean;
  allowPreview: boolean;
}

export interface SharedReport {
  shareId: string;
  shareUrl: string;
  expiresAt: string;
  config: ShareConfig;
  accessCount: number;
  createdAt: string;
}

export interface ReportFilter {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  categories?: string[];
  accounts?: string[];
  type?: ReportType;
  format?: ReportFormat;
  status?: 'all' | 'scheduled' | 'generated' | 'shared';
}

export interface CronSchedule {
  expression: string;
  description: string;
  nextRun: string;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'dre',
    name: 'Demonstração do Resultado (DRE)',
    description: 'Relatório financeiro que mostra receitas, despesas e resultado líquido do período',
    supportedFormats: ['pdf', 'excel'],
    defaultPeriod: 'month',
    category: 'financial',
    icon: '📊'
  },
  {
    id: 'cash_flow',
    name: 'Fluxo de Caixa',
    description: 'Análise detalhada do fluxo de entrada e saída de recursos',
    supportedFormats: ['pdf', 'excel'],
    defaultPeriod: 'year',
    category: 'financial',
    icon: '💰'
  },
  {
    id: 'balance_sheet',
    name: 'Balanço Patrimonial',
    description: 'Demonstração da situação patrimonial e financeira',
    supportedFormats: ['pdf', 'excel'],
    defaultPeriod: 'year',
    category: 'financial',
    icon: '⚖️'
  },
  {
    id: 'tax_report',
    name: 'Relatório Fiscal',
    description: 'Relatório para declaração de imposto de renda',
    supportedFormats: ['pdf', 'excel'],
    defaultPeriod: 'year',
    category: 'tax',
    icon: '🧾'
  },
  {
    id: 'investment_summary',
    name: 'Resumo de Investimentos',
    description: 'Análise completa da carteira de investimentos',
    supportedFormats: ['pdf', 'excel'],
    defaultPeriod: 'quarter',
    category: 'investment',
    icon: '📈'
  },
  {
    id: 'spending_breakdown',
    name: 'Análise de Gastos',
    description: 'Detalhamento de gastos por categoria e período',
    supportedFormats: ['pdf', 'excel', 'csv'],
    defaultPeriod: 'month',
    category: 'financial',
    icon: '💳'
  }
];

export const CRON_PRESETS: { label: string; value: string; description: string }[] = [
  {
    label: 'Diário às 9h',
    value: '0 9 * * *',
    description: 'Todo dia às 9:00'
  },
  {
    label: 'Semanal (Segunda às 9h)',
    value: '0 9 * * 1',
    description: 'Toda segunda-feira às 9:00'
  },
  {
    label: 'Mensal (Dia 1 às 9h)',
    value: '0 9 1 * *',
    description: 'Todo dia 1 do mês às 9:00'
  },
  {
    label: 'Trimestral',
    value: '0 9 1 1,4,7,10 *',
    description: 'A cada 3 meses no dia 1 às 9:00'
  },
  {
    label: 'Anual (1º de Janeiro)',
    value: '0 9 1 1 *',
    description: 'Todo dia 1 de janeiro às 9:00'
  }
];