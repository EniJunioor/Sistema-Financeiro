import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}