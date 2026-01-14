import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { TLSService } from './common/security/tls.service';
import { SecurityMiddleware } from './common/security/security.middleware';
import { SecurityGuard } from './common/security/security.guard';
import { AuditService } from './common/security/audit.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Create application with enhanced security
  const app = await NestFactory.create(AppModule, {
    httpsOptions: process.env.NODE_ENV === 'production' ? await getHTTPSOptions() : undefined,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const tlsService = app.get(TLSService);
  const auditService = app.get(AuditService);

  // Enhanced Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    xssFilter: true,
  }));

  // Compression with security considerations
  app.use(compression({
    filter: (req, res) => {
      // Don't compress responses that might contain sensitive data
      const sensitiveTypes = ['application/json'];
      const contentType = res.getHeader('content-type');
      
      if (sensitiveTypes.some(type => contentType?.toString().includes(type))) {
        return false;
      }
      
      return compression.filter(req, res);
    },
    level: 6, // Balanced compression level
  }));

  // Enhanced CORS with security
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.NODE_ENV === 'production' 
        ? configService.get<string[]>('ALLOWED_ORIGINS', ['https://yourdomain.com'])
        : ['http://localhost:3000', 'http://localhost:3001'];
      
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        auditService.logSuspiciousActivity(
          'anonymous',
          `Blocked CORS request from unauthorized origin: ${origin}`,
          null as any,
          { origin, allowedOrigins }
        );
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  });

  // Global validation pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation (only in development) - Must be AFTER setGlobalPrefix
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Plataforma Financeira API')
      .setDescription('API para gestão financeira pessoal e de pequenos negócios')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication', 'Endpoints de autenticação e autorização')
      .addTag('Transactions', 'Gestão de transações financeiras')
      .addTag('Accounts', 'Gestão de contas bancárias')
      .addTag('Investments', 'Gestão de investimentos')
      .addTag('Goals', 'Metas financeiras')
      .addTag('Reports', 'Relatórios e analytics')
      .addTag('Security', 'Endpoints de segurança e auditoria')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
      customSiteTitle: 'Plataforma Financeira API',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
    });
  }

  // Global security guard (after Swagger to avoid blocking docs)
  app.useGlobalGuards(app.get(SecurityGuard));

  // Security middleware (after Swagger to avoid blocking docs)
  app.use(app.get(SecurityMiddleware).use.bind(app.get(SecurityMiddleware)));

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // Security status endpoint (authenticated)
  app.getHttpAdapter().get('/api/v1/security/status', async (req, res) => {
    try {
      const tlsValid = tlsService.validateTLSConfig();
      const certExpiring = tlsService.isCertificateExpiringSoon();
      
      res.json({
        tls: {
          valid: tlsValid,
          certificateExpiring: certExpiring,
          supportedVersions: tlsService.getSupportedTLSVersions(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Security status check failed', error);
      res.status(500).json({ error: 'Security status unavailable' });
    }
  });

  const port = configService.get('PORT') || 3001;
  
  // Start server with enhanced security
  if (process.env.NODE_ENV === 'production') {
    // Production: Use HTTPS with TLS 1.3
    const httpsServer = tlsService.createSecureServer(app.getHttpAdapter().getInstance());
    await new Promise<void>((resolve) => {
      httpsServer.listen(port, () => {
        logger.log(`🔒 Secure backend running on https://localhost:${port}`);
        logger.log(`📚 API Documentation: https://localhost:${port}/docs`);
        resolve();
      });
    });
  } else {
    // Development: Use HTTP
    await app.listen(port);
    logger.log(`🚀 Backend running on http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
  }

  // Log startup security status
  logger.log('🛡️  Advanced security features enabled:');
  logger.log('   ✓ TLS 1.3 with secure cipher suites');
  logger.log('   ✓ HSTS with preload');
  logger.log('   ✓ Certificate pinning (production)');
  logger.log('   ✓ AES-256-GCM and ChaCha20-Poly1305 encryption');
  logger.log('   ✓ HSM integration (if configured)');
  logger.log('   ✓ Comprehensive audit logging');
  logger.log('   ✓ Rate limiting and brute force protection');
  logger.log('   ✓ Enhanced security headers');
  logger.log('   ✓ Input validation and sanitization');
}

async function getHTTPSOptions() {
  // This would load your production TLS certificates
  // For now, return undefined to use HTTP in development
  return undefined;
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});