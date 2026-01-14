import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuditService } from './audit.service';
import rateLimit from 'express-rate-limit';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
  session?: {
    id?: string;
  };
}

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private rateLimiter: any;
  private speedLimiter: any;
  private strictRateLimiter: any; // For sensitive endpoints

  constructor(
    private configService: ConfigService,
    private auditService: AuditService,
  ) {
    this.initializeRateLimiting();
    this.initializeStrictRateLimiting();
  }

  private initializeRateLimiting() {
    const rateLimitConfig = this.configService.get('security.rateLimit');
    const slowDown = require('express-slow-down');
    
    // General rate limiting
    this.rateLimiter = rateLimit({
      windowMs: rateLimitConfig.windowMs,
      max: rateLimitConfig.max,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: RequestWithUser, res: Response) => {
        this.auditService.logSuspiciousActivity(
          req.user?.id || 'anonymous',
          'Rate limit exceeded',
          req,
          { limit: rateLimitConfig.max, window: rateLimitConfig.windowMs }
        );
        
        res.status(429).json({
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
        });
      },
    });

    // Speed limiting (progressive delay)
    this.speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // allow 50 requests per 15 minutes at full speed
      delayMs: 500, // slow down subsequent requests by 500ms per request
      maxDelayMs: 20000, // maximum delay of 20 seconds
    });
  }

  private initializeStrictRateLimiting() {
    // Strict rate limiting for sensitive endpoints (login, password reset, etc.)
    this.strictRateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs for sensitive endpoints
      message: {
        error: 'Too many attempts from this IP, please try again later.',
        retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: RequestWithUser, res: Response) => {
        this.auditService.logSuspiciousActivity(
          req.user?.id || 'anonymous',
          'Strict rate limit exceeded on sensitive endpoint',
          req,
          { limit: 5, window: 15 * 60 * 1000 }
        );
        
        res.status(429).json({
          error: 'Too many attempts from this IP, please try again later.',
          retryAfter: Math.ceil(15 * 60),
        });
      },
    });
  }

  use(req: RequestWithUser, res: Response, next: NextFunction) {
    // Apply security headers
    this.setSecurityHeaders(res);

    // Log request for audit
    this.logRequest(req);

    // Apply rate limiting
    this.rateLimiter(req, res, (err: any) => {
      if (err) return next(err);

      // Apply speed limiting
      this.speedLimiter(req, res, (err: any) => {
        if (err) return next(err);

        // Continue to next middleware
        next();
      });
    });
  }

  private setSecurityHeaders(res: Response) {
    const headersConfig = this.configService.get('security.headers');

    // Content Security Policy
    if (headersConfig.contentSecurityPolicy) {
      const csp = this.buildCSPHeader(headersConfig.contentSecurityPolicy.directives);
      res.setHeader('Content-Security-Policy', csp);
    }

    // Other security headers
    res.setHeader('Referrer-Policy', headersConfig.referrerPolicy);
    res.setHeader('X-Frame-Options', headersConfig.xFrameOptions);
    res.setHeader('X-Content-Type-Options', headersConfig.xContentTypeOptions);
    res.setHeader('X-XSS-Protection', headersConfig.xXssProtection);
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'PlataformaFinanceira');

    // HSTS headers (handled by TLSService)
    const hstsConfig = this.configService.get('security.hsts');
    if (hstsConfig) {
      let hstsValue = `max-age=${hstsConfig.maxAge}`;
      if (hstsConfig.includeSubDomains) hstsValue += '; includeSubDomains';
      if (hstsConfig.preload) hstsValue += '; preload';
      res.setHeader('Strict-Transport-Security', hstsValue);
    }
  }

  private buildCSPHeader(directives: Record<string, string[]>): string {
    return Object.entries(directives)
      .map(([directive, sources]) => `${this.camelToKebab(directive)} ${sources.join(' ')}`)
      .join('; ');
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  private async logRequest(req: RequestWithUser) {
    // Log all requests for audit purposes
    const shouldLog = this.shouldLogRequest(req);
    
    if (shouldLog) {
      await this.auditService.logAuditEvent({
        userId: req.user?.id,
        sessionId: req.session?.id,
        action: req.method,
        resource: req.path,
        ipAddress: this.getClientIP(req),
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        success: true, // Will be updated by response interceptor
        riskLevel: this.calculateRequestRiskLevel(req),
        metadata: {
          query: req.query,
          params: req.params,
          contentLength: req.get('Content-Length'),
          contentType: req.get('Content-Type'),
        },
      });
    }
  }

  private shouldLogRequest(req: RequestWithUser): boolean {
    // Don't log health checks and static assets
    const skipPaths = ['/health', '/metrics', '/favicon.ico', '/robots.txt'];
    return !skipPaths.some(path => req.path.startsWith(path));
  }

  private calculateRequestRiskLevel(req: RequestWithUser): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // High-risk paths
    const highRiskPaths = ['/auth', '/admin', '/api/v1/users', '/api/v1/accounts'];
    if (highRiskPaths.some(path => req.path.startsWith(path))) {
      return 'HIGH';
    }

    // Medium-risk methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private getClientIP(req: RequestWithUser): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Get strict rate limiter for sensitive routes (replaces brute force protection)
   */
  getStrictRateLimiter() {
    return this.strictRateLimiter;
  }

  /**
   * Get rate limiter for general routes
   */
  getRateLimiter() {
    return this.rateLimiter;
  }
}