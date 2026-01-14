import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from './audit.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger(SecurityGuard.name);

  constructor(
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const path = request.url;
    
    // Skip security checks for Swagger documentation and health checks
    const skipPaths = ['/docs', '/health', '/api/docs'];
    if (skipPaths.some(skipPath => path.startsWith(skipPath))) {
      return true;
    }
    
    // Perform security checks
    const checks = [
      this.checkIPWhitelist(request),
      this.checkUserAgent(request),
      this.checkSuspiciousPatterns(request),
      this.checkRequestSize(request),
      this.checkContentType(request),
    ];

    const results = await Promise.all(checks);
    const allPassed = results.every(result => result.passed);

    if (!allPassed) {
      const failedChecks = results
        .filter(result => !result.passed)
        .map(result => result.reason);

      await this.auditService.logSuspiciousActivity(
        request.user?.id || 'anonymous',
        `Security checks failed: ${failedChecks.join(', ')}`,
        request,
        { failedChecks }
      );

      throw new ForbiddenException('Access denied due to security policy');
    }

    return true;
  }

  private async checkIPWhitelist(request: Request): Promise<{ passed: boolean; reason?: string }> {
    const whitelist = this.configService.get<string[]>('SECURITY_IP_WHITELIST', []);
    
    if (whitelist.length === 0) {
      return { passed: true };
    }

    const clientIP = this.getClientIP(request);
    const isWhitelisted = whitelist.includes(clientIP);

    return {
      passed: isWhitelisted,
      reason: isWhitelisted ? undefined : `IP ${clientIP} not in whitelist`,
    };
  }

  private async checkUserAgent(request: Request): Promise<{ passed: boolean; reason?: string }> {
    const userAgent = request.get('User-Agent');
    
    if (!userAgent) {
      return {
        passed: false,
        reason: 'Missing User-Agent header',
      };
    }

    // Check for suspicious user agents
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    // Allow legitimate bots if configured
    const allowBots = this.configService.get<boolean>('SECURITY_ALLOW_BOTS', false);
    
    if (isSuspicious && !allowBots) {
      return {
        passed: false,
        reason: `Suspicious User-Agent: ${userAgent}`,
      };
    }

    return { passed: true };
  }

  private async checkSuspiciousPatterns(request: Request): Promise<{ passed: boolean; reason?: string }> {
    const suspiciousPatterns = [
      // SQL injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      // Path traversal
      /\.\.\//,
      /\.\.\\/,
      // Command injection
      /[;&|`$()]/,
    ];

    const url = request.url;
    const body = JSON.stringify(request.body || {});
    const query = JSON.stringify(request.query || {});

    const testString = `${url} ${body} ${query}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(testString)) {
        return {
          passed: false,
          reason: `Suspicious pattern detected: ${pattern.source}`,
        };
      }
    }

    return { passed: true };
  }

  private async checkRequestSize(request: Request): Promise<{ passed: boolean; reason?: string }> {
    const maxSize = this.configService.get<number>('MAX_REQUEST_SIZE', 10 * 1024 * 1024); // 10MB default
    const contentLength = parseInt(request.get('Content-Length') || '0', 10);

    if (contentLength > maxSize) {
      return {
        passed: false,
        reason: `Request size ${contentLength} exceeds maximum ${maxSize}`,
      };
    }

    return { passed: true };
  }

  private async checkContentType(request: Request): Promise<{ passed: boolean; reason?: string }> {
    const contentType = request.get('Content-Type');
    
    // Only check POST, PUT, PATCH requests
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return { passed: true };
    }

    if (!contentType) {
      return {
        passed: false,
        reason: 'Missing Content-Type header for request with body',
      };
    }

    // Allow common content types
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain',
    ];

    const isAllowed = allowedTypes.some(type => contentType.includes(type));

    if (!isAllowed) {
      return {
        passed: false,
        reason: `Unsupported Content-Type: ${contentType}`,
      };
    }

    return { passed: true };
  }

  private getClientIP(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}