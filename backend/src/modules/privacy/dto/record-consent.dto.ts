import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentType } from './consent-type.enum';

export class RecordConsentDto {
  @ApiProperty({
    enum: ConsentType,
    description: 'Tipo de consentimento',
    example: ConsentType.MARKETING,
  })
  @IsEnum(ConsentType)
  type: ConsentType;

  @ApiProperty({ description: 'Se o titular concedeu (true) ou revogou (false)', example: true })
  @IsBoolean()
  granted: boolean;

  @ApiPropertyOptional({
    description: 'Versão do documento aceito. Default: versão vigente.',
    example: '2026-01-15',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  version?: string;
}
