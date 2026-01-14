import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { SecurityModule as CommonSecurityModule } from './common/security/security.module';
import { SecurityModule } from './modules/security/security.module';
import { AuthModule } from './modules/auth/auth.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { GoalsModule } from './modules/goals/goals.module';
import { AnomalyDetectionModule } from './modules/anomaly-detection/anomaly-detection.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Enhanced rate limiting
    ThrottlerModule.forRoot({
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }),

    // Cache with Redis
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default
      store: 'redis',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || 'redis123',
    }),

    // Queue system with Redis
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || 'redis123',
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
      },
    }),

    // Database
    PrismaModule,

    // Security (Global)
    CommonSecurityModule,

    // Feature modules
    SecurityModule,
    AuthModule,
    TransactionsModule,
    ReportsModule,
    AccountsModule,
    InvestmentsModule,
    GoalsModule,
    AnomalyDetectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}