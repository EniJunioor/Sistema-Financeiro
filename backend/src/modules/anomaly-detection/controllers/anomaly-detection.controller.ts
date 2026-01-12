import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { AlertService } from '../services/alert.service';
import { AnomalySchedulerService } from '../services/anomaly-scheduler.service';
import { AnalyzeTransactionDto } from '../dto/analyze-transaction.dto';
import { AnomalyFiltersDto } from '../dto/anomaly-filters.dto';
import { User } from '@prisma/client';

@ApiTags('Anomaly Detection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('anomaly-detection')
export class AnomalyDetectionController {
  constructor(
    private readonly anomalyDetectionService: AnomalyDetectionService,
    private readonly alertService: AlertService,
    private readonly anomalySchedulerService: AnomalySchedulerService,
  ) {}

  @Post('analyze-transaction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze a transaction for anomalies' })
  @ApiResponse({ status: 200, description: 'Transaction analyzed successfully' })
  async analyzeTransaction(
    @CurrentUser() user: User,
    @Body() analyzeTransactionDto: AnalyzeTransactionDto,
  ) {
    return this.anomalyDetectionService.analyzeTransaction(
      user.id,
      analyzeTransactionDto,
    );
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get detected anomalies for user' })
  @ApiResponse({ status: 200, description: 'Anomalies retrieved successfully' })
  async getUserAnomalies(
    @CurrentUser() user: User,
    @Query() filters: AnomalyFiltersDto,
  ) {
    return this.anomalyDetectionService.getUserAnomalies(user.id, filters);
  }

  @Get('risk-score')
  @ApiOperation({ summary: 'Get current risk score for user' })
  @ApiResponse({ status: 200, description: 'Risk score calculated successfully' })
  async getRiskScore(@CurrentUser() user: User) {
    return this.anomalyDetectionService.calculateRiskScore(user.id);
  }

  @Post('train-model')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger model training for user' })
  @ApiResponse({ status: 200, description: 'Model training initiated' })
  async trainUserModel(@CurrentUser() user: User) {
    return this.anomalyDetectionService.trainUserModel(user.id);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get active alerts for user' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getUserAlerts(@CurrentUser() user: User) {
    return this.alertService.getUserAlerts(user.id);
  }

  @Post('alerts/:alertId/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  async acknowledgeAlert(
    @CurrentUser() user: User,
    @Param('alertId') alertId: string,
  ) {
    return this.alertService.acknowledgeAlert(user.id, alertId);
  }

  @Post('trigger-analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger immediate anomaly analysis for user' })
  @ApiResponse({ status: 200, description: 'Analysis triggered successfully' })
  async triggerImmediateAnalysis(@CurrentUser() user: User) {
    await this.anomalySchedulerService.triggerImmediateAnalysis(user.id);
    return { message: 'Immediate anomaly analysis triggered' };
  }

  @Get('monitoring-stats')
  @ApiOperation({ summary: 'Get anomaly monitoring statistics' })
  @ApiResponse({ status: 200, description: 'Monitoring stats retrieved successfully' })
  async getMonitoringStats() {
    return this.anomalySchedulerService.getMonitoringStats();
  }
}