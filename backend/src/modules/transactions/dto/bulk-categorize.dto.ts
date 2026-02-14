import { IsOptional, IsNumber, IsArray, IsString, Min, Max, ArrayMinSize, MinLength } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BulkCategorizeDto {
  @ApiPropertyOptional({
    description: 'Maximum number of transactions to process (for ML auto-categorize)',
    example: 100,
    minimum: 1,
    maximum: 1000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @ApiPropertyOptional({
    description: 'Specific transaction IDs to categorize (alternative to limit)',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  transactionIds?: string[];

  @ApiPropertyOptional({
    description: 'Category ID to assign (required when transactionIds provided)'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryId?: string;
}