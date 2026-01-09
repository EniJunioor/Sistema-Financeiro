import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  constructor(private readonly configService: ConfigService) {}

  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    // In a real implementation, you would use Twilio or another SMS service
    // For now, we'll just log the code (in development) or use a mock service
    
    const twilioAccountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = this.configService.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      // Development mode - just log the code
      console.log(`SMS Code for ${phoneNumber}: ${code}`);
      return;
    }

    try {
      // In production, uncomment and use Twilio
      /*
      const twilio = require('twilio');
      const client = twilio(twilioAccountSid, twilioAuthToken);
      
      await client.messages.create({
        body: `Seu código de verificação da Plataforma Financeira é: ${code}. Válido por 5 minutos.`,
        from: twilioPhoneNumber,
        to: phoneNumber,
      });
      */
      
      // For now, just log in development
      console.log(`SMS Code for ${phoneNumber}: ${code}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error('Falha ao enviar SMS');
    }
  }

  async sendSuspiciousLoginAlert(
    phoneNumber: string, 
    ipAddress: string, 
    location: string
  ): Promise<void> {
    const message = `ALERTA SEGURANÇA: Tentativa de login suspeita detectada de ${ipAddress} (${location}). Se não foi você, altere sua senha imediatamente.`;
    
    // In development, just log
    console.log(`Security SMS for ${phoneNumber}: ${message}`);
    
    // In production, send actual SMS using the same logic as sendVerificationCode
  }
}