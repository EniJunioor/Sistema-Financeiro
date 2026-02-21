import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';

@ApiTags('currencies')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get exchange rates (public)' })
  @ApiQuery({ name: 'base', required: false, example: 'BRL' })
  @ApiQuery({ name: 'symbols', required: false, example: 'USD,EUR,CAD' })
  @ApiResponse({ status: 200, description: 'Exchange rates' })
  async getRates(
    @Query('base') base?: string,
    @Query('symbols') symbols?: string,
  ) {
    return this.currenciesService.getRates(base || 'BRL', symbols || 'USD,EUR,CAD');
  }
}
