import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

interface FCMNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface FCMMessage {
  to?: string;
  registration_ids?: string[];
  notification: {
    title: string;
    body: string;
    icon?: string;
    click_action?: string;
  };
  data?: Record<string, string>;
  priority: 'normal' | 'high';
  time_to_live?: number;
}

@Injectable()
export class FCMService {
  private readonly logger = new Logger(FCMService.name);
  private readonly fcmServerKey: string;
  private readonly fcmUrl = 'https://fcm.googleapis.com/fcm/send';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.fcmServerKey = this.configService.get<string>('FCM_SERVER_KEY') || '';
    
    if (!this.fcmServerKey) {
      this.logger.warn('FCM_SERVER_KEY not configured. Push notifications will be disabled.');
    }
  }

  async sendNotification(userId: string, notification: FCMNotification): Promise<void> {
    if (!this.fcmServerKey) {
      this.logger.warn('FCM not configured, skipping push notification');
      return;
    }

    try {
      // Get user's FCM tokens
      const tokens = await this.getUserFCMTokens(userId);
      
      if (tokens.length === 0) {
        this.logger.log(`No FCM tokens found for user ${userId}`);
        return;
      }

      // Send notification to all user devices
      await this.sendToTokens(tokens, notification);
      
      this.logger.log(`Push notification sent to ${tokens.length} devices for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending FCM notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendToTokens(tokens: string[], notification: FCMNotification): Promise<void> {
    if (tokens.length === 0) return;

    const message: FCMMessage = {
      registration_ids: tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: 'ic_notification',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      data: notification.data || {},
      priority: 'high',
      time_to_live: 86400, // 24 hours
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.fcmUrl, message, {
          headers: {
            'Authorization': `key=${this.fcmServerKey}`,
            'Content-Type': 'application/json',
          },
        })
      );

      const result = response.data;
      
      if (result.failure > 0) {
        this.logger.warn(`FCM notification failures: ${result.failure}/${result.success + result.failure}`);
        
        // Handle invalid tokens
        if (result.results) {
          await this.handleInvalidTokens(tokens, result.results);
        }
      }

      this.logger.log(`FCM notification sent successfully: ${result.success}/${result.success + result.failure} devices`);
    } catch (error) {
      this.logger.error(`FCM API error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async registerToken(userId: string, token: string, deviceInfo?: any): Promise<void> {
    try {
      // Check if token already exists
      const existingToken = await this.prisma.session.findFirst({
        where: {
          userId,
          token,
        },
      });

      if (existingToken) {
        // Update existing token
        await this.prisma.session.update({
          where: { id: existingToken.id },
          data: {
            deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : existingToken.deviceInfo,
          },
        });
      } else {
        // Create new token record
        await this.prisma.session.create({
          data: {
            userId,
            token,
            deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
            isActive: true,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
        });
      }

      this.logger.log(`FCM token registered for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error registering FCM token: ${error.message}`, error.stack);
      throw error;
    }
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    try {
      await this.prisma.session.deleteMany({
        where: {
          userId,
          token,
        },
      });

      this.logger.log(`FCM token unregistered for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error unregistering FCM token: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendBulkNotification(
    userIds: string[],
    notification: FCMNotification,
  ): Promise<void> {
    try {
      const allTokens: string[] = [];
      
      for (const userId of userIds) {
        const tokens = await this.getUserFCMTokens(userId);
        allTokens.push(...tokens);
      }

      if (allTokens.length === 0) {
        this.logger.log('No FCM tokens found for bulk notification');
        return;
      }

      // FCM supports up to 1000 tokens per request
      const batchSize = 1000;
      const batches = [];
      
      for (let i = 0; i < allTokens.length; i += batchSize) {
        batches.push(allTokens.slice(i, i + batchSize));
      }

      // Send to all batches
      for (const batch of batches) {
        await this.sendToTokens(batch, notification);
      }

      this.logger.log(`Bulk notification sent to ${allTokens.length} devices across ${userIds.length} users`);
    } catch (error) {
      this.logger.error(`Error sending bulk FCM notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendTopicNotification(topic: string, notification: FCMNotification): Promise<void> {
    if (!this.fcmServerKey) {
      this.logger.warn('FCM not configured, skipping topic notification');
      return;
    }

    const message = {
      to: `/topics/${topic}`,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: 'ic_notification',
      },
      data: notification.data || {},
      priority: 'high',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.fcmUrl, message, {
          headers: {
            'Authorization': `key=${this.fcmServerKey}`,
            'Content-Type': 'application/json',
          },
        })
      );

      this.logger.log(`Topic notification sent to ${topic}: ${response.data.message_id}`);
    } catch (error) {
      this.logger.error(`Error sending topic notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getUserFCMTokens(userId: string): Promise<string[]> {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        select: { token: true },
      });

      return sessions.map(session => session.token).filter(token => 
        token && token.length > 50 // FCM tokens are typically much longer
      );
    } catch (error) {
      this.logger.error(`Error getting FCM tokens for user ${userId}: ${error.message}`);
      return [];
    }
  }

  private async handleInvalidTokens(tokens: string[], results: any[]): Promise<void> {
    try {
      const invalidTokens: string[] = [];

      results.forEach((result, index) => {
        if (result.error === 'NotRegistered' || result.error === 'InvalidRegistration') {
          invalidTokens.push(tokens[index]);
        }
      });

      if (invalidTokens.length > 0) {
        // Remove invalid tokens from database
        await this.prisma.session.deleteMany({
          where: {
            token: { in: invalidTokens },
          },
        });

        this.logger.log(`Removed ${invalidTokens.length} invalid FCM tokens`);
      }
    } catch (error) {
      this.logger.error(`Error handling invalid tokens: ${error.message}`, error.stack);
    }
  }

  // Utility method to create notification for different alert types
  createAnomalyNotification(
    alertType: 'fraud_detection' | 'unusual_spending' | 'goal_risk' | 'account_security',
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any,
  ): FCMNotification {
    let title = '';
    let body = '';
    let icon = 'ic_notification';

    switch (alertType) {
      case 'fraud_detection':
        title = '🚨 Suspicious Activity';
        body = 'Potential fraudulent transaction detected';
        icon = 'ic_security_alert';
        break;
      case 'unusual_spending':
        title = '💰 Unusual Spending';
        body = 'Transaction amount is significantly higher than usual';
        icon = 'ic_money_alert';
        break;
      case 'goal_risk':
        title = '🎯 Goal at Risk';
        body = 'Your financial goal may be at risk';
        icon = 'ic_goal_alert';
        break;
      case 'account_security':
        title = '🔒 Account Security';
        body = 'Security event detected on your account';
        icon = 'ic_security_alert';
        break;
    }

    return {
      title,
      body,
      data: {
        alertType,
        severity,
        details: JSON.stringify(details),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Enhanced notification for real-time anomaly alerts
  async sendAnomalyAlert(
    userId: string,
    anomalyType: 'fraud_detection' | 'unusual_spending' | 'goal_risk' | 'account_security',
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    details: any,
  ): Promise<void> {
    try {
      const notification: FCMNotification = {
        title,
        body: message,
        data: {
          type: 'anomaly_alert',
          anomalyType,
          severity,
          details: JSON.stringify(details),
          timestamp: new Date().toISOString(),
          requiresAction: severity === 'critical' ? 'true' : 'false',
        },
      };

      await this.sendNotification(userId, notification);
      
      this.logger.log(`Anomaly alert sent to user ${userId}: ${title}`);
    } catch (error) {
      this.logger.error(`Failed to send anomaly alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Send bulk anomaly alerts to multiple users
  async sendBulkAnomalyAlert(
    userIds: string[],
    anomalyType: 'fraud_detection' | 'unusual_spending' | 'goal_risk' | 'account_security',
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
  ): Promise<void> {
    try {
      const notification: FCMNotification = {
        title,
        body: message,
        data: {
          type: 'bulk_anomaly_alert',
          anomalyType,
          severity,
          timestamp: new Date().toISOString(),
        },
      };

      await this.sendBulkNotification(userIds, notification);
      
      this.logger.log(`Bulk anomaly alert sent to ${userIds.length} users: ${title}`);
    } catch (error) {
      this.logger.error(`Failed to send bulk anomaly alert: ${error.message}`, error.stack);
      throw error;
    }
  }
}