import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards';
import { CurrentUser } from '../decorators';
import { ProfileService } from '../services/profile.service';
import {
  ChangePasswordDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from '../dto/update-profile.dto';

@ApiTags('Profile')
@Controller('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.profileService.getProfile(userId);
    return { message: 'Profile retrieved successfully', user };
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.profileService.updateProfile(userId, dto);
    return { message: 'Profile updated successfully', user };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.profileService.getPreferences(userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.profileService.updatePreferences(userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description: 'Revoga todas as sessões e refresh tokens após a troca.',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(userId, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions' })
  async getActiveSessions(@CurrentUser('id') userId: string) {
    return this.profileService.getActiveSessions(userId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.profileService.revokeSession(userId, sessionId);
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all sessions' })
  async revokeAllSessions(@CurrentUser('id') userId: string) {
    return this.profileService.revokeAllSessions(userId);
  }

  @Get('security-events')
  @ApiOperation({
    summary: 'Recent login attempts',
    description: 'Inclui tentativas com falha, para o titular detectar acesso indevido.',
  })
  async getSecurityEvents(@CurrentUser('id') userId: string) {
    return this.profileService.getSecurityEvents(userId);
  }
}
