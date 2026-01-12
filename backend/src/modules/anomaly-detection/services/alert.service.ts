import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { FCMService } from './fcm.service';
import { AnomalyDetectionResult, AnomalyAlert } from '../interfaces/anomaly.interface';
import { AnalyzeTransactionDto } from '../dto/analyze-transaction.dto';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FCMService,
  ) {}

  async createAnomalyAlert(
    userId: string,
    anomalyResult: AnomalyDetectionResult,
    transactionData: AnalyzeTransactionDto,
  ): Promise<AnomalyAlert> {
    try {
      const alert: AnomalyAlert = {
        id: '', // Will be set by database
        userId,
        type: this.mapAnomalyTypeToAlertType(anomalyResult.anomalyType),
        severity: anomalyResult.severity,
        title: this.generateAlertTitle(anomalyResult),
        message: this.generateAlertMessage(anomalyResult, transactionData),
        details: {
          transactionAmount: transactionData.amount,
          transactionDescription: transactionData.description,
          transactionDate: transactionData.date,
          confidence: anomalyResult.confidence,
          riskScore: anomalyResult.riskScore,
          reasons: anomalyResult.reasons,
          recommendations: anomalyResult.recommendations,
        },
        isAcknowledged: false,
        createdAt: new Date(),
      };

      // Save alert to database
      const savedAlert = await this.prisma.notification.create({
        data: {
          userId,
          title: alert.title,
          message: alert.message,
          type: this.mapSeverityToNotificationType(alert.severity),
          metadata: JSON.stringify(alert.details),
        },
      });

      alert.id = savedAlert.id;

      // Send push notification if severity is medium or higher
      if (alert.severity !== 'low') {
        await this.sendPushNotification(userId, alert);
      }

      // Send real-time notification via WebSocket (if implemented)
      await this.sendRealtimeNotification(userId, alert);

      this.logger.log(`Created anomaly alert for user ${userId}: ${alert.title}`);
      return alert;
    } catch (error) {
      this.logger.error(`Error creating anomaly alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createGoalRiskAlert(
    userId: string,
    goalId: string,
    riskLevel: 'low' | 'medium' | 'high',
    message: string,
  ): Promise<AnomalyAlert> {
    try {
      const alert: AnomalyAlert = {
        id: '',
        userId,
        type: 'goal_risk',
        severity: riskLevel,
        title: 'Goal at Risk',
        message,
        details: {
          goalId,
          riskLevel,
          timestamp: new Date().toISOString(),
        },
        isAcknowledged: false,
        createdAt: new Date(),
      };

      const savedAlert = await this.prisma.notification.create({
        data: {
          userId,
          title: alert.title,
          message: alert.message,
          type: this.mapSeverityToNotificationType(alert.severity),
          metadata: JSON.stringify(alert.details),
          actionUrl: `/goals/${goalId}`,
        },
      });

      alert.id = savedAlert.id;

      if (riskLevel !== 'low') {
        await this.sendPushNotification(userId, alert);
      }

      return alert;
    } catch (error) {
      this.logger.error(`Error creating goal risk alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createAccountSecurityAlert(
    userId: string,
    accountId: string,
    securityEvent: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
  ): Promise<AnomalyAlert> {
    try {
      const alert: AnomalyAlert = {
        id: '',
        userId,
        type: 'account_security',
        severity,
        title: 'Account Security Alert',
        message: `Security event detected: ${securityEvent}`,
        details: {
          accountId,
          securityEvent,
          timestamp: new Date().toISOString(),
        },
        isAcknowledged: false,
        createdAt: new Date(),
      };

      const savedAlert = await this.prisma.notification.create({
        data: {
          userId,
          title: alert.title,
          message: alert.message,
          type: this.mapSeverityToNotificationType(alert.severity),
          metadata: JSON.stringify(alert.details),
          actionUrl: `/accounts/${accountId}`,
        },
      });

      alert.id = savedAlert.id;

      // Always send push notification for security alerts
      await this.sendPushNotification(userId, alert);

      return alert;
    } catch (error) {
      this.logger.error(`Error creating account security alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserAlerts(userId: string): Promise<AnomalyAlert[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          userId,
          type: { in: ['error', 'warning'] }, // Map to anomaly-related notifications
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return notifications.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        type: this.mapNotificationTypeToAlertType(notification.type),
        severity: this.mapNotificationTypeToSeverity(notification.type),
        title: notification.title,
        message: notification.message,
        details: notification.metadata ? JSON.parse(notification.metadata) : {},
        isAcknowledged: notification.isRead,
        createdAt: notification.createdAt,
        acknowledgedAt: notification.isRead ? notification.createdAt : undefined,
      }));
    } catch (error) {
      this.logger.error(`Error getting user alerts: ${error.message}`, error.stack);
      return [];
    }
  }

  async acknowledgeAlert(userId: string, alertId: string): Promise<void> {
    try {
      await this.prisma.notification.updateMany({
        where: {
          id: alertId,
          userId, // Ensure user can only acknowledge their own alerts
        },
        data: {
          isRead: true,
        },
      });

      this.logger.log(`Alert ${alertId} acknowledged by user ${userId}`);
    } catch (error) {
      this.logger.error(`Error acknowledging alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendPushNotification(userId: string, alert: AnomalyAlert): Promise<void> {
    try {
      await this.fcmService.sendAnomalyAlert(
        userId,
        alert.type,
        alert.severity,
        alert.title,
        alert.message,
        alert.details,
      );
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error.message}`, error.stack);
      // Don't throw - push notification failure shouldn't break alert creation
    }
  }

  private async sendRealtimeNotification(userId: string, alert: AnomalyAlert): Promise<void> {
    try {
      // This would integrate with WebSocket service if implemented
      // For now, we'll just log it
      this.logger.log(`Real-time notification sent to user ${userId}: ${alert.title}`);
    } catch (error) {
      this.logger.error(`Error sending real-time notification: ${error.message}`, error.stack);
    }
  }

  private mapAnomalyTypeToAlertType(
    anomalyType: 'amount' | 'frequency' | 'location' | 'merchant' | 'time' | 'pattern',
  ): 'fraud_detection' | 'unusual_spending' | 'goal_risk' | 'account_security' {
    switch (anomalyType) {
      case 'frequency':
      case 'pattern':
        return 'fraud_detection';
      case 'amount':
        return 'unusual_spending';
      case 'location':
      case 'merchant':
      case 'time':
        return 'fraud_detection';
      default:
        return 'unusual_spending';
    }
  }

  private mapSeverityToNotificationType(
    severity: 'low' | 'medium' | 'high' | 'critical',
  ): 'info' | 'warning' | 'success' | 'error' {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }

  private mapNotificationTypeToAlertType(
    notificationType: string,
  ): 'fraud_detection' | 'unusual_spending' | 'goal_risk' | 'account_security' {
    // Simple mapping - in production this would be more sophisticated
    return 'fraud_detection';
  }

  private mapNotificationTypeToSeverity(
    notificationType: string,
  ): 'low' | 'medium' | 'high' | 'critical' {
    switch (notificationType) {
      case 'info':
        return 'low';
      case 'warning':
        return 'medium';
      case 'error':
        return 'high';
      default:
        return 'low';
    }
  }

  private generateAlertTitle(anomalyResult: AnomalyDetectionResult): string {
    switch (anomalyResult.anomalyType) {
      case 'amount':
        return 'Unusual Transaction Amount';
      case 'frequency':
        return 'High Transaction Frequency';
      case 'location':
        return 'Transaction in New Location';
      case 'merchant':
        return 'Transaction with New Merchant';
      case 'time':
        return 'Transaction at Unusual Time';
      case 'pattern':
        return 'Unusual Transaction Pattern';
      default:
        return 'Suspicious Activity Detected';
    }
  }

  private generateAlertMessage(
    anomalyResult: AnomalyDetectionResult,
    transactionData: AnalyzeTransactionDto,
  ): string {
    const amount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(transactionData.amount);

    const baseMessage = `A transaction of ${amount} for "${transactionData.description}" has been flagged as potentially suspicious.`;
    
    if (anomalyResult.reasons.length > 0) {
      return `${baseMessage} Reason: ${anomalyResult.reasons[0]}`;
    }

    return baseMessage;
  }
}