import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }),

    // Cache
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default
    }),

    // Queue system
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || 'redis123',
      },
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}