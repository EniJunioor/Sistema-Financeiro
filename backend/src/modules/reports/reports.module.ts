import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { AnalyticsService } from './services/analytics.service';
import { TrendsService } from './services/trends.service';
import { AIForecastingService } from './services/ai-forecasting.service';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes cache for analytics data
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, AnalyticsService, TrendsService, AIForecastingService],
  exports: [ReportsService, AnalyticsService, TrendsService, AIForecastingService],
})
export class ReportsModule {}