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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from '../services/subscriptions.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionFiltersDto,
} from '../dto';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Account or category not found' })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto, @Request() req) {
    return this.subscriptionsService.create(createSubscriptionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions for the user' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async findAll(@Query() filters: SubscriptionFiltersDto, @Request() req) {
    return this.subscriptionsService.findAll(req.user.id, filters);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming subscriptions' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days ahead to look (default: 30)' })
  @ApiResponse({ status: 200, description: 'Upcoming subscriptions retrieved successfully' })
  async getUpcoming(@Query('days') days: string, @Request() req) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.subscriptionsService.getUpcoming(req.user.id, daysNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.subscriptionsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Request() req,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiResponse({ status: 204, description: 'Subscription deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.subscriptionsService.remove(id, req.user.id);
  }
}
