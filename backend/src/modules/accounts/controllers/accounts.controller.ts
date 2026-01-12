import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AccountsService } from '../services/accounts.service';
import { OpenBankingService } from '../services/open-banking.service';
import { SyncService } from '../services/sync.service';
import { ConnectAccountDto } from '../dto/connect-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { AccountFiltersDto } from '../dto/account-filters.dto';
import { SyncAccountDto } from '../dto/sync-account.dto';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly openBankingService: OpenBankingService,
    private readonly syncService: SyncService,
  ) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect a new bank account via Open Banking' })
  @ApiResponse({ status: 201, description: 'Account connected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid connection data' })
  async connectAccount(
    @CurrentUser('id') userId: string,
    @Body() connectAccountDto: ConnectAccountDto,
  ) {
    return this.openBankingService.connectAccount(userId, connectAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user accounts' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  async getAccounts(
    @CurrentUser('id') userId: string,
    @Query() filters: AccountFiltersDto,
  ) {
    return this.accountsService.findAllByUser(userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(
    @CurrentUser('id') userId: string,
    @Param('id') accountId: string,
  ) {
    return this.accountsService.findOneByUser(userId, accountId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account information' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateAccount(
    @CurrentUser('id') userId: string,
    @Param('id') accountId: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(userId, accountId, updateAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect and remove account' })
  @ApiResponse({ status: 204, description: 'Account disconnected successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async disconnectAccount(
    @CurrentUser('id') userId: string,
    @Param('id') accountId: string,
  ) {
    return this.accountsService.disconnect(userId, accountId);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Manually sync account transactions' })
  @ApiResponse({ status: 200, description: 'Sync initiated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async syncAccount(
    @CurrentUser('id') userId: string,
    @Param('id') accountId: string,
    @Body() syncDto: SyncAccountDto,
  ) {
    return this.openBankingService.syncAccount(userId, accountId, syncDto);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get account transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getAccountTransactions(
    @CurrentUser('id') userId: string,
    @Param('id') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountsService.getTransactions(userId, accountId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('providers/supported')
  @ApiOperation({ summary: 'Get list of supported Open Banking providers' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async getSupportedProviders() {
    return this.openBankingService.getSupportedProviders();
  }

  @Post('providers/:provider/auth-url')
  @ApiOperation({ summary: 'Get authentication URL for Open Banking provider' })
  @ApiResponse({ status: 200, description: 'Auth URL generated successfully' })
  async getAuthUrl(
    @CurrentUser('id') userId: string,
    @Param('provider') provider: string,
    @Body('redirectUri') redirectUri: string,
  ) {
    return this.openBankingService.getAuthUrl(provider, userId, redirectUri);
  }

  @Get('sync/status')
  @ApiOperation({ summary: 'Get sync queue status' })
  @ApiResponse({ status: 200, description: 'Sync status retrieved successfully' })
  async getSyncStatus(@CurrentUser('id') userId: string) {
    return this.syncService.getSyncStatus();
  }

  @Post('sync/all')
  @ApiOperation({ summary: 'Sync all user accounts' })
  @ApiResponse({ status: 200, description: 'Sync initiated for all accounts' })
  async syncAllAccounts(@CurrentUser('id') userId: string) {
    return this.syncService.syncAllUserAccounts(userId);
  }
}