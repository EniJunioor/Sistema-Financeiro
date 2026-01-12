import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as vault from 'node-vault';

export interface HSMKeyInfo {
  keyId: string;
  keySpec: string;
  keyUsage: string;
  keyState: string;
}

export interface SignatureResult {
  signature: string;
  algorithm: string;
  keyId: string;
}

@Injectable()
export class HSMService {
  private readonly logger = new Logger(HSMService.name);
  private readonly kms: AWS.KMS;
  private readonly vaultClient: any;
  private readonly hsmEnabled: boolean;
  private readonly provider: string;

  constructor(private configService: ConfigService) {
    this.hsmEnabled = this.configService.get<boolean>('security.hsm.enabled', false);
    this.provider = this.configService.get<string>('security.hsm.provider', 'aws-cloudhsm');

    if (this.hsmEnabled) {
      this.initializeHSM();
    }
  }

  private initializeHSM() {
    switch (this.provider) {
      case 'aws-cloudhsm':
      case 'aws-kms':
        this.initializeAWS();
        break;
      case 'hashicorp-vault':
        this.initializeVault();
        break;
      default:
        this.logger.warn(`Unsupported HSM provider: ${this.provider}`);
    }
  }

  private initializeAWS() {
    const region = this.configService.get<string>('security.hsm.region');
    
    AWS.config.update({
      region,
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    });

    this.kms = new AWS.KMS();
    this.logger.log('AWS KMS/CloudHSM initialized');
  }

  private initializeVault() {
    const vaultOptions = {
      apiVersion: 'v1',
      endpoint: this.configService.get<string>('VAULT_ENDPOINT'),
      token: this.configService.get<string>('VAULT_TOKEN'),
    };

    this.vaultClient = vault(vaultOptions);
    this.logger.log('HashiCorp Vault initialized');
  }

  /**
   * Generate a new encryption key in HSM
   */
  async generateKey(keySpec = 'AES_256', keyUsage = 'ENCRYPT_DECRYPT'): Promise<HSMKeyInfo> {
    if (!this.hsmEnabled) {
      throw new Error('HSM is not enabled');
    }

    try {
      switch (this.provider) {
        case 'aws-kms':
          return await this.generateAWSKey(keySpec, keyUsage);
        case 'hashicorp-vault':
          return await this.generateVaultKey(keySpec, keyUsage);
        default:
          throw new Error(`Key generation not supported for provider: ${this.provider}`);
      }
    } catch (error) {
      this.logger.error('Failed to generate HSM key', error);
      throw new Error('HSM key generation failed');
    }
  }

  private async generateAWSKey(keySpec: string, keyUsage: string): Promise<HSMKeyInfo> {
    const params = {
      KeyUsage: keyUsage,
      KeySpec: keySpec,
      Description: 'Plataforma Financeira encryption key',
      Tags: [
        {
          TagKey: 'Application',
          TagValue: 'PlataformaFinanceira',
        },
        {
          TagKey: 'Environment',
          TagValue: this.configService.get<string>('NODE_ENV', 'development'),
        },
      ],
    };

    const result = await this.kms.createKey(params).promise();
    
    return {
      keyId: result.KeyMetadata.KeyId,
      keySpec: result.KeyMetadata.KeySpec,
      keyUsage: result.KeyMetadata.KeyUsage,
      keyState: result.KeyMetadata.KeyState,
    };
  }

  private async generateVaultKey(keySpec: string, keyUsage: string): Promise<HSMKeyInfo> {
    const keyName = `plataforma-financeira-${Date.now()}`;
    
    const result = await this.vaultClient.write(`transit/keys/${keyName}`, {
      type: keySpec.toLowerCase().replace('_', '-'),
      exportable: false,
    });

    return {
      keyId: keyName,
      keySpec,
      keyUsage,
      keyState: 'Enabled',
    };
  }

  /**
   * Encrypt data using HSM
   */
  async encrypt(plaintext: string, keyId?: string): Promise<string> {
    if (!this.hsmEnabled) {
      throw new Error('HSM is not enabled');
    }

    const targetKeyId = keyId || this.configService.get<string>('security.hsm.keyId');
    
    try {
      switch (this.provider) {
        case 'aws-kms':
          return await this.encryptWithAWS(plaintext, targetKeyId);
        case 'hashicorp-vault':
          return await this.encryptWithVault(plaintext, targetKeyId);
        default:
          throw new Error(`Encryption not supported for provider: ${this.provider}`);
      }
    } catch (error) {
      this.logger.error('HSM encryption failed', error);
      throw new Error('HSM encryption failed');
    }
  }

  private async encryptWithAWS(plaintext: string, keyId: string): Promise<string> {
    const params = {
      KeyId: keyId,
      Plaintext: Buffer.from(plaintext, 'utf8'),
    };

    const result = await this.kms.encrypt(params).promise();
    return result.CiphertextBlob.toString('base64');
  }

  private async encryptWithVault(plaintext: string, keyId: string): Promise<string> {
    const result = await this.vaultClient.write(`transit/encrypt/${keyId}`, {
      plaintext: Buffer.from(plaintext, 'utf8').toString('base64'),
    });

    return result.data.ciphertext;
  }

