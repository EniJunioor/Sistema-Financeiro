import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { CategoryService } from './services/category.service';
import { MLCategorizationService } from './services/ml-categorization.service';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes
    }),
    BullModule.registerQueue({
      name: 'transactions',
    }),
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    CategoryService,
    MLCategorizationService,
  ],
  exports: [TransactionsService, CategoryService],
})
export class TransactionsModule {}