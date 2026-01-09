import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters, must contain uppercase, lowercase, number and special character)',
    example: 'MySecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo especial',
    },
  )
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name?: string;
}