import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async generateTOTPSecret(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const secret = speakeasy.generateSecret({
      name: `Plataforma Financeira (${user.email})`,
      issuer: 'Plataforma Financeira',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store the secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return {
      secret: secret.base32!,
      qrCodeUrl,
    };
  }

  async enableTOTP(userId: string, token: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Secret TOTP não encontrado. Gere um novo secret primeiro.');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Token TOTP inválido');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    return backupCodes;
  }

  async enableSMS(userId: string, phoneNumber: string): Promise<void> {
    // Send verification SMS
    const code = this.generateSMSCode();
    await this.smsService.sendVerificationCode(phoneNumber, code);

    // Store phone number temporarily
    await this.prisma.user.update({
      where: { id: userId },
      data: { smsPhone: phoneNumber },
    });

    // In a real implementation, you'd store the code temporarily for verification
    // For now, we'll assume the verification happens in a separate endpoint
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorBackupCodes: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorBackupCodes) {
      return false;
    }

    const backupCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const codeIndex = backupCodes.indexOf(hashedCode);
    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
    });

    return true;
  }

  async sendSMSCode(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { smsPhone: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled || !user.smsPhone) {
      throw new BadRequestException('SMS 2FA não está configurado');
    }

    const code = this.generateSMSCode();
    await this.smsService.sendVerificationCode(user.smsPhone, code);

    // In a real implementation, store the code temporarily for verification
  }

  async sendEmailCode(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled) {
      throw new BadRequestException('2FA não está habilitado');
    }

    const code = this.generateSMSCode(); // Same format as SMS code
    await this.emailService.send2FACode(user.email, user.name || 'Usuário', code);

    // In a real implementation, store the code temporarily for verification
  }

  async disable2FA(userId: string, password: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled) {
      throw new BadRequestException('2FA não está habilitado');
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    if (!user.password || !await bcrypt.compare(password, user.password)) {
      throw new UnauthorizedException('Senha incorreta');
    }

    // Verify 2FA token
    const isValidToken = await this.verifyTOTP(userId, token) || 
                        await this.verifyBackupCode(userId, token);

    if (!isValidToken) {
      throw new BadRequestException('Token 2FA inválido');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        smsPhone: null,
      },
    });
  }

  async regenerateBackupCodes(userId: string, password: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled) {
      throw new BadRequestException('2FA não está habilitado');
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    if (!user.password || !await bcrypt.compare(password, user.password)) {
      throw new UnauthorizedException('Senha incorreta');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: JSON.stringify(hashedBackupCodes) },
    });

    return backupCodes;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}