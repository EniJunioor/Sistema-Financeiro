import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DeduplicationService } from '../services/deduplication.service';
import {
  DetectDuplicatesDto,
  DetectTransactionDuplicatesDto,
  ApproveDuplicateMergeDto,
  RejectDuplicateMatchDto,
  DeduplicationResultDto,
  DuplicateMatchResponseDto,
} from '../dto/deduplication.dto';

@ApiTags('Transaction Deduplication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions/deduplication')
export class DeduplicationController {
  constructor(private readonly deduplicationService: DeduplicationService) {}

  @Post('detect-range')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Detect duplicates in date range',
    description: 'Analyze transactions within a specified date range to identify potential duplicates using intelligent algorithms'
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicate detection completed successfully',
    type: DeduplicationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date range or settings',
  })
  async detectDuplicatesInRange(
    @Body() dto: DetectDuplicatesDto,
    @Request() req: any,
  ): Promise<DeduplicationResultDto> {
    const userId = req.user.id;
    
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Validate date range
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Limit date range to prevent performance issues (max 1 year)
    const maxRangeDays = 365;
    const rangeDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (rangeDays > maxRangeDays) {
      throw new BadRequestException(`Date range cannot exceed ${maxRangeDays} days`);
    }

    return this.deduplicationService.detectDuplicatesInRange(
      userId,
      startDate,
      endDate,
      dto.settings
    );
  }

  @Post('detect-transaction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Detect duplicates for specific transaction',
    description: 'Find potential duplicates for a single transaction using multiple matching criteria'
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicate detection completed successfully',
    type: [DuplicateMatchResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async detectDuplicatesForTransaction(
    @Body() dto: DetectTransactionDuplicatesDto,
    @Request() req: any,
  ): Promise<DuplicateMatchResponseDto[]> {
    const userId = req.user.id;
    
    return this.deduplicationService.detectDuplicatesForTransaction(
      dto.transactionId,
      userId,
      dto.settings
    );
  }

  @Post('approve-merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Approve duplicate merge',
    description: 'Approve merging of duplicate transactions, keeping the specified transaction and deleting the other'
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicate merge approved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid match ID or transaction ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Transactions not found or unauthorized',
  })
  async approveDuplicateMerge(
    @Body() dto: ApproveDuplicateMergeDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.id;
    
    // Validate match ID format
    if (!dto.matchId.includes('-')) {
      throw new BadRequestException('Invalid match ID format');
    }

    const [originalId, duplicateId] = dto.matchId.split('-');
    
    // Validate that keepTransactionId is one of the matched transactions
    if (dto.keepTransactionId !== originalId && dto.keepTransactionId !== duplicateId) {
      throw new BadRequestException('Keep transaction ID must be one of the matched transactions');
    }

    await this.deduplicationService.approveDuplicateMerge(
      dto.matchId,
      userId,
      dto.keepTransactionId
    );

    return {
      success: true,
      message: 'Duplicate merge approved successfully'
    };
  }

  @Post('reject-match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reject duplicate match',
    description: 'Reject a potential duplicate match, indicating these transactions should not be merged'
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicate match rejected successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid match ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Transactions not found or unauthorized',
  })
  async rejectDuplicateMatch(
    @Body() dto: RejectDuplicateMatchDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.id;
    
    // Validate match ID format
    if (!dto.matchId.includes('-')) {
      throw new BadRequestException('Invalid match ID format');
    }

    await this.deduplicationService.rejectDuplicateMatch(
      dto.matchId,
      userId
    );

    return {
      success: true,
      message: 'Duplicate match rejected successfully'
    };
  }
}