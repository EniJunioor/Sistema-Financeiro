import { IsString, IsOptional, IsUUID, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Alimentação',
    minLength: 1,
    maxLength: 50
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: 'Category icon (emoji)',
    example: '🍽️'
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Category color (hex)',
    example: '#10b981'
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #10b981)' })
  color?: string;

  @ApiPropertyOptional({
    description: 'Parent category ID (for subcategories)',
    example: 'clx1234567890'
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}