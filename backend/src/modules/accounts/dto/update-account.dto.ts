import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: 'Custom name for the account',
    example: 'My Checking Account',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Whether the account is active for sync',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Limite total do cartão. Só faz sentido para type = credit_card.',
    example: 5000,
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? value : parseFloat(value)))
  @IsNumber()
  @Min(0)
  creditLimit?: number;
}