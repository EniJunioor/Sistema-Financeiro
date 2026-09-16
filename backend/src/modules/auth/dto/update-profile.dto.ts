import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Maria Silva' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.exemplo.com/avatar.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiPropertyOptional({ example: '(11) 98765-4321' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo, 123' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @ApiPropertyOptional({ example: '01234-567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({ example: 'Usuário do sistema financeiro' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({ description: 'Senha atual' })
  @IsString()
  currentPassword: string;

  @ApiPropertyOptional({ description: 'Nova senha (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

/**
 * Preferências do usuário. O corpo é livre por design — a tela de
 * preferências evolui sem exigir migração de banco — mas é validado como
 * objeto e persistido serializado.
 */
export class UpdatePreferencesDto {
  @ApiPropertyOptional({ example: 'pt-BR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({ example: 'BRL' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 'dark' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  theme?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  timezone?: string;

  @ApiPropertyOptional({ example: 'dd/MM/yyyy' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  dateFormat?: string;

  @ApiPropertyOptional({
    description: 'Canais de notificação habilitados',
    example: { email: true, push: false, sms: false },
  })
  @IsOptional()
  notifications?: Record<string, boolean>;
}
