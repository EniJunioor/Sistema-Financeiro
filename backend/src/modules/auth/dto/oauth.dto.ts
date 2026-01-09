import { IsString, IsEmail, IsOptional } from 'class-validator';

export class OAuthUserDto {
  @IsString()
  provider: string;

  @IsString()
  providerAccountId: string;

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class OAuthCallbackDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  state?: string;
}