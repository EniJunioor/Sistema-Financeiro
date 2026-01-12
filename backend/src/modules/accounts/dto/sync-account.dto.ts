import { IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SyncAccountDto {
  @ApiPropertyOptional({
    description: 'Start date for transaction sync (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for transaction sync (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Force full sync (ignore last sync date)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  forceFullSync?: boolean;
}