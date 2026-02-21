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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { RecurringTransactionsService } from '../services/recurring-transactions.service';
import { RecurringSchedulerService } from '../services/recurring-scheduler.service';
import { 
  CreateTransactionDto, 
  UpdateTransactionDto, 
  TransactionFiltersDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  BulkCategorizeDto,
  BulkDeleteDto,
  SuggestCategoryDto
} from '../dto';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly categoryService: CategoryService,
    private readonly mlCategorizationService: MLCategorizationService,
    private readonly recurringTransactionsService: RecurringTransactionsService,
    private readonly recurringSchedulerService: RecurringSchedulerService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload transaction attachment (stub)' })
  @ApiResponse({ status: 200, description: 'File upload stub' })
  uploadAttachment(@UploadedFile() file?: { originalname?: string }) {
    return { url: '/uploads/stub', filename: file?.originalname ?? 'stub' };
  }

  @Post('ocr')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'OCR extract from image (stub)' })
  @ApiResponse({ status: 200, description: 'OCR stub' })
  processOCR(@UploadedFile() file?: { originalname?: string }) {
    return {
      amount: undefined,
      description: undefined,
      date: undefined,
      merchant: undefined,
      confidence: 0,
    };
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import transactions from CSV (stub)' })
  @ApiResponse({ status: 200, description: 'Import stub' })
  importFromCSV(@UploadedFile() file?: { originalname?: string }) {
    return {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: ['Importação em desenvolvimento. Adicione transações manualmente.'],
    };
  }

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
    @Body() suggestCategoryDto: SuggestCategoryDto,
    @Request() req,
  ) {
    return this.mlCategorizationService.suggestCategory(
      suggestCategoryDto.description,
      suggestCategoryDto.amount,
      req.user.id,
    );
  }

  @Post('categories/suggest-multiple')
  @ApiOperation({ summary: 'Get multiple category suggestions for transaction' })
  @ApiResponse({
    status: 200,
    description: 'Multiple category suggestions retrieved successfully',
  })
  async suggestMultipleCategories(
    @Body() suggestCategoryDto: SuggestCategoryDto,
    @Request() req,
  ) {
    return this.mlCategorizationService.getPersonalizedSuggestions(
      req.user.id,
      suggestCategoryDto.description,
      suggestCategoryDto.amount,
    );
  }

  @Post('categories/initialize-defaults')
  @ApiOperation({ summary: 'Initialize default system categories' })
  @ApiResponse({
    status: 200,
    description: 'Default categories initialized successfully',
  })
  async initializeDefaultCategories() {
    await this.categoryService.createDefaultCategories();
    return { message: 'Default categories initialized successfully' };
  }

  @Post('ml/improve-model')
  @ApiOperation({ summary: 'Improve ML categorization model based on user corrections' })
  @ApiResponse({
    status: 200,
    description: 'Model improvement analysis completed',
  })
  async improveCategorizationModel(@Request() req) {
    return this.mlCategorizationService.improveCategorizationModel(req.user.id);
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

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or category already exists',
  })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    return this.categoryService.create(createCategoryDto, req.user.id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update system category or invalid data',
  })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: 204,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete system category or category with transactions',
  })
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }

  @Get('categories/stats')
  @ApiOperation({ summary: 'Get categories with usage statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Categories with statistics retrieved successfully',
  })
  async getCategoriesWithStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.categoryService.getCategoriesWithStats(req.user.id, start, end);
  }

  @Get('categories/most-used')
  @ApiOperation({ summary: 'Get most used categories' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum results' })
  @ApiResponse({
    status: 200,
    description: 'Most used categories retrieved successfully',
  })
  async getMostUsedCategories(
    @Query('limit') limit?: number,
    @Request() req?,
  ) {
    return this.categoryService.getMostUsedCategories(req.user.id, limit);
  }

  @Get('categories/search')
  @ApiOperation({ summary: 'Search categories' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async searchCategories(@Query('q') query: string) {
    return this.categoryService.searchCategories(query);
  }

  @Post('bulk-categorize')
  @ApiOperation({ summary: 'Bulk categorize transactions (by IDs or ML auto-categorize)' })
  @ApiResponse({
    status: 200,
    description: 'Bulk categorization completed',
  })
  async bulkCategorizeTransactions(
    @Body() dto: BulkCategorizeDto,
    @Request() req,
  ) {
    if (dto.transactionIds?.length && dto.categoryId) {
      return this.transactionsService.bulkCategorizeByIds(
        req.user.id,
        dto.transactionIds,
        dto.categoryId,
      );
    }
    return this.mlCategorizationService.bulkCategorizeTransactions(
      req.user.id,
      dto.limit ?? 100,
    );
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple transactions' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete completed',
  })
  async bulkDeleteTransactions(
    @Body() dto: BulkDeleteDto,
    @Request() req,
  ) {
    return this.transactionsService.bulkDelete(req.user.id, dto.transactionIds);
  }

  @Get('ml/accuracy')
  @ApiOperation({ summary: 'Get ML categorization accuracy metrics' })
  @ApiResponse({
    status: 200,
    description: 'Accuracy metrics retrieved successfully',
  })
  async getCategoryPredictionAccuracy(@Request() req) {
    return this.mlCategorizationService.getCategoryPredictionAccuracy(req.user.id);
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

  // Recurring Transactions Endpoints

  @Get('recurring')
  @ApiOperation({ summary: 'Get all recurring transactions for the user' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transactions retrieved successfully',
  })
  async getRecurringTransactions(@Request() req) {
    return this.recurringTransactionsService.getUserRecurringTransactions(req.user.id);
  }

  @Post('recurring/process')
  @ApiOperation({ summary: 'Manually trigger processing of all due recurring transactions' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transactions processing triggered',
  })
  async triggerRecurringProcessing() {
    await this.recurringSchedulerService.triggerRecurringTransactionsProcessing();
    return { message: 'Recurring transactions processing triggered' };
  }

  @Get('recurring/queue-stats')
  @ApiOperation({ summary: 'Get recurring transactions queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  async getQueueStats() {
    return this.recurringSchedulerService.getQueueStats();
  }

  @Patch('recurring/:id')
  @ApiOperation({ summary: 'Update a recurring transaction' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transaction updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring transaction not found',
  })
  async updateRecurringTransaction(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Request() req,
  ) {
    await this.recurringTransactionsService.updateRecurringTransaction(
      id,
      req.user.id,
      updateTransactionDto,
    );
    return { message: 'Recurring transaction updated successfully' };
  }

  @Delete('recurring/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a recurring transaction' })
  @ApiResponse({
    status: 204,
    description: 'Recurring transaction canceled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring transaction not found',
  })
  async cancelRecurringTransaction(@Param('id') id: string, @Request() req) {
    await this.recurringTransactionsService.cancelRecurringTransaction(id, req.user.id);
    return { message: 'Recurring transaction canceled successfully' };
  }
}