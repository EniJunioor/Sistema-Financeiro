import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get('MICROSOFT_CLIENT_ID'),
      clientSecret: configService.get('MICROSOFT_CLIENT_SECRET'),
      callbackURL: configService.get('MICROSOFT_CALLBACK_URL', '/auth/microsoft/callback'),
      scope: ['user.read'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, displayName, emails, photos } = profile;
      
      const user = await this.authService.findOrCreateOAuthUser({
        provider: 'microsoft',
        providerAccountId: id,
        email: emails?.[0]?.value,
        name: displayName,
        avatar: photos?.[0]?.value,
        accessToken,
        refreshToken,
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}