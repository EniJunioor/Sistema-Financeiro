import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RequestDeletionDto {
  @ApiPropertyOptional({
    description: 'Motivo informado pelo titular (opcional)',
    example: 'Não uso mais o serviço',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
