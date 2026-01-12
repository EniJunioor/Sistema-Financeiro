import { IsString, IsEnum, IsOptional, IsUrl, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OpenBankingProvider {
  PLAID = 'plaid',
  TRUELAYER = 'truelayer',
  PLUGGY = 'pluggy',
  BELVO = 'belvo',
}

export class ConnectAccountDto {
  @ApiProperty({
    description: 'Open Banking provider',
    enum: OpenBankingProvider,
    example: OpenBankingProvider.PLAID,
  })
  @IsEnum(OpenBankingProvider)
  provider: OpenBankingProvider;

  @ApiProperty({
    description: 'Authorization code from provider',
    example: 'auth_code_12345',
  })
  @IsString()
  authCode: string;

  @ApiPropertyOptional({
    description: 'Provider-specific account ID',
    example: 'acc_12345',
  })
  @IsOptional()
  @IsString()
  providerAccountId?: string;

  @ApiPropertyOptional({
    description: 'Redirect URI used in OAuth flow',
    example: 'https://app.example.com/callback',
  })
  @IsOptional()
  @IsUrl()
  redirectUri?: string;

  @ApiPropertyOptional({
    description: 'Additional provider-specific metadata',
    example: { institutionId: 'ins_12345' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}