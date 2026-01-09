import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async send2FACode(email: string, name: string, code: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM', 'noreply@plataforma-financeira.com'),
      to: email,
      subject: 'Código de Verificação 2FA - Plataforma Financeira',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Código de Verificação 2FA</h2>
          <p>Olá ${name},</p>
          <p>Seu código de verificação de dois fatores é:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>Este código expira em 5 minutos.</p>
          <p>Se você não solicitou este código, ignore este email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Este é um email automático, não responda a esta mensagem.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendSuspiciousLoginAlert(
    email: string, 
    name: string, 
    ipAddress: string, 
    location: string,
    userAgent: string
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM', 'security@plataforma-financeira.com'),
      to: email,
      subject: 'Alerta de Segurança - Tentativa de Login Suspeita',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">⚠️ Alerta de Segurança</h2>
          <p>Olá ${name},</p>
          <p>Detectamos uma tentativa de login suspeita em sua conta:</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p><strong>IP:</strong> ${ipAddress}</p>
            <p><strong>Localização:</strong> ${location}</p>
            <p><strong>Dispositivo:</strong> ${userAgent}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <p>Se foi você, pode ignorar este email. Caso contrário:</p>
          <ul>
            <li>Altere sua senha imediatamente</li>
            <li>Ative a autenticação de dois fatores</li>
            <li>Revise suas configurações de segurança</li>
          </ul>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Este é um email automático de segurança.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}