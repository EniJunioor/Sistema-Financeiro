import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReportsService } from '../services/reports.service';
import { AnalyticsService } from '../services/analytics.service';
import { TrendsService } from '../services/trends.service';
import { AIForecastingService } from '../services/ai-forecasting.service';
import { ReportGeneratorService } from '../services/report-generator.service';
import { ReportSchedulerService } from '../services/report-scheduler.service';
import {
  AnalyticsQueryDto,
  FinancialSummaryDto,
  TrendAnalysisDto,
  PeriodComparisonDto,
  AIForecastDto,
  AIForecastQueryDto,
  GenerateReportDto,
  ScheduleReportDto,
  ReportResponseDto,
  ScheduledReportDto,
} from '../dto';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly analyticsService: AnalyticsService,
    private readonly trendsService: TrendsService,
    private readonly aiForecastingService: AIForecastingService,
    private readonly reportGenerator: ReportGeneratorService,
    private readonly reportScheduler: ReportSchedulerService,
  ) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get complete dashboard data',
    description: 'Returns financial summary, trends, and period comparison for dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getDashboardData(
    @Request() req: any,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.reportsService.getDashboardData(req.user.id, query);
  }

  @Get('financial-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get financial summary',
    description: 'Returns comprehensive financial summary with income, expenses, and breakdowns',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial summary retrieved successfully',
    type: FinancialSummaryDto,
  })
  async getFinancialSummary(
    @Request() req: any,
    @Query() query: AnalyticsQueryDto,
  ): Promise<FinancialSummaryDto> {
    return this.analyticsService.getFinancialSummary(req.user.id, query);
  }

  @Get('trends')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get trend analysis',
    description: 'Returns historical trends and future projections based on spending patterns',
  })
  @ApiResponse({
    status: 200,
    description: 'Trend analysis retrieved successfully',
    type: TrendAnalysisDto,
  })
  async getTrendAnalysis(
    @Request() req: any,
    @Query() query: AnalyticsQueryDto,
  ): Promise<TrendAnalysisDto> {
    return this.trendsService.getTrendAnalysis(req.user.id, query);
  }

  @Get('period-comparison')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get period comparison',
    description: 'Compares current period with previous period and provides insights',
  })
  @ApiResponse({
    status: 200,
    description: 'Period comparison retrieved successfully',
    type: PeriodComparisonDto,
  })
  async getPeriodComparison(
    @Request() req: any,
    @Query() query: AnalyticsQueryDto,
  ): Promise<PeriodComparisonDto> {
    return this.trendsService.getPeriodComparison(req.user.id, query);
  }

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get financial overview',
    description: 'Returns quick financial overview with key metrics and recent transactions',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial overview retrieved successfully',
  })
  async getFinancialOverview(@Request() req: any) {
    return this.reportsService.getFinancialOverview(req.user.id);
  }

  @Get('cash-flow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cash flow analysis',
    description: 'Returns detailed cash flow analysis with projections and volatility metrics',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Number of months to analyze (default: 12)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cash flow analysis retrieved successfully',
  })
  async getCashFlowAnalysis(
    @Request() req: any,
    @Query('months') months?: number,
  ) {
    return this.reportsService.getCashFlowAnalysis(
      req.user.id,
      months ? parseInt(months.toString()) : 12,
    );
  }

  @Get('spending-patterns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get spending patterns',
    description: 'Returns spending patterns by day of week, month, and category trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Spending patterns retrieved successfully',
  })
  async getSpendingPatterns(@Request() req: any) {
    return this.reportsService.getSpendingPatterns(req.user.id);
  }

  @Get('transactions-by-period')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transactions grouped by period',
    description: 'Returns transactions aggregated by specified time period for charts',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions by period retrieved successfully',
  })
  async getTransactionsByPeriod(
    @Request() req: any,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getTransactionsByPeriod(req.user.id, query);
  }

  @Get('ai-forecast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get AI-powered financial forecast',
    description: 'Returns AI-generated predictions for spending, income, and category-wise forecasts with anomaly detection',
  })
  @ApiResponse({
    status: 200,
    description: 'AI forecast generated successfully',
    type: AIForecastDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient historical data for forecasting',
  })
  async getAIForecast(
    @Request() req: any,
    @Query() analyticsQuery: AnalyticsQueryDto,
    @Query() forecastQuery: AIForecastQueryDto,
  ): Promise<AIForecastDto> {
    const forecastMonths = forecastQuery.forecastMonths || 6;
    return this.aiForecastingService.generateAIForecast(
      req.user.id,
      analyticsQuery,
      forecastMonths,
    );
  }

  @Get('spending-predictions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get spending predictions only',
    description: 'Returns AI-generated spending predictions for future periods',
  })
  @ApiResponse({
    status: 200,
    description: 'Spending predictions retrieved successfully',
  })
  async getSpendingPredictions(
    @Request() req: any,
    @Query() analyticsQuery: AnalyticsQueryDto,
    @Query() forecastQuery: AIForecastQueryDto,
  ) {
    const forecast = await this.aiForecastingService.generateAIForecast(
      req.user.id,
      analyticsQuery,
      forecastQuery.forecastMonths || 6,
    );
    return {
      spendingPredictions: forecast.spendingPredictions,
      confidenceScore: forecast.confidenceScore,
      generatedAt: forecast.generatedAt,
    };
  }

  @Get('income-predictions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get income predictions only',
    description: 'Returns AI-generated income predictions for future periods',
  })
  @ApiResponse({
    status: 200,
    description: 'Income predictions retrieved successfully',
  })
  async getIncomePredictions(
    @Request() req: any,
    @Query() analyticsQuery: AnalyticsQueryDto,
    @Query() forecastQuery: AIForecastQueryDto,
  ) {
    const forecast = await this.aiForecastingService.generateAIForecast(
      req.user.id,
      analyticsQuery,
      forecastQuery.forecastMonths || 6,
    );
    return {
      incomePredictions: forecast.incomePredictions,
      confidenceScore: forecast.confidenceScore,
      generatedAt: forecast.generatedAt,
    };
  }

  @Get('anomaly-detection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get anomaly detection results',
    description: 'Returns detected anomalies in spending patterns using AI analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Anomaly detection completed successfully',
  })
  async getAnomalyDetection(
    @Request() req: any,
    @Query() analyticsQuery: AnalyticsQueryDto,
  ) {
    const forecast = await this.aiForecastingService.generateAIForecast(
      req.user.id,
      analyticsQuery,
      1, // Only need 1 month for anomaly detection
    );
    return {
      anomalies: forecast.anomalies,
      confidenceScore: forecast.confidenceScore,
      generatedAt: forecast.generatedAt,
    };
  }

  // Report Generation Endpoints

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate financial report',
    description: 'Generates a financial report in PDF, Excel, or CSV format based on specified parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid report parameters',
  })
  async generateReport(
    @Request() req: any,
    @Body() generateReportDto: GenerateReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportGenerator.generateReport(req.user.id, generateReportDto);
  }

  @Post('generate/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate and download financial report',
    description: 'Generates a financial report and returns it as a downloadable file',
  })
  @ApiResponse({
    status: 200,
    description: 'Report file downloaded successfully',
  })
  async generateAndDownloadReport(
    @Request() req: any,
    @Body() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const reportResult = await this.reportGenerator.generateReport(req.user.id, generateReportDto);
    
    const fileBuffer = Buffer.from(reportResult.fileData, 'base64');
    const contentType = this.getContentType(generateReportDto.format);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${reportResult.metadata.fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    res.send(fileBuffer);
  }

  // Report Scheduling Endpoints

  @Post('schedule')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Schedule automatic report generation',
    description: 'Creates a scheduled report that will be generated and emailed automatically',
  })
  @ApiResponse({
    status: 201,
    description: 'Report scheduled successfully',
    type: ScheduledReportDto,
  })
  async scheduleReport(
    @Request() req: any,
    @Body() scheduleReportDto: ScheduleReportDto,
  ): Promise<ScheduledReportDto> {
    return this.reportScheduler.scheduleReport(req.user.id, scheduleReportDto);
  }

  @Get('scheduled')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all scheduled reports',
    description: 'Returns all scheduled reports for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled reports retrieved successfully',
    type: [ScheduledReportDto],
  })
  async getScheduledReports(@Request() req: any): Promise<ScheduledReportDto[]> {
    return this.reportScheduler.getScheduledReports(req.user.id);
  }

  @Get('scheduled/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get scheduled report by ID',
    description: 'Returns details of a specific scheduled report',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled report retrieved successfully',
    type: ScheduledReportDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled report not found',
  })
  async getScheduledReport(
    @Request() req: any,
    @Param('id') reportId: string,
  ): Promise<ScheduledReportDto> {
    const report = await this.reportScheduler.getScheduledReport(req.user.id, reportId);
    if (!report) {
      throw new Error('Scheduled report not found');
    }
    return report;
  }

  @Put('scheduled/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update scheduled report',
    description: 'Updates configuration of an existing scheduled report',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled report updated successfully',
    type: ScheduledReportDto,
  })
  async updateScheduledReport(
    @Request() req: any,
    @Param('id') reportId: string,
    @Body() updateDto: Partial<ScheduleReportDto>,
  ): Promise<ScheduledReportDto> {
    return this.reportScheduler.updateScheduledReport(req.user.id, reportId, updateDto);
  }

  @Put('scheduled/:id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle scheduled report active status',
    description: 'Enables or disables a scheduled report',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled report status updated successfully',
    type: ScheduledReportDto,
  })
  async toggleScheduledReport(
    @Request() req: any,
    @Param('id') reportId: string,
    @Body('isActive') isActive: boolean,
  ): Promise<ScheduledReportDto> {
    return this.reportScheduler.toggleScheduledReport(req.user.id, reportId, isActive);
  }

  @Delete('scheduled/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete scheduled report',
    description: 'Removes a scheduled report and stops its execution',
  })
  @ApiResponse({
    status: 204,
    description: 'Scheduled report deleted successfully',
  })
  async deleteScheduledReport(
    @Request() req: any,
    @Param('id') reportId: string,
  ): Promise<void> {
    await this.reportScheduler.deleteScheduledReport(req.user.id, reportId);
  }

  // Template Management Endpoints

  @Get('templates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get available report templates',
    description: 'Returns all available report templates with their configurations',
  })
  @ApiResponse({
    status: 200,
    description: 'Report templates retrieved successfully',
  })
  async getReportTemplates() {
    // This would be implemented to return template information
    return {
      templates: [
        {
          id: 'dre',
          name: 'Demonstração do Resultado do Exercício (DRE)',
          description: 'Relatório financeiro que mostra receitas, despesas e resultado líquido do período',
          supportedFormats: ['pdf', 'excel'],
          defaultPeriod: 'month',
        },
        {
          id: 'cash_flow',
          name: 'Relatório de Fluxo de Caixa',
          description: 'Análise detalhada do fluxo de entrada e saída de recursos',
          supportedFormats: ['pdf', 'excel'],
          defaultPeriod: 'year',
        },
        // Add other templates...
      ],
    };
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }
}