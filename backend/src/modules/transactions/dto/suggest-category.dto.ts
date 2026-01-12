import { IsString, IsNumber, Min, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestCategoryDto {
  @ApiProperty({
    description: 'Transaction description',
    example: 'Compras no supermercado Extra',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: 150.50,
    minimum: 0.01
  })
  @IsNumber()
  @Min(0.01)
  amount: number;
}