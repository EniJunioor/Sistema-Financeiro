import { IsString, IsEnum, IsDecimal, IsOptional, IsDateString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum InvestmentTransactionType {
  BUY = 'buy',
  SELL = 'sell',
  DIVIDEND = 'dividend',
}

export class CreateInvestmentTransactionDto {
  @ApiProperty({ description: 'Investment ID' })
  @IsString()
  investmentId: string;

  @ApiProperty({ enum: InvestmentTransactionType, description: 'Type of transaction' })
  @IsEnum(InvestmentTransactionType)
  type: InvestmentTransactionType;

  @ApiProperty({ description: 'Quantity of shares/units', type: 'number' })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '8' })
  @Min(0.00000001)
  quantity: number;

  @ApiProperty({ description: 'Price per unit', type: 'number' })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  price: number;

  @ApiProperty({ description: 'Transaction fees', type: 'number', required: false })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  fees?: number;

  @ApiProperty({ description: 'Transaction date' })
  @IsDateString()
  date: string;
}