import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { AnalyticsService } from './services/analytics.service';
import { TrendsService } from './services/trends.service';
import { AIForecastingService } from './services/ai-forecasting.service';
import { ReportGeneratorService } from './services/report-generator.service';
import { ReportTemplatesService } from './services/report-templates.service';
import { ChartGeneratorService } from './services/chart-generator.service';
import { PDFGeneratorService } from './services/pdf-generator.service';
import { ExcelGeneratorService } from './services/excel-generator.service';
import { ReportSchedulerService } from './services/report-scheduler.service';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    CacheModule.register({
      ttl: 300, // 5 minutes cache for analytics data
    }),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    AnalyticsService,
    TrendsService,
    AIForecastingService,
    ReportGeneratorService,
    ReportTemplatesService,
    ChartGeneratorService,
    PDFGeneratorService,
    ExcelGeneratorService,
    ReportSchedulerService,
  ],
  exports: [
    ReportsService,
    AnalyticsService,
    TrendsService,
    AIForecastingService,
    ReportGeneratorService,
    ReportSchedulerService,
  ],
})
export class ReportsModule {}