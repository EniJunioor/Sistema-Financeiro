import { IsString, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';

export class Enable2FADto {
  @IsEnum(['totp', 'sms', 'email'])
  method: 'totp' | 'sms' | 'email';

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;
}

export class Verify2FADto {
  @IsString()
  token: string;

  @IsEnum(['totp', 'sms', 'email', 'backup'])
  method: 'totp' | 'sms' | 'email' | 'backup';
}

export class Disable2FADto {
  @IsString()
  password: string;

  @IsString()
  token: string;
}

export class Generate2FABackupCodesDto {
  @IsString()
  password: string;
}