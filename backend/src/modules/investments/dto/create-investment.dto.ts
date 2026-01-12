import { IsString, IsEnum, IsDecimal, IsOptional, Min, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum InvestmentType {
  STOCK = 'stock',
  FUND = 'fund',
  ETF = 'etf',
  CRYPTO = 'crypto',
  BOND = 'bond',
  DERIVATIVE = 'derivative',
}

export class CreateInvestmentDto {
  @ApiProperty({ description: 'Symbol or ticker of the investment' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  symbol: string;

  @ApiProperty({ description: 'Full name of the investment' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: InvestmentType, description: 'Type of investment' })
  @IsEnum(InvestmentType)
  type: InvestmentType;

  @ApiProperty({ description: 'Quantity of shares/units owned', type: 'number' })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '8' })
  @Min(0.00000001)
  quantity: number;

  @ApiProperty({ description: 'Average purchase price', type: 'number' })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  averagePrice: number;

  @ApiProperty({ description: 'Currency code', default: 'BRL', required: false })
  @IsOptional()
  @IsString()
  currency?: string = 'BRL';

  @ApiProperty({ description: 'Broker or exchange name', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  broker?: string;

  @ApiProperty({ description: 'Investment sector', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sector?: string;
}