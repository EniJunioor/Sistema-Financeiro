import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'a1b2c3d4e5f6...',
    required: false,
  })
  refresh_token?: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 86400,
  })
  expires_in: number;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified?: Date;
    twoFactorEnabled: boolean;
  };
}