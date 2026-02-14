import { IsArray, IsString, ArrayMinSize, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUpdateCategoryDto {
  @ApiProperty({ description: 'Transaction IDs to update', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  transactionIds: string[];

  @ApiProperty({ description: 'Category ID to assign' })
  @IsString()
  @MinLength(1)
  categoryId: string;
}
