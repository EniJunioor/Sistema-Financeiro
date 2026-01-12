import { IsEnum, IsDecimal, IsString, IsDateString, IsOptional, IsUUID, IsArray, IsBoolean, MinLength, MaxLength, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringRuleDto } from './recurring-rule.dto';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Type of transaction',
    enum: ['income', 'expense', 'transfer'],
    example: 'expense'
  })
  @IsEnum(['income', 'expense', 'transfer'])
  type: 'income' | 'expense' | 'transfer';

  @ApiProperty({
    description: 'Transaction amount',
    example: 150.50,
    minimum: 0.01
  })
  @Type(() => Number)
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Grocery shopping at Walmart',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description: string;

  @ApiProperty({
    description: 'Transaction date',
    example: '2024-01-15T10:30:00Z'
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Account ID',
    example: 'clx1234567890'
  })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'clx0987654321'
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Transaction tags',
    example: ['food', 'grocery', 'essential'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Transaction location',
    example: 'Walmart, Main Street'
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Is recurring transaction',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'Recurring rule configuration',
    type: RecurringRuleDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurringRuleDto)
  recurringRule?: RecurringRuleDto;

  @ApiPropertyOptional({
    description: 'Attachment URLs',
    example: ['https://example.com/receipt1.jpg'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: '{"source": "manual", "confidence": 0.95}'
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}