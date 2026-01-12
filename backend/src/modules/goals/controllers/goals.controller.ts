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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GoalsService } from '../services/goals.service';
import { ProgressService } from '../services/progress.service';
import { GamificationService } from '../services/gamification.service';
import { CreateGoalDto, UpdateGoalDto, GoalFiltersDto, GoalProgressDto } from '../dto';

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly progressService: ProgressService,
    private readonly gamificationService: GamificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  async create(@Body() createGoalDto: CreateGoalDto, @Request() req) {
    return this.goalsService.create(createGoalDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals for the user' })
  @ApiResponse({ status: 200, description: 'Goals retrieved successfully' })
  async findAll(@Query() filters: GoalFiltersDto, @Request() req) {
    return this.goalsService.findAll(req.user.id, filters);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get progress for all goals' })
  @ApiResponse({ status: 200, description: 'Goal progress retrieved successfully' })
  async getAllProgress(@Request() req): Promise<GoalProgressDto[]> {
    return this.progressService.getAllGoalsProgress(req.user.id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active goals' })
  @ApiResponse({ status: 200, description: 'Active goals retrieved successfully' })
  async getActiveGoals(@Request() req) {
    return this.goalsService.getActiveGoals(req.user.id);
  }

  @Get('completed')
  @ApiOperation({ summary: 'Get completed goals' })
  @ApiResponse({ status: 200, description: 'Completed goals retrieved successfully' })
  async getCompletedGoals(@Request() req) {
    return this.goalsService.getCompletedGoals(req.user.id);
  }
  @Get('insights')
  @ApiOperation({ summary: 'Get goal insights and statistics' })
  @ApiResponse({ status: 200, description: 'Goal insights retrieved successfully' })
  async getInsights(@Request() req) {
    return this.progressService.getGoalInsights(req.user.id);
  }

  @Get('gamification')
  @ApiOperation({ summary: 'Get gamification data' })
  @ApiResponse({ status: 200, description: 'Gamification data retrieved successfully' })
  async getGamificationData(@Request() req) {
    return this.gamificationService.getGamificationData(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific goal' })
  @ApiResponse({ status: 200, description: 'Goal retrieved successfully' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.goalsService.findOne(id, req.user.id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get progress for a specific goal' })
  @ApiResponse({ status: 200, description: 'Goal progress retrieved successfully' })
  async getGoalProgress(@Param('id') id: string, @Request() req): Promise<GoalProgressDto> {
    const goal = await this.goalsService.findOne(id, req.user.id);
    return this.progressService.calculateGoalProgress(goal);
  }

  @Get(':id/suggestions')
  @ApiOperation({ summary: 'Get suggestions for goal adjustments' })
  @ApiResponse({ status: 200, description: 'Goal suggestions retrieved successfully' })
  async getGoalSuggestions(@Param('id') id: string, @Request() req) {
    return this.progressService.suggestGoalAdjustments(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiResponse({ status: 200, description: 'Goal updated successfully' })
  async update(@Param('id') id: string, @Body() updateGoalDto: UpdateGoalDto, @Request() req) {
    return this.goalsService.update(id, updateGoalDto, req.user.id);
  }

  @Post(':id/update-progress')
  @ApiOperation({ summary: 'Manually update goal progress' })
  @ApiResponse({ status: 200, description: 'Goal progress updated successfully' })
  async updateProgress(@Param('id') id: string, @Request() req) {
    await this.goalsService.updateProgress(id, req.user.id);
    return { message: 'Progress updated successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiResponse({ status: 200, description: 'Goal deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.goalsService.remove(id, req.user.id);
    return { message: 'Goal deleted successfully' };
  }
}