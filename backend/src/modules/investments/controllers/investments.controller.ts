import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvestmentsService } from '../services/investments.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from '../dto';
import { CreateInvestmentTransactionDto } from '../dto/investment-transaction.dto';
import { PortfolioFiltersDto } from '../dto/portfolio-filters.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('investments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new investment' })
  @ApiResponse({ status: 201, description: 'Investment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Investment already exists' })
  create(@Body() createInvestmentDto: CreateInvestmentDto, @Request() req) {
    return this.investmentsService.create(createInvestmentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all investments for the user' })
  @ApiResponse({ status: 200, description: 'List of investments' })
  findAll(@Request() req, @Query() filters: PortfolioFiltersDto) {
    return this.investmentsService.findAll(req.user.id, filters);
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Get portfolio summary' })
  @ApiResponse({ status: 200, description: 'Portfolio summary with performance metrics' })
  getPortfolio(@Request() req, @Query() filters: PortfolioFiltersDto) {
    return this.investmentsService.getPortfolio(req.user.id, filters);
  }

  @Get('allocation')
  @ApiOperation({ summary: 'Get asset allocation breakdown' })
  @ApiResponse({ status: 200, description: 'Asset allocation by type, sector, broker, and currency' })
  getAssetAllocation(@Request() req) {
    return this.investmentsService.getAssetAllocation(req.user.id);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get portfolio performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics including returns, volatility, and Sharpe ratio' })
  getPerformanceMetrics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.investmentsService.getPerformanceMetrics(req.user.id, start, end);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get investment statistics' })
  @ApiResponse({ status: 200, description: 'Investment statistics and distributions' })
  getInvestmentStats(@Request() req) {
    return this.investmentsService.getInvestmentStats(req.user.id);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get supported investment types' })
  @ApiResponse({ status: 200, description: 'List of supported investment types' })
  getSupportedTypes() {
    return this.investmentsService.getSupportedTypes();
  }

  @Get('analysis/diversification')
  @ApiOperation({ summary: 'Get portfolio diversification metrics' })
  @ApiResponse({ status: 200, description: 'Diversification analysis including HHI and concentration metrics' })
  getDiversificationMetrics(@Request() req) {
    return this.investmentsService.getDiversificationMetrics(req.user.id);
  }

  @Get('analysis/risk')
  @ApiOperation({ summary: 'Get portfolio risk metrics including VaR' })
  @ApiResponse({ status: 200, description: 'Risk metrics including VaR, volatility, and drawdown' })
  getRiskMetrics(@Request() req) {
    return this.investmentsService.getRiskMetrics(req.user.id);
  }

  @Get('analysis/benchmarks')
  @ApiOperation({ summary: 'Compare portfolio against benchmarks' })
  @ApiResponse({ status: 200, description: 'Benchmark comparison with alpha, beta, and correlation' })
  getBenchmarkComparison(@Request() req) {
    return this.investmentsService.getBenchmarkComparison(req.user.id);
  }

  @Post('analysis/optimal-allocation')
  @ApiOperation({ summary: 'Get optimal allocation suggestions' })
  @ApiResponse({ status: 200, description: 'Optimal allocation based on risk tolerance' })
  getOptimalAllocation(
    @Request() req,
    @Body() body: { riskTolerance: 'conservative' | 'moderate' | 'aggressive' },
  ) {
    return this.investmentsService.getOptimalAllocation(req.user.id, body.riskTolerance);
  }

  @Post('analysis/rebalancing-strategy')
  @ApiOperation({ summary: 'Get advanced rebalancing strategy with costs and tax implications' })
  @ApiResponse({ status: 200, description: 'Detailed rebalancing strategy' })
  getAdvancedRebalancingStrategy(
    @Request() req,
    @Body() targetAllocation: { [key: string]: number },
  ) {
    return this.investmentsService.getAdvancedRebalancingStrategy(req.user.id, targetAllocation);
  }

  @Post('rebalance')
  @ApiOperation({ summary: 'Get rebalancing recommendations' })
  @ApiResponse({ status: 200, description: 'Rebalancing recommendations based on target allocation' })
  getRebalancingRecommendations(
    @Request() req,
    @Body() targetAllocation: { [key: string]: number },
  ) {
    return this.investmentsService.getRebalancingRecommendations(req.user.id, targetAllocation);
  }

  @Post('quotes/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current prices for all investments' })
  @ApiResponse({ status: 200, description: 'Quotes updated successfully' })
  updateQuotes(@Request() req) {
    return this.investmentsService.updateQuotes(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get investment by ID' })
  @ApiResponse({ status: 200, description: 'Investment details' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.investmentsService.findOne(id, req.user.id);
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get performance metrics for a specific investment' })
  @ApiResponse({ status: 200, description: 'Investment performance metrics' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  getInvestmentPerformance(@Param('id') id: string, @Request() req) {
    return this.investmentsService.getInvestmentPerformance(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update investment' })
  @ApiResponse({ status: 200, description: 'Investment updated successfully' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  update(
    @Param('id') id: string,
    @Body() updateInvestmentDto: UpdateInvestmentDto,
    @Request() req,
  ) {
    return this.investmentsService.update(id, updateInvestmentDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete investment' })
  @ApiResponse({ status: 200, description: 'Investment deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete investment with multiple transactions' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.investmentsService.remove(id, req.user.id);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Add investment transaction (buy/sell/dividend)' })
  @ApiResponse({ status: 201, description: 'Transaction added successfully' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  addTransaction(@Body() createTransactionDto: CreateInvestmentTransactionDto, @Request() req) {
    return this.investmentsService.addTransaction(createTransactionDto, req.user.id);
  }
}