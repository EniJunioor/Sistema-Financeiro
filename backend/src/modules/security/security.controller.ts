import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SecurityService } from './security.service';
import { AuditService } from '../../common/security/audit.service';
import { HSMService } from '../../common/security/hsm.service';
import { TLSService } from '../../common/security/tls.service';

@ApiTags('Security')
@Controller('security')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SecurityController {
  constructor(
    private securityService: SecurityService,
    private auditService: AuditService,
    private hsmService: HSMService,
    private tlsService: TLSService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get security system status' })
  @ApiResponse({ status: 200, description: 'Security status retrieved successfully' })
  async getSecurityStatus(@Request() req: any) {
    await this.auditService.logSystemAccess(
      req.user.id,
      'security_status_check',
      req,
      true
    );

    return {
      tls: {
        valid: this.tlsService.validateTLSConfig(),
        certificateExpiring: this.tlsService.isCertificateExpiringSoon(),
        supportedVersions: this.tlsService.getSupportedTLSVersions(),
        cipherSuites: this.tlsService.getCipherSuites(),
      },
      hsm: {
        enabled: await this.hsmService.healthCheck(),
      },
      audit: {
        enabled: true,
        logLevel: 'info',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('audit/logs')
  @ApiOperation({ summary: 'Get audit logs (admin only)' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(@Request() req: any) {
    // In production, add admin role check
    await this.auditService.logSystemAccess(
      req.user.id,
      'audit_logs_access',
      req,
      true
    );

    return this.auditService.queryAuditLogs({
      limit: 100,
    });
  }

  @Post('encrypt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encrypt sensitive data' })
  @ApiResponse({ status: 200, description: 'Data encrypted successfully' })
  async encryptData(@Body() body: { data: string; useChaCha20?: boolean }, @Request() req: any) {
    await this.auditService.logDataAccess(
      req.user.id,
      'encryption',
      'data',
      'create',
      req,
      true,
      { algorithm: body.useChaCha20 ? 'chacha20' : 'aes256' }
    );

    return this.securityService.encryptData(body.data, body.useChaCha20);
  }

  @Post('decrypt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decrypt sensitive data' })
  @ApiResponse({ status: 200, description: 'Data decrypted successfully' })
  async decryptData(@Body() body: { encrypted: string; iv: string; tag?: string; algorithm: string }, @Request() req: any) {
    await this.auditService.logDataAccess(
      req.user.id,
      'decryption',
      'data',
      'read',
      req,
      true,
      { algorithm: body.algorithm }
    );

    return this.securityService.decryptData(body);
  }

  @Post('hsm/encrypt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encrypt data using HSM' })
  @ApiResponse({ status: 200, description: 'Data encrypted using HSM successfully' })
  async hsmEncrypt(@Body() body: { data: string; keyId?: string }, @Request() req: any) {
    await this.auditService.logDataAccess(
      req.user.id,
      'hsm_encryption',
      'hsm',
      'create',
      req,
      true,
      { keyId: body.keyId }
    );

    const encrypted = await this.hsmService.encrypt(body.data, body.keyId);
    return { encrypted };
  }

  @Post('hsm/decrypt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decrypt data using HSM' })
  @ApiResponse({ status: 200, description: 'Data decrypted using HSM successfully' })
  async hsmDecrypt(@Body() body: { encrypted: string; keyId?: string }, @Request() req: any) {
    await this.auditService.logDataAccess(
      req.user.id,
      'hsm_decryption',
      'hsm',
      'read',
      req,
      true,
      { keyId: body.keyId }
    );

    const decrypted = await this.hsmService.decrypt(body.encrypted, body.keyId);
    return { decrypted };
  }

  @Post('hsm/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign data using HSM' })
  @ApiResponse({ status: 200, description: 'Data signed using HSM successfully' })
  async hsmSign(@Body() body: { data: string; keyId?: string; algorithm?: string }, @Request() req: any) {
    await this.auditService.logDataAccess(
      req.user.id,
      'hsm_signing',
      'hsm',
      'create',
      req,
      true,
      { keyId: body.keyId, algorithm: body.algorithm }
    );

    return this.hsmService.sign(body.data, body.keyId, body.algorithm);
  }

  @Post('hsm/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify signature using HSM' })
  @ApiResponse({ status: 200, description: 'Signature verified using HSM successfully' })
  async hsmVerify(@Body() body: { data: string; signature: string; keyId?: string; algorithm?: string }, @Request() req: any) {
    await this.auditService.logDataAccess(
      req.user.id,
      'hsm_verification',
      'hsm',
      'read',
      req,
      true,
      { keyId: body.keyId, algorithm: body.algorithm }
    );

    const valid = await this.hsmService.verify(body.data, body.signature, body.keyId, body.algorithm);
    return { valid };
  }

  @Get('certificate/info')
  @ApiOperation({ summary: 'Get TLS certificate information' })
  @ApiResponse({ status: 200, description: 'Certificate information retrieved successfully' })
  async getCertificateInfo(@Request() req: any) {
    await this.auditService.logSystemAccess(
      req.user.id,
      'certificate_info_access',
      req,
      true
    );

    return this.tlsService.getCertificateInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Security system health check' })
  @ApiResponse({ status: 200, description: 'Security system health status' })
  async healthCheck(@Request() req: any) {
    const hsmHealthy = await this.hsmService.healthCheck();
    const tlsValid = this.tlsService.validateTLSConfig();

    return {
      status: 'ok',
      components: {
        hsm: hsmHealthy ? 'healthy' : 'unavailable',
        tls: tlsValid ? 'healthy' : 'error',
        audit: 'healthy',
        encryption: 'healthy',
      },
      timestamp: new Date().toISOString(),
    };
  }
}