import { IsArray, ArrayMinSize, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteDto {
  @ApiProperty({ description: 'Transaction IDs to delete', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  transactionIds: string[];
}
