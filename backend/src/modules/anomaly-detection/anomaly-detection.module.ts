import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AnomalyDetectionController } from './controllers/anomaly-detection.controller';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { AlertService } from './services/alert.service';
import { FCMService } from './services/fcm.service';
import { AnomalySchedulerService } from './services/anomaly-scheduler.service';
import { AnomalyProcessor } from './processors/anomaly.processor';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'anomaly-detection',
    }),
  ],
  controllers: [AnomalyDetectionController],
  providers: [
    AnomalyDetectionService,
    FraudDetectionService,
    AlertService,
    FCMService,
    AnomalySchedulerService,
    AnomalyProcessor,
  ],
  exports: [AnomalyDetectionService, AlertService, AnomalySchedulerService],
})
export class AnomalyDetectionModule {}