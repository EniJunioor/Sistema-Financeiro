import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'MySecurePass123!',
  })
  @IsString()
  @MinLength(1, { message: 'Senha é obrigatória' })
  password: string;

  @ApiProperty({
    description: 'Two-factor authentication token (if 2FA is enabled)',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  twoFactorToken?: string;
}