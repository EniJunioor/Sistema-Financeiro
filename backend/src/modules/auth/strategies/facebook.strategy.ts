import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get('FACEBOOK_CLIENT_ID') || 'disabled',
      clientSecret: configService.get('FACEBOOK_CLIENT_SECRET') || 'disabled',
      callbackURL: configService.get('FACEBOOK_CALLBACK_URL', '/auth/facebook/callback'),
      scope: 'email',
      profileFields: ['emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      
      const user = await this.authService.findOrCreateOAuthUser({
        provider: 'facebook',
        providerAccountId: id,
        email: emails?.[0]?.value,
        name: `${name?.givenName} ${name?.familyName}`,
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