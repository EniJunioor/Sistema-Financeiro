import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { Request } from 'express';

interface RequestWithSession extends Request {
  session?: {
    id?: string;
  };
}

export interface AuditEvent {
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
}

export interface SecurityEvent extends AuditEvent {
  eventType: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE' | 'PERMISSION_DENIED' | 'SUSPICIOUS_ACTIVITY' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'SYSTEM_ACCESS';
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private auditLogger: winston.Logger;
  private securityLogger: winston.Logger;
  private readonly sensitiveFields: string[];

  constructor(private configService: ConfigService) {
    this.sensitiveFields = this.configService.get<string[]>('security.audit.sensitiveFields', []);
    this.initializeLoggers();
  }

  private initializeLoggers() {
    const logLevel = this.configService.get<string>('security.audit.logLevel', 'info');
    const retentionDays = this.configService.get<number>('security.audit.retentionDays', 365);

    // Audit Logger Configuration
    this.auditLogger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...this.sanitizeData(meta),
          });
        })
      ),
      transports: [
        new DailyRotateFile({
          filename: 'logs/audit-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '100m',
          maxFiles: `${retentionDays}d`,
          auditFile: 'logs/audit-hash.json',
          zippedArchive: true,
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    // Security Logger Configuration
    this.securityLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message: `SECURITY_EVENT: ${message}`,
            ...this.sanitizeData(meta),
          });
        })
      ),
      transports: [
        new DailyRotateFile({
          filename: 'logs/security-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '100m',
          maxFiles: `${retentionDays}d`,
          auditFile: 'logs/security-hash.json',
          zippedArchive: true,
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    this.logger.log('Audit logging system initialized');
  }

  /**
   * Log general audit event
   */
  async logAuditEvent(event: AuditEvent): Promise<void> {
    try {
      const sanitizedEvent = this.sanitizeData(event);
      
      this.auditLogger.info('Audit Event', {
        ...sanitizedEvent,
        eventId: this.generateEventId(),
        serverTimestamp: new Date().toISOString(),
      });

      // Store in database for querying (optional)
      if (this.configService.get<boolean>('AUDIT_DB_STORAGE', false)) {
        await this.storeAuditEventInDB(sanitizedEvent);
      }
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }

  /**
   * Log security-specific event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const sanitizedEvent = this.sanitizeData(event);
      
      this.securityLogger.warn('Security Event', {
        ...sanitizedEvent,
        eventId: this.generateEventId(),
        serverTimestamp: new Date().toISOString(),
      });

      // High-risk events should trigger immediate alerts
      if (event.riskLevel === 'CRITICAL' || event.riskLevel === 'HIGH') {
        await this.triggerSecurityAlert(event);
      }

      // Store in database
      if (this.configService.get<boolean>('AUDIT_DB_STORAGE', false)) {
        await this.storeSecurityEventInDB(sanitizedEvent);
      }
    } catch (error) {
      this.logger.error('Failed to log security event', error);
    }
  }

  /**
   * Log user authentication event
   */
  async logAuthEvent(
    userId: string,
    action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN',
    request: RequestWithSession,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const event: SecurityEvent = {
      userId,
      sessionId: request.session?.id,
      action,
      resource: 'authentication',
      ipAddress: this.getClientIP(request),
      userAgent: request.get('User-Agent'),
      timestamp: new Date(),
      success,
      errorMessage,
      riskLevel: success ? 'LOW' : 'MEDIUM',
      eventType: action,
      geolocation: await this.getGeolocation(this.getClientIP(request)),
    };

    await this.logSecurityEvent(event);
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'READ' | 'create' | 'update' | 'delete',
    request: RequestWithSession,
    success: boolean,
    details?: any
  ): Promise<void> {
    const riskLevel = this.calculateRiskLevel(action, resource, details);
    
    const event: AuditEvent = {
      userId,
      sessionId: request.session?.id,
      action,
      resource,
      resourceId,
      details: this.sanitizeData(details),
      ipAddress: this.getClientIP(request),
      userAgent: request.get('User-Agent'),
      timestamp: new Date(),
      success,
      riskLevel,
    };

    await this.logAuditEvent(event);

    // Also log as security event for sensitive resources
    if (this.isSensitiveResource(resource)) {
      const securityEvent: SecurityEvent = {
        ...event,
        eventType: 'DATA_ACCESS',
      };
      await this.logSecurityEvent(securityEvent);
    }
  }

  /**
   * Log system access event
   */
  async logSystemAccess(
    userId: string,
    action: string,
    request: RequestWithSession,
    success: boolean,
    details?: any
  ): Promise<void> {
    const event: SecurityEvent = {
      userId,
      sessionId: request.session?.id,
      action,
      resource: 'system',
      details: this.sanitizeData(details),
      ipAddress: this.getClientIP(request),
      userAgent: request.get('User-Agent'),
      timestamp: new Date(),
      success,
      riskLevel: 'MEDIUM',
      eventType: 'SYSTEM_ACCESS',
    };

    await this.logSecurityEvent(event);
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    userId: string,
    description: string,
    request: RequestWithSession,
    details?: any
  ): Promise<void> {
    const event: SecurityEvent = {
      userId,
      sessionId: request.session?.id,
      action: 'suspicious_activity',
      resource: 'security',
      details: this.sanitizeData(details),
      ipAddress: this.getClientIP(request),
      userAgent: request.get('User-Agent'),
      timestamp: new Date(),
      success: false,
      riskLevel: 'HIGH',
      eventType: 'SUSPICIOUS_ACTIVITY',
      errorMessage: description,
    };

    await this.logSecurityEvent(event);
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    for (const field of this.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Calculate risk level based on action and resource
   */
  private calculateRiskLevel(action: string, resource: string, details?: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical operations
    if (action === 'delete' && this.isSensitiveResource(resource)) {
      return 'CRITICAL';
    }

    // High-risk operations
    if (action === 'update' && this.isSensitiveResource(resource)) {
      return 'HIGH';
    }

    // Medium-risk operations
    if (action === 'create' || action === 'update') {
      return 'MEDIUM';
    }

    // Low-risk operations
    return 'LOW';
  }

  /**
   * Check if resource is sensitive
   */
  private isSensitiveResource(resource: string): boolean {
    const sensitiveResources = [
      'user',
      'account',
      'transaction',
      'investment',
      'auth',
      'security',
      'payment',
    ];
    
    return sensitiveResources.some(sensitive => 
      resource.toLowerCase().includes(sensitive)
    );
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: RequestWithSession): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Get geolocation from IP (mock implementation)
   */
  private async getGeolocation(ip: string): Promise<any> {
    // In production, integrate with a geolocation service like MaxMind
    // For now, return mock data
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store audit event in database (optional)
   */
  private async storeAuditEventInDB(event: any): Promise<void> {
    // Implementation would depend on your database choice
    // This is a placeholder for database storage
    this.logger.debug('Storing audit event in database', { eventId: event.eventId });
  }

  /**
   * Store security event in database (optional)
   */
  private async storeSecurityEventInDB(event: any): Promise<void> {
    // Implementation would depend on your database choice
    // This is a placeholder for database storage
    this.logger.debug('Storing security event in database', { eventId: event.eventId });
  }

  /**
   * Trigger security alert for high-risk events
   */
  private async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    // Implementation would integrate with alerting systems
    // (email, SMS, Slack, PagerDuty, etc.)
    this.logger.warn('SECURITY ALERT TRIGGERED', {
      eventType: event.eventType,
      userId: event.userId,
      riskLevel: event.riskLevel,
      timestamp: event.timestamp,
    });
  }

  /**
   * Query audit logs (for admin interface)
   */
  async queryAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    riskLevel?: string;
    limit?: number;
  }): Promise<any[]> {
    // This would query your database or log files
    // For now, return empty array
    this.logger.debug('Querying audit logs', filters);
    return [];
  }
}