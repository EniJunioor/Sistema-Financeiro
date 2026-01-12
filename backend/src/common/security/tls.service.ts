import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface TLSConfig {
  cert: string;
  key: string;
  ca?: string;
  ciphers: string;
  secureProtocol: string;
  honorCipherOrder: boolean;
  secureOptions: number;
}

export interface CertificateInfo {
  subject: any;
  issuer: any;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  serialNumber: string;
}

@Injectable()
export class TLSService {
  private readonly logger = new Logger(TLSService.name);
  private tlsConfig: TLSConfig;
  private certificatePins: string[] = [];

  constructor(private configService: ConfigService) {
    this.initializeTLSConfig();
  }

  private initializeTLSConfig() {
    const certPath = this.configService.get<string>('TLS_CERT_PATH');
    const keyPath = this.configService.get<string>('TLS_KEY_PATH');
    const caPath = this.configService.get<string>('TLS_CA_PATH');

    // TLS 1.3 cipher suites (ordered by preference)
    const tls13Ciphers = [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
    ];

    // TLS 1.2 cipher suites (fallback)
    const tls12Ciphers = [
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
    ];

    this.tlsConfig = {
      cert: certPath ? fs.readFileSync(certPath, 'utf8') : '',
      key: keyPath ? fs.readFileSync(keyPath, 'utf8') : '',
      ca: caPath ? fs.readFileSync(caPath, 'utf8') : undefined,
      ciphers: [...tls13Ciphers, ...tls12Ciphers].join(':'),
      secureProtocol: 'TLSv1_3_method',
      honorCipherOrder: true,
      secureOptions: 
        crypto.constants.SSL_OP_NO_SSLv2 |
        crypto.constants.SSL_OP_NO_SSLv3 |
        crypto.constants.SSL_OP_NO_TLSv1 |
        crypto.constants.SSL_OP_NO_TLSv1_1 |
        crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE,
    };

    // Load certificate pins if enabled
    const pinsEnabled = this.configService.get<boolean>('security.tls.certificatePinning.enabled');
    if (pinsEnabled) {
      this.certificatePins = this.configService.get<string[]>('security.tls.certificatePinning.pins', []);
    }

    this.logger.log('TLS configuration initialized');
  }

  /**
   * Get TLS configuration for HTTPS server
   */
  getTLSConfig(): TLSConfig {
    return this.tlsConfig;
  }

  /**
   * Create HTTPS server with secure TLS configuration
   */
  createSecureServer(app: any): https.Server {
    const options: https.ServerOptions = {
      ...this.tlsConfig,
      // Additional security options
      requestCert: false, // Set to true for mutual TLS
      rejectUnauthorized: true,
      // OCSP stapling
      // ocsp: this.getOCSPResponse.bind(this),
    };

    const server = https.createServer(options, app);

    // Set up certificate pinning validation
    if (this.certificatePins.length > 0) {
      server.on('secureConnection', (tlsSocket) => {
        this.validateCertificatePin(tlsSocket);
      });
    }

    // Set up TLS session management
    server.on('newSession', (sessionId, sessionData, callback) => {
      this.storeTLSSession(sessionId, sessionData);
      callback();
    });

    server.on('resumeSession', (sessionId, callback) => {
      const sessionData = this.retrieveTLSSession(sessionId);
      callback(null, sessionData);
    });

    return server;
  }

  /**
   * Validate certificate pinning
   */
  private validateCertificatePin(tlsSocket: any): boolean {
    if (this.certificatePins.length === 0) {
      return true;
    }

    const cert = tlsSocket.getPeerCertificate();
    if (!cert) {
      this.logger.warn('No certificate provided for pinning validation');
      return false;
    }

    const certFingerprint = this.calculateCertificatePin(cert.raw);
    const isValid = this.certificatePins.includes(certFingerprint);

    if (!isValid) {
      this.logger.error('Certificate pin validation failed', {
        expected: this.certificatePins,
        received: certFingerprint,
      });
      tlsSocket.destroy();
    }

    return isValid;
  }

  /**
   * Calculate certificate pin (SHA-256 hash of public key)
   */
  private calculateCertificatePin(certRaw: Buffer): string {
    // Extract public key from certificate
    const cert = crypto.createPublicKey({
      key: certRaw,
      format: 'der',
      type: 'spki',
    });

    // Calculate SHA-256 hash of public key
    const publicKeyDer = cert.export({ format: 'der', type: 'spki' });
    const hash = crypto.createHash('sha256').update(publicKeyDer).digest('base64');
    
    return `sha256/${hash}`;
  }

  /**
   * Get certificate information
   */
  getCertificateInfo(): CertificateInfo | null {
    if (!this.tlsConfig.cert) {
      return null;
    }

    try {
      const cert = crypto.createPublicKey(this.tlsConfig.cert);
      // This is a simplified implementation
      // In production, you'd parse the certificate properly
      return {
        subject: {},
        issuer: {},
        validFrom: new Date(),
        validTo: new Date(),
        fingerprint: '',
        serialNumber: '',
      };
    } catch (error) {
      this.logger.error('Failed to parse certificate', error);
      return null;
    }
  }

  /**
   * Check if certificate is expiring soon
   */
  isCertificateExpiringSoon(daysThreshold = 30): boolean {
    const certInfo = this.getCertificateInfo();
    if (!certInfo) {
      return false;
    }

    const now = new Date();
    const expiryDate = certInfo.validTo;
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return daysUntilExpiry <= daysThreshold;
  }

  /**
   * Store TLS session for resumption
   */
  private storeTLSSession(sessionId: Buffer, sessionData: Buffer): void {
    // In production, store in Redis or similar
    // For now, just log
    this.logger.debug('Storing TLS session', { sessionId: sessionId.toString('hex') });
  }

  /**
   * Retrieve TLS session for resumption
   */
  private retrieveTLSSession(sessionId: Buffer): Buffer | null {
    // In production, retrieve from Redis or similar
    // For now, return null
    this.logger.debug('Retrieving TLS session', { sessionId: sessionId.toString('hex') });
    return null;
  }

  /**
   * Get HSTS headers
   */
  getHSTSHeaders(): Record<string, string> {
    const hstsConfig = this.configService.get('security.hsts');
    
    let hstsValue = `max-age=${hstsConfig.maxAge}`;
    
    if (hstsConfig.includeSubDomains) {
      hstsValue += '; includeSubDomains';
    }
    
    if (hstsConfig.preload) {
      hstsValue += '; preload';
    }

    return {
      'Strict-Transport-Security': hstsValue,
    };
  }

  /**
   * Validate TLS configuration
   */
  validateTLSConfig(): boolean {
    try {
      // Check if certificate and key are valid
      if (!this.tlsConfig.cert || !this.tlsConfig.key) {
        this.logger.error('TLS certificate or key is missing');
        return false;
      }

      // Validate certificate-key pair
      const cert = crypto.createPublicKey(this.tlsConfig.cert);
      const key = crypto.createPrivateKey(this.tlsConfig.key);
      
      // Test if they match (simplified check)
      const testData = 'test-data';
      const signature = crypto.sign('sha256', Buffer.from(testData), key);
      const isValid = crypto.verify('sha256', Buffer.from(testData), cert, signature);

      if (!isValid) {
        this.logger.error('TLS certificate and key do not match');
        return false;
      }

      this.logger.log('TLS configuration is valid');
      return true;
    } catch (error) {
      this.logger.error('TLS configuration validation failed', error);
      return false;
    }
  }

  /**
   * Get supported TLS versions
   */
  getSupportedTLSVersions(): string[] {
    return ['TLSv1.3', 'TLSv1.2'];
  }

  /**
   * Get cipher suite information
   */
  getCipherSuites(): string[] {
    return this.tlsConfig.ciphers.split(':');
  }
}