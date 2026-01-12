import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import { TrendsService } from './trends.service';
import { AIForecastingService } from './ai-forecasting.service';
import { ReportTemplatesService, ReportTemplateConfig } from './report-templates.service';
import { ChartGeneratorService } from './chart-generator.service';
import { PDFGeneratorService, PDFReportData, ReportSectionData } from './pdf-generator.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { 
  GenerateReportDto, 
  ReportResponseDto, 
  ReportType, 
  ReportFormat, 
  ReportTemplate 
} from '../dto/generate-report.dto';

@Injectable()
export class ReportGeneratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly trendsService: TrendsService,
    private readonly aiForecasting: AIForecastingService,
    private readonly templatesService: ReportTemplatesService,
    private readonly chartGenerator: ChartGeneratorService,
    private readonly pdfGenerator: PDFGeneratorService,
    private readonly excelGenerator: ExcelGeneratorService,
  ) {}

  async generateReport(userId: string, reportDto: GenerateReportDto): Promise<ReportResponseDto> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get template configuration
    const templateConfig = reportDto.template 
      ? this.templatesService.getTemplate(reportDto.template)
      : this.getDefaultTemplateForType(reportDto.type);

    if (!templateConfig) {
      throw new BadRequestException('Invalid template or report type');
    }

    // Validate template configuration
    if (reportDto.template && !this.templatesService.validateTemplate(reportDto.template, reportDto.customConfig)) {
      throw new BadRequestException('Invalid template configuration');
    }

    // Set default date range if not provided
    const dateRange = this.getDateRange(reportDto, templateConfig);

    // Gather report data
    const reportData = await this.gatherReportData(userId, reportDto, templateConfig, dateRange);

    // Generate charts if requested
    const charts = reportDto.includeCharts !== false 
      ? await this.generateReportCharts(reportData, templateConfig)
      : [];

    // Prepare PDF report data
    const pdfData: PDFReportData = {
      title: reportDto.title || templateConfig.name,
      subtitle: reportDto.description,
      period: dateRange,
      user: {
        name: user.name || 'Usuário',
        email: user.email,
      },
      sections: reportData.sections,
      charts,
      metadata: {
        generatedAt: new Date(),
        reportType: reportDto.type,
        template: reportDto.template,
      },
    };

    // Generate report file
    let fileData: string;
    let fileName: string;
    let fileSize: number;

    switch (reportDto.format) {
      case ReportFormat.PDF:
        const pdfBuffer = await this.pdfGenerator.generatePDFReport(pdfData);
        fileData = pdfBuffer.toString('base64');
        fileName = `${this.sanitizeFileName(pdfData.title)}_${this.formatDateForFilename(new Date())}.pdf`;
        fileSize = pdfBuffer.length;
        break;

      case ReportFormat.EXCEL:
        const excelBuffer = await this.excelGenerator.generateExcelReport(pdfData);
        fileData = excelBuffer.toString('base64');
        fileName = `${this.sanitizeFileName(pdfData.title)}_${this.formatDateForFilename(new Date())}.xlsx`;
        fileSize = excelBuffer.length;
        break;

      case ReportFormat.CSV:
        // For CSV, we'll export the main table data
        const csvData = this.generateCSVData(reportData.sections);
        fileData = Buffer.from(csvData).toString('base64');
        fileName = `${this.sanitizeFileName(pdfData.title)}_${this.formatDateForFilename(new Date())}.csv`;
        fileSize = csvData.length;
        break;

      default:
        throw new BadRequestException('Unsupported report format');
    }

    // Calculate summary statistics
    const summary = await this.calculateReportSummary(userId, dateRange, reportDto);

    return {
      fileData,
      metadata: {
        reportId: this.generateReportId(),
        type: reportDto.type,
        format: reportDto.format,
        generatedAt: new Date(),
        fileSize,
        fileName,
      },
      summary,
    };
  }

  private getDefaultTemplateForType(reportType: ReportType): ReportTemplateConfig | undefined {
    const templates = this.templatesService.getTemplatesByType(reportType);
    return templates.length > 0 ? templates[0] : undefined;
  }

  private getDateRange(reportDto: GenerateReportDto, templateConfig: ReportTemplateConfig): { startDate: Date; endDate: Date } {
    const endDate = reportDto.endDate ? new Date(reportDto.endDate) : new Date();
    let startDate: Date;

    if (reportDto.startDate) {
      startDate = new Date(reportDto.startDate);
    } else {
      // Use template default period
      const now = new Date();
      switch (templateConfig.defaultPeriod) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    return { startDate, endDate };
  }

  private async gatherReportData(
    userId: string,
    reportDto: GenerateReportDto,
    templateConfig: ReportTemplateConfig,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<{ sections: ReportSectionData[] }> {
    const sections: ReportSectionData[] = [];

    // Get analytics query for the date range
    const analyticsQuery = {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      categories: reportDto.categories,
      accounts: reportDto.accounts,
    };

    for (const sectionConfig of templateConfig.sections) {
      // Skip excluded sections
      if (reportDto.customConfig?.excludeSections?.includes(sectionConfig.id)) {
        continue;
      }

      let sectionData: ReportSectionData;

      switch (sectionConfig.type) {
        case 'summary':
          sectionData = await this.generateSummarySection(userId, sectionConfig, analyticsQuery);
          break;
        case 'table':
          sectionData = await this.generateTableSection(userId, sectionConfig, analyticsQuery);
          break;
        case 'transactions':
          sectionData = await this.generateTransactionsSection(userId, sectionConfig, analyticsQuery);
          break;
        case 'text':
          sectionData = this.generateTextSection(sectionConfig);
          break;
        case 'chart':
          sectionData = this.generateChartSection(sectionConfig);
          break;
        default:
          continue;
      }

      sections.push(sectionData);
    }

    return { sections };
  }

  private async generateSummarySection(
    userId: string,
    sectionConfig: any,
    analyticsQuery: any
  ): Promise<ReportSectionData> {
    const financialSummary = await this.analyticsService.getFinancialSummary(userId, analyticsQuery);
    
    // Calculate savings rate
    const savingsRate = financialSummary.totalIncome > 0 
      ? ((financialSummary.totalIncome - financialSummary.totalExpenses) / financialSummary.totalIncome) * 100 
      : 0;
    
    const summaryData = [
      {
        title: 'Total de Receitas',
        value: financialSummary.totalIncome,
        format: 'currency' as const,
      },
      {
        title: 'Total de Despesas',
        value: financialSummary.totalExpenses,
        format: 'currency' as const,
      },
      {
        title: 'Resultado Líquido',
        value: financialSummary.netIncome,
        format: 'currency' as const,
      },
      {
        title: 'Taxa de Poupança',
        value: savingsRate,
        format: 'percentage' as const,
      },
    ];

    return {
      id: sectionConfig.id,
      title: sectionConfig.title,
      type: 'summary',
      content: summaryData,
      config: sectionConfig.config,
    };
  }

  private async generateTableSection(
    userId: string,
    sectionConfig: any,
    analyticsQuery: any
  ): Promise<ReportSectionData> {
    const financialSummary = await this.analyticsService.getFinancialSummary(userId, analyticsQuery);
    
    // Generate category breakdown table
    const headers = ['Categoria', 'Valor', 'Percentual'];
    const rows = financialSummary.categoryBreakdown.map(category => [
      category.categoryName,
      category.amount,
      category.percentage,
    ]);

    const totalAmount = financialSummary.categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
    const totals = ['Total', totalAmount, 100];

    return {
      id: sectionConfig.id,
      title: sectionConfig.title,
      type: 'table',
      content: {
        headers,
        rows,
        totals,
      },
      config: sectionConfig.config,
    };
  }

  private async generateTransactionsSection(
    userId: string,
    sectionConfig: any,
    analyticsQuery: any
  ): Promise<ReportSectionData> {
    const limit = sectionConfig.config?.limit || 50;
    const transactionType = sectionConfig.config?.transactionType;
    const sortBy = sectionConfig.config?.sortBy || 'date';

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: new Date(analyticsQuery.startDate),
          lte: new Date(analyticsQuery.endDate),
        },
        ...(transactionType && { type: transactionType }),
        ...(analyticsQuery.categories && { categoryId: { in: analyticsQuery.categories } }),
        ...(analyticsQuery.accounts && { accountId: { in: analyticsQuery.accounts } }),
      },
      include: {
        category: true,
      },
      orderBy: sortBy === 'amount' ? { amount: 'desc' } : { date: 'desc' },
      take: limit,
    });

    const transactionData = transactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type as 'income' | 'expense' | 'transfer',
      date: t.date,
      categoryName: t.category?.name,
    }));

    return {
      id: sectionConfig.id,
      title: sectionConfig.title,
      type: 'transactions',
      content: transactionData,
      config: sectionConfig.config,
    };
  }

  private generateTextSection(sectionConfig: any): ReportSectionData {
    return {
      id: sectionConfig.id,
      title: sectionConfig.title,
      type: 'text',
      content: sectionConfig.config?.text || 'Conteúdo de texto personalizado.',
      config: sectionConfig.config,
    };
  }

  private generateChartSection(sectionConfig: any): ReportSectionData {
    return {
      id: sectionConfig.id,
      title: sectionConfig.title,
      type: 'chart',
      content: { chartId: sectionConfig.id },
      config: sectionConfig.config,
    };
  }

  private async generateReportCharts(
    reportData: { sections: ReportSectionData[] },
    templateConfig: ReportTemplateConfig
  ): Promise<Array<{ id: string; title: string; base64Image: string }>> {
    const charts: Array<{ id: string; title: string; base64Image: string }> = [];

    for (const chartConfig of templateConfig.chartTypes) {
      try {
        let chartData;
        let chartOptions;

        // Generate chart based on data source
        switch (chartConfig.dataSource) {
          case 'income_by_category':
          case 'expense_by_category':
            const summarySection = reportData.sections.find(s => s.type === 'summary');
            if (summarySection) {
              chartData = this.prepareCategoryChartData(summarySection.content);
              chartOptions = {
                title: chartConfig.title,
                width: 600,
                height: 400,
                type: chartConfig.type,
                currency: 'BRL',
              };
            }
            break;

          default:
            // Skip unknown data sources
            continue;
        }

        if (chartData && chartOptions) {
          const base64Image = await this.chartGenerator.generateBase64Chart(chartData, chartOptions);
          charts.push({
            id: chartConfig.id,
            title: chartConfig.title,
            base64Image,
          });
        }
      } catch (error) {
        console.error(`Failed to generate chart ${chartConfig.id}:`, error);
        // Continue with other charts
      }
    }

    return charts;
  }

  private prepareCategoryChartData(summaryContent: any): any {
    // This is a simplified implementation
    // In a real scenario, you'd extract the appropriate data based on the chart type
    return {
      labels: ['Categoria 1', 'Categoria 2', 'Categoria 3'],
      datasets: [{
        label: 'Valor',
        data: [1000, 800, 600],
      }],
    };
  }

  private generateCSVData(sections: ReportSectionData[]): string {
    const csvRows: string[] = [];
    
    for (const section of sections) {
      if (section.type === 'table') {
        const tableData = section.content as { headers: string[]; rows: Array<Array<string | number>> };
        
        // Add section title
        csvRows.push(`"${section.title}"`);
        csvRows.push('');
        
        // Add headers
        csvRows.push(tableData.headers.map(h => `"${h}"`).join(','));
        
        // Add rows
        tableData.rows.forEach(row => {
          csvRows.push(row.map(cell => `"${cell}"`).join(','));
        });
        
        csvRows.push('');
      }
    }

    return csvRows.join('\n');
  }

  private async calculateReportSummary(
    userId: string,
    dateRange: { startDate: Date; endDate: Date },
    reportDto: GenerateReportDto
  ): Promise<any> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
        ...(reportDto.categories && { categoryId: { in: reportDto.categories } }),
        ...(reportDto.accounts && { accountId: { in: reportDto.accounts } }),
      },
      include: {
        category: true,
        account: true,
      },
    });

    const categories = new Set(transactions.map(t => t.category?.name).filter(Boolean));
    const accounts = new Set(transactions.map(t => t.account?.name).filter(Boolean));

    return {
      totalTransactions: transactions.length,
      dateRange,
      categoriesIncluded: categories.size,
      accountsIncluded: accounts.size,
    };
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9\-_]/g, '_');
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}