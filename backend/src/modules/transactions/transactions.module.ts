import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AnomalyDetectionModule } from '../anomaly-detection/anomaly-detection.module';
import { TransactionsController } from './controllers/transactions.controller';
import { DeduplicationController } from './controllers/deduplication.controller';
import { TransactionsService } from './services/transactions.service';
import { CategoryService } from './services/category.service';
import { MLCategorizationService } from './services/ml-categorization.service';
import { RecurringTransactionsService } from './services/recurring-transactions.service';
import { RecurringSchedulerService } from './services/recurring-scheduler.service';
import { DeduplicationService } from './services/deduplication.service';
import { RecurringTransactionsProcessor } from './processors/recurring-transactions.processor';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AnomalyDetectionModule),
    CacheModule.register({
      ttl: 300, // 5 minutes
    }),
    BullModule.registerQueue({
      name: 'transactions',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [TransactionsController, DeduplicationController],
  providers: [
    TransactionsService,
    CategoryService,
    MLCategorizationService,
    RecurringTransactionsService,
    RecurringSchedulerService,
    DeduplicationService,
    RecurringTransactionsProcessor,
  ],
  exports: [
    TransactionsService, 
    CategoryService,
    RecurringTransactionsService,
    RecurringSchedulerService,
    DeduplicationService,
  ],
})
export class TransactionsModule {}