  /**
   * Decrypt data using HSM
   */
  async decrypt(ciphertext: string, keyId?: string): Promise<string> {
    if (!this.hsmEnabled) {
      throw new Error('HSM is not enabled');
    }

    const targetKeyId = keyId || this.configService.get<string>('security.hsm.keyId');

    try {
      switch (this.provider) {
        case 'aws-kms':
          return await this.decryptWithAWS(ciphertext, targetKeyId);
        case 'hashicorp-vault':
          return await this.decryptWithVault(ciphertext, targetKeyId);
        default:
          throw new Error(`Decryption not supported for provider: ${this.provider}`);
      }
    } catch (error) {
      this.logger.error('HSM decryption failed', error);
      throw new Error('HSM decryption failed');
    }
  }

  private async decryptWithAWS(ciphertext: string, keyId: string): Promise<string> {
    const params = {
      CiphertextBlob: Buffer.from(ciphertext, 'base64'),
    };

    const result = await this.kms.decrypt(params).promise();
    return result.Plaintext.toString('utf8');
  }

  private async decryptWithVault(ciphertext: string, keyId: string): Promise<string> {
    const result = await this.vaultClient.write(`transit/decrypt/${keyId}`, {
      ciphertext,
    });

    return Buffer.from(result.data.plaintext, 'base64').toString('utf8');
  }

  /**
   * Sign data using HSM
   */
  async sign(data: string, keyId?: string, algorithm = 'RSASSA_PSS_SHA_256'): Promise<SignatureResult> {
    if (!this.hsmEnabled) {
      throw new Error('HSM is not enabled');
    }

    const targetKeyId = keyId || this.configService.get<string>('security.hsm.keyId');

    try {
      switch (this.provider) {
        case 'aws-kms':
          return await this.signWithAWS(data, targetKeyId, algorithm);
        case 'hashicorp-vault':
          return await this.signWithVault(data, targetKeyId, algorithm);
        default:
          throw new Error(`Signing not supported for provider: ${this.provider}`);
      }
    } catch (error) {
      this.logger.error('HSM signing failed', error);
      throw new Error('HSM signing failed');
    }
  }

  private async signWithAWS(data: string, keyId: string, algorithm: string): Promise<SignatureResult> {
    const params = {
      KeyId: keyId,
      Message: Buffer.from(data, 'utf8'),
      SigningAlgorithm: algorithm,
    };

    const result = await this.kms.sign(params).promise();
    
    return {
      signature: result.Signature.toString('base64'),
      algorithm: result.SigningAlgorithm,
      keyId: result.KeyId,
    };
  }

  private async signWithVault(data: string, keyId: string, algorithm: string): Promise<SignatureResult> {
    const result = await this.vaultClient.write(`transit/sign/${keyId}`, {
      input: Buffer.from(data, 'utf8').toString('base64'),
      hash_algorithm: 'sha2-256',
    });

    return {
      signature: result.data.signature,
      algorithm,
      keyId,
    };
  }

  /**
   * Verify signature using HSM
   */
  async verify(data: string, signature: string, keyId?: string, algorithm = 'RSASSA_PSS_SHA_256'): Promise<boolean> {
    if (!this.hsmEnabled) {
      throw new Error('HSM is not enabled');
    }

    const targetKeyId = keyId || this.configService.get<string>('security.hsm.keyId');

    try {
      switch (this.provider) {
        case 'aws-kms':
          return await this.verifyWithAWS(data, signature, targetKeyId, algorithm);
        case 'hashicorp-vault':
          return await this.verifyWithVault(data, signature, targetKeyId);
        default:
          throw new Error(`Verification not supported for provider: ${this.provider}`);
      }
    } catch (error) {
      this.logger.error('HSM verification failed', error);
      return false;
    }
  }

  private async verifyWithAWS(data: string, signature: string, keyId: string, algorithm: string): Promise<boolean> {
    const params = {
      KeyId: keyId,
      Message: Buffer.from(data, 'utf8'),
      Signature: Buffer.from(signature, 'base64'),
      SigningAlgorithm: algorithm,
    };

    const result = await this.kms.verify(params).promise();
    return result.SignatureValid;
  }

  private async verifyWithVault(data: string, signature: string, keyId: string): Promise<boolean> {
    const result = await this.vaultClient.write(`transit/verify/${keyId}`, {
      input: Buffer.from(data, 'utf8').toString('base64'),
      signature,
    });

    return result.data.valid;
  }

  /**
   * Check if HSM is available and healthy
   */
  async healthCheck(): Promise<boolean> {
    if (!this.hsmEnabled) {
      return false;
    }

    try {
      switch (this.provider) {
        case 'aws-kms':
          await this.kms.listKeys({ Limit: 1 }).promise();
          return true;
        case 'hashicorp-vault':
          await this.vaultClient.read('sys/health');
          return true;
        default:
          return false;
      }
    } catch (error) {
      this.logger.error('HSM health check failed', error);
      return false;
    }
  }
}