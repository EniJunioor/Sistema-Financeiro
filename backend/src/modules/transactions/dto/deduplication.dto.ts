import { IsOptional, IsNumber, IsBoolean, IsDateString, IsString, IsEnum, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeduplicationCriteriaDto {
  @ApiPropertyOptional({ description: 'Enable date matching', default: true })
  @IsOptional()
  @IsBoolean()
  date?: boolean;

  @ApiPropertyOptional({ description: 'Enable amount matching', default: true })
  @IsOptional()
  @IsBoolean()
  amount?: boolean;

  @ApiPropertyOptional({ description: 'Enable description matching', default: true })
  @IsOptional()
  @IsBoolean()
  description?: boolean;

  @ApiPropertyOptional({ description: 'Enable location matching', default: true })
  @IsOptional()
  @IsBoolean()
  location?: boolean;

  @ApiPropertyOptional({ description: 'Enable account matching', default: true })
  @IsOptional()
  @IsBoolean()
  account?: boolean;
}

export class DeduplicationSettingsDto {
  @ApiPropertyOptional({ 
    description: 'Date tolerance in days', 
    minimum: 0, 
    maximum: 30, 
    default: 3 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  dateToleranceDays?: number;

  @ApiPropertyOptional({ 
    description: 'Amount tolerance percentage', 
    minimum: 0, 
    maximum: 100, 
    default: 1.0 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  amountTolerancePercent?: number;

  @ApiPropertyOptional({ 
    description: 'Description similarity threshold (0.0 to 1.0)', 
    minimum: 0, 
    maximum: 1, 
    default: 0.8 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  descriptionSimilarityThreshold?: number;

  @ApiPropertyOptional({ 
    description: 'Auto-merge threshold (0.0 to 1.0)', 
    minimum: 0, 
    maximum: 1, 
    default: 0.95 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  autoMergeThreshold?: number;

  @ApiPropertyOptional({ description: 'Enabled matching criteria' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeduplicationCriteriaDto)
  enabledCriteria?: DeduplicationCriteriaDto;
}

export class DetectDuplicatesDto {
  @ApiProperty({ description: 'Start date for duplicate detection' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for duplicate detection' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Deduplication settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeduplicationSettingsDto)
  settings?: DeduplicationSettingsDto;
}

export class DetectTransactionDuplicatesDto {
  @ApiProperty({ description: 'Transaction ID to check for duplicates' })
  @IsString()
  transactionId: string;

  @ApiPropertyOptional({ description: 'Deduplication settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeduplicationSettingsDto)
  settings?: DeduplicationSettingsDto;
}

export class ApproveDuplicateMergeDto {
  @ApiProperty({ description: 'Match ID (format: originalId-duplicateId)' })
  @IsString()
  matchId: string;

  @ApiProperty({ description: 'ID of the transaction to keep' })
  @IsString()
  keepTransactionId: string;
}

export class RejectDuplicateMatchDto {
  @ApiProperty({ description: 'Match ID (format: originalId-duplicateId)' })
  @IsString()
  matchId: string;
}

export class DuplicateMatchResponseDto {
  @ApiProperty({ description: 'Unique match identifier' })
  id: string;

  @ApiProperty({ description: 'Original transaction' })
  originalTransaction: any; // Transaction interface

  @ApiProperty({ description: 'Duplicate transaction' })
  duplicateTransaction: any; // Transaction interface

  @ApiProperty({ description: 'Confidence score (0.0 to 1.0)' })
  confidence: number;

  @ApiProperty({ description: 'Matching criteria that contributed to the match' })
  matchingCriteria: string[];

  @ApiProperty({ 
    description: 'Match status',
    enum: ['pending', 'approved', 'rejected']
  })
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({ description: 'When the match was created' })
  createdAt: Date;
}

export class DeduplicationResultDto {
  @ApiProperty({ description: 'Total number of duplicates found' })
  duplicatesFound: number;

  @ApiProperty({ 
    description: 'Array of duplicate matches',
    type: [DuplicateMatchResponseDto]
  })
  matches: DuplicateMatchResponseDto[];

  @ApiProperty({ description: 'Number of automatically merged duplicates' })
  autoMerged: number;

  @ApiProperty({ description: 'Number of matches pending user review' })
  pendingReview: number;
}