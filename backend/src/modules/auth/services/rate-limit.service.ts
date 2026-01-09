import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

interface LoginAttemptInfo {
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

@Injectable()
export class RateLimitService {
  private readonly maxFailedAttempts: number;
  private readonly lockoutDuration: number; // in minutes
  private readonly suspiciousThreshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {
    this.maxFailedAttempts = this.configService.get('MAX_FAILED_ATTEMPTS', 5);
    this.lockoutDuration = this.configService.get('LOCKOUT_DURATION_MINUTES', 15);
    this.suspiciousThreshold = this.configService.get('SUSPICIOUS_THRESHOLD', 3);
  }

  async recordLoginAttempt(attemptInfo: LoginAttemptInfo): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: attemptInfo.email },
      select: { id: true, name: true, smsPhone: true },
    });

    // Record the attempt
    await this.prisma.loginAttempt.create({
      data: {
        userId: user?.id,
        email: attemptInfo.email,
        ipAddress: attemptInfo.ipAddress,
        userAgent: attemptInfo.userAgent,
        success: attemptInfo.success,
        failureReason: attemptInfo.failureReason,
      },
    });

    // If login failed, check for suspicious activity
    if (!attemptInfo.success && user) {
      await this.checkSuspiciousActivity(user.id, attemptInfo);
    }
  }

  async isAccountLocked(email: string): Promise<{ locked: boolean; remainingTime?: number }> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - this.lockoutDuration);

    const recentFailedAttempts = await this.prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: {
          gte: cutoffTime,
        },
      },
    });

    if (recentFailedAttempts >= this.maxFailedAttempts) {
      // Find the most recent failed attempt to calculate remaining time
      const lastFailedAttempt = await this.prisma.loginAttempt.findFirst({
        where: {
          email,
          success: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (lastFailedAttempt) {
        const unlockTime = new Date(lastFailedAttempt.createdAt);
        unlockTime.setMinutes(unlockTime.getMinutes() + this.lockoutDuration);
        
        const now = new Date();
        if (now < unlockTime) {
          const remainingTime = Math.ceil((unlockTime.getTime() - now.getTime()) / (1000 * 60));
          return { locked: true, remainingTime };
        }
      }
    }

    return { locked: false };
  }

  async getFailedAttemptCount(email: string): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - this.lockoutDuration);

    return this.prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: {
          gte: cutoffTime,
        },
      },
    });
  }

  async clearFailedAttempts(email: string): Promise<void> {
    // We don't actually delete the records for audit purposes,
    // but we can mark them as cleared or just rely on the time-based logic
    // For now, we'll just let the time-based logic handle it
  }

  private async checkSuspiciousActivity(userId: string, attemptInfo: LoginAttemptInfo): Promise<void> {
    // Check for multiple failed attempts from different IPs in a short time
    const recentAttempts = await this.prisma.loginAttempt.findMany({
      where: {
        userId,
        success: false,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
      select: {
        ipAddress: true,
        userAgent: true,
      },
    });

    const uniqueIPs = new Set(recentAttempts.map(attempt => attempt.ipAddress));
    
    if (uniqueIPs.size >= this.suspiciousThreshold) {
      await this.alertSuspiciousActivity(userId, attemptInfo);
    }

    // Check for attempts from new/unusual locations
    const userAttempts = await this.prisma.loginAttempt.findMany({
      where: {
        userId,
        success: true,
      },
      select: {
        ipAddress: true,
      },
      distinct: ['ipAddress'],
    });

    const knownIPs = new Set(userAttempts.map(attempt => attempt.ipAddress));
    
    if (!knownIPs.has(attemptInfo.ipAddress) && recentAttempts.length >= 2) {
      await this.alertSuspiciousActivity(userId, attemptInfo);
    }
  }

  private async alertSuspiciousActivity(userId: string, attemptInfo: LoginAttemptInfo): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, smsPhone: true },
    });

    if (!user) return;

    const location = await this.getLocationFromIP(attemptInfo.ipAddress);

    // Send email alert
    await this.emailService.sendSuspiciousLoginAlert(
      user.email,
      user.name || 'Usuário',
      attemptInfo.ipAddress,
      location,
      attemptInfo.userAgent || 'Desconhecido',
    );

    // Send SMS alert if phone number is available
    if (user.smsPhone) {
      await this.smsService.sendSuspiciousLoginAlert(
        user.smsPhone,
        attemptInfo.ipAddress,
        location,
      );
    }
  }

  private async getLocationFromIP(ipAddress: string): Promise<string> {
    // In a real implementation, you would use a geolocation service
    // For now, return a placeholder
    if (ipAddress === '127.0.0.1' || ipAddress === '::1') {
      return 'Local';
    }
    return 'Localização desconhecida';
  }

  async getLoginHistory(userId: string, limit: number = 10): Promise<any[]> {
    return this.prisma.loginAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        success: true,
        failureReason: true,
        createdAt: true,
      },
    });
  }
}