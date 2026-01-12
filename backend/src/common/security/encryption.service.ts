import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as forge from 'node-forge';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag?: string;
  algorithm: string;
}

export interface DecryptionInput {
  encrypted: string;
  iv: string;
  tag?: string;
  algorithm: string;
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly masterKey: Buffer;
  private readonly aesAlgorithm = 'aes-256-gcm';
  private readonly chachaAlgorithm = 'chacha20-poly1305';

  constructor(private configService: ConfigService) {
    const encryptionSecret = this.configService.get<string>('ENCRYPTION_SECRET');
    if (!encryptionSecret) {
      throw new Error('ENCRYPTION_SECRET must be defined');
    }
    
    // Derive master key from secret
    this.masterKey = crypto.scryptSync(encryptionSecret, 'salt', 32);
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encryptAES256(data: string): EncryptionResult {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.aesAlgorithm,
      };
    } catch (error) {
      // Fallback to AES-256-CBC if GCM is not available
      try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.masterKey, iv);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
          encrypted,
          iv: iv.toString('hex'),
          algorithm: 'aes-256-cbc',
        };
      } catch (fallbackError) {
        this.logger.error('AES-256 encryption failed', error);
        throw new Error('Encryption failed');
      }
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decryptAES256(input: DecryptionInput): string {
    try {
      if (input.algorithm === 'aes-256-cbc') {
        const iv = Buffer.from(input.iv, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.masterKey, iv);
        let decrypted = decipher.update(input.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }

      const iv = Buffer.from(input.iv, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
      if (input.tag) {
        decipher.setAuthTag(Buffer.from(input.tag, 'hex'));
      }

      let decrypted = decipher.update(input.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('AES-256 decryption failed', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt data using ChaCha20-Poly1305
   */
  encryptChaCha20(data: string): EncryptionResult {
    try {
      const nonce = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('chacha20-poly1305', this.masterKey, nonce);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: nonce.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.chachaAlgorithm,
      };
    } catch (error) {
      // Fallback to AES-256 if ChaCha20 is not available
      this.logger.warn('ChaCha20 not available, falling back to AES-256');
      return this.encryptAES256(data);
    }
  }

  /**
   * Decrypt data using ChaCha20-Poly1305
   */
  decryptChaCha20(input: DecryptionInput): string {
    try {
      const nonce = Buffer.from(input.iv, 'hex');
      const decipher = crypto.createDecipheriv('chacha20-poly1305', this.masterKey, nonce);
      if (input.tag) {
        decipher.setAuthTag(Buffer.from(input.tag, 'hex'));
      }

      let decrypted = decipher.update(input.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // Fallback to AES-256 if ChaCha20 is not available
      if (input.algorithm === 'aes-256-gcm' || input.algorithm === 'aes-256-cbc') {
        return this.decryptAES256(input);
      }
      this.logger.error('ChaCha20 decryption failed', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt sensitive data (automatically chooses best algorithm)
   */
  encrypt(data: string, preferChaCha20 = false): EncryptionResult {
    return preferChaCha20 ? this.encryptChaCha20(data) : this.encryptAES256(data);
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(input: DecryptionInput): string {
    switch (input.algorithm) {
      case this.aesAlgorithm:
        return this.decryptAES256(input);
      case this.chachaAlgorithm:
        return this.decryptChaCha20(input);
      default:
        throw new Error(`Unsupported encryption algorithm: ${input.algorithm}`);
    }
  }

  /**
   * Generate secure random key
   */
  generateSecureKey(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password with salt
   */
  hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  /**
   * Verify password against hash
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashToVerify, 'hex'));
  }

  /**
   * Generate HMAC signature
   */
  generateHMAC(data: string, secret?: string): string {
    const key = secret || this.masterKey.toString('hex');
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}