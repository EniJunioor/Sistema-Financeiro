import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReportsService } from '../services/reports.service';
import { AnalyticsService } from '../services/analytics.service';
import { TrendsService } from '../services/trends.service';
import { AIForecastingService } from '../services/ai-forecasting.service';
import {
  AnalyticsQueryDto,
  FinancialSummaryDto,
  TrendAnalysisDto,
  PeriodComparisonDto,
  AIForecastDto,
  AIForecastQueryDto,
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
}