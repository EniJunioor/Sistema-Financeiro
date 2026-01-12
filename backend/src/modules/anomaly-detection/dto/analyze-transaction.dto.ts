import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';

export class AnalyzeTransactionDto {
  @ApiProperty({ description: 'Transaction type' })
  @IsEnum(['income', 'expense', 'transfer'])
  type: 'income' | 'expense' | 'transfer';

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Transaction date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Account ID', required: false })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'Transaction location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Merchant name', required: false })
  @IsOptional()
  @IsString()
  merchant?: string;
}