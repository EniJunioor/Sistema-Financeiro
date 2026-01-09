import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TransactionsService } from '../services/transactions.service';
import { CategoryService } from '../services/category.service';
import { MLCategorizationService } from '../services/ml-categorization.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFiltersDto } from '../dto';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly categoryService: CategoryService,
    private readonly mlCategorizationService: MLCategorizationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    return this.transactionsService.create(createTransactionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async findAll(@Query() filters: TransactionFiltersDto, @Request() req) {
    return this.transactionsService.findAll(req.user.id, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Transaction statistics retrieved successfully',
  })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ) {
    return this.transactionsService.getStats(req.user.id, startDate, endDate);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search transactions by text' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum results' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: number,
    @Request() req?,
  ) {
    return this.transactionsService.searchTransactions(req.user.id, query, limit);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getCategories() {
    return this.categoryService.findAll();
  }

  @Get('categories/hierarchy')
  @ApiOperation({ summary: 'Get category hierarchy' })
  @ApiResponse({
    status: 200,
    description: 'Category hierarchy retrieved successfully',
  })
  async getCategoryHierarchy() {
    return this.categoryService.getHierarchy();
  }

  @Post('categories/suggest')
  @ApiOperation({ summary: 'Get category suggestion for transaction' })
  @ApiResponse({
    status: 200,
    description: 'Category suggestion retrieved successfully',
  })
  async suggestCategory(
    @Body() body: { description: string; amount: number },
    @Request() req,
  ) {
    return this.mlCategorizationService.suggestCategory(
      body.description,
      body.amount,
      req.user.id,
    );
  }

  @Get('categorization/stats')
  @ApiOperation({ summary: 'Get categorization statistics' })
  @ApiResponse({
    status: 200,
    description: 'Categorization statistics retrieved successfully',
  })
  async getCategorizationStats(@Request() req) {
    return this.mlCategorizationService.getCategorizationStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.transactionsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Request() req,
  ) {
    return this.transactionsService.update(id, updateTransactionDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiResponse({
    status: 204,
    description: 'Transaction deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async remove(@Param('id') id: string, @Request() req) {
    return this.transactionsService.remove(id, req.user.id);
  }

  @Post(':id/categorize')
  @ApiOperation({ summary: 'Manually categorize a transaction (for ML learning)' })
  @ApiResponse({
    status: 200,
    description: 'Transaction categorized and ML model updated',
  })
  async categorizeTransaction(
    @Param('id') id: string,
    @Body() body: { categoryId: string },
    @Request() req,
  ) {
    // Update the transaction
    await this.transactionsService.update(
      id,
      { categoryId: body.categoryId },
      req.user.id,
    );

    // Learn from user feedback
    await this.mlCategorizationService.learnFromUserFeedback(id, body.categoryId);

    return { message: 'Transaction categorized successfully' };
  }
}