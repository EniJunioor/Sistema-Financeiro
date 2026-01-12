import { IsString, IsOptional, IsBoolean } from 'class-validator';
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
}