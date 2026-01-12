import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { HSMService } from './hsm.service';
import { AuditService } from './audit.service';
import { TLSService } from './tls.service';

describe('Security Services', () => {
  let encryptionService: EncryptionService;
  let hsmService: HSMService;
  let auditService: AuditService;
  let tlsService: TLSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        HSMService,
        AuditService,
        TLSService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'ENCRYPTION_SECRET': 'test-encryption-secret-32-chars-long',
                'security.hsm.enabled': false,
                'security.audit.logLevel': 'info',
                'security.audit.retentionDays': 365,
                'security.audit.sensitiveFields': ['password', 'token'],
                'security.hsts.maxAge': 31536000,
                'security.hsts.includeSubDomains': true,
                'security.hsts.preload': true,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    encryptionService = module.get<EncryptionService>(EncryptionService);
    hsmService = module.get<HSMService>(HSMService);
    auditService = module.get<AuditService>(AuditService);
    tlsService = module.get<TLSService>(TLSService);
  });

  describe('EncryptionService', () => {
    it('should be defined', () => {
      expect(encryptionService).toBeDefined();
    });

    it('should encrypt and decrypt data with AES-256', () => {
      const testData = 'sensitive-test-data';
      const encrypted = encryptionService.encryptAES256(testData);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');

      const decrypted = encryptionService.decryptAES256(encrypted);
      expect(decrypted).toBe(testData);
    });

    it('should encrypt and decrypt data with ChaCha20', () => {
      const testData = 'sensitive-test-data';
      const encrypted = encryptionService.encryptChaCha20(testData);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.algorithm).toBe('chacha20-poly1305');

      const decrypted = encryptionService.decryptChaCha20(encrypted);
      expect(decrypted).toBe(testData);
    });

    it('should generate secure keys', () => {
      const key1 = encryptionService.generateSecureKey();
      const key2 = encryptionService.generateSecureKey();
      
      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
      expect(key1).not.toBe(key2);
      expect(key1.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should hash and verify passwords', () => {
      const password = 'test-password-123';
      const { hash, salt } = encryptionService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      
      const isValid = encryptionService.verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
      
      const isInvalid = encryptionService.verifyPassword('wrong-password', hash, salt);
      expect(isInvalid).toBe(false);
    });

    it('should generate and verify HMAC', () => {
      const data = 'test-data-for-hmac';
      const hmac = encryptionService.generateHMAC(data);
      
      expect(hmac).toBeDefined();
      
      const isValid = encryptionService.verifyHMAC(data, hmac);
      expect(isValid).toBe(true);
      
      const isInvalid = encryptionService.verifyHMAC('tampered-data', hmac);
      expect(isInvalid).toBe(false);
    });
  });

  describe('HSMService', () => {
    it('should be defined', () => {
      expect(hsmService).toBeDefined();
    });

    it('should return false for health check when disabled', async () => {
      const isHealthy = await hsmService.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('AuditService', () => {
    it('should be defined', () => {
      expect(auditService).toBeDefined();
    });

    it('should log audit events', async () => {
      const event = {
        userId: 'test-user-id',
        action: 'test-action',
        resource: 'test-resource',
        timestamp: new Date(),
        success: true,
        riskLevel: 'LOW' as const,
      };

      // This should not throw
      await expect(auditService.logAuditEvent(event)).resolves.not.toThrow();
    });

    it('should log security events', async () => {
      const event = {
        userId: 'test-user-id',
        action: 'test-action',
        resource: 'test-resource',
        timestamp: new Date(),
        success: true,
        riskLevel: 'HIGH' as const,
        eventType: 'SUSPICIOUS_ACTIVITY' as const,
      };

      // This should not throw
      await expect(auditService.logSecurityEvent(event)).resolves.not.toThrow();
    });
  });

  describe('TLSService', () => {
    it('should be defined', () => {
      expect(tlsService).toBeDefined();
    });

    it('should get supported TLS versions', () => {
      const versions = tlsService.getSupportedTLSVersions();
      expect(versions).toContain('TLSv1.3');
      expect(versions).toContain('TLSv1.2');
    });

    it('should get cipher suites', () => {
      const ciphers = tlsService.getCipherSuites();
      expect(ciphers).toBeDefined();
      expect(Array.isArray(ciphers)).toBe(true);
      expect(ciphers.length).toBeGreaterThan(0);
    });

    it('should get HSTS headers', () => {
      const headers = tlsService.getHSTSHeaders();
      expect(headers).toBeDefined();
      expect(headers['Strict-Transport-Security']).toBeDefined();
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    });
  });
});