import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './controllers/auth.controller';
import { ProfileController } from './controllers/profile.controller';
import { AuthService } from './services/auth.service';
import { TwoFactorService } from './services/two-factor.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { RateLimitService } from './services/rate-limit.service';
import { 
  JwtStrategy, 
  LocalStrategy, 
  GoogleStrategy, 
  FacebookStrategy, 
  MicrosoftStrategy 
} from './strategies';
import { JwtAuthGuard } from './guards';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ThrottlerModule.forRoot({
      ttl: 60000, // 1 minute
      limit: 10, // 10 requests per minute
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', '24h') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, ProfileController],
  providers: [
    AuthService,
    TwoFactorService,
    EmailService,
    SmsService,
    RateLimitService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    FacebookStrategy,
    MicrosoftStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, JwtModule, TwoFactorService, RateLimitService],
})
export class AuthModule {}