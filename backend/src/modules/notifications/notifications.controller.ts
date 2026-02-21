import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  @Get()
  @ApiOperation({ summary: 'Get notifications (stub)' })
  getNotifications(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return {
      success: true,
      data: {
        notifications: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
        hasMore: false,
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification stats (stub)' })
  getStats() {
    return {
      success: true,
      data: {
        total: 0,
        unread: 0,
        byType: { info: 0, warning: 0, success: 0, error: 0 },
      },
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread count (stub)' })
  getUnreadCount() {
    return { success: true, data: { count: 0 } };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences (stub)' })
  getPreferences() {
    return {
      success: true,
      data: {
        id: 'stub',
        userId: '',
        emailNotifications: true,
        pushNotifications: false,
        browserNotifications: true,
        smsNotifications: false,
        categories: {
          transactions: true,
          goals: true,
          investments: true,
          security: true,
          marketing: false,
          system: true,
        },
        frequency: 'immediate' as const,
        quietHours: { enabled: false, startTime: '22:00', endTime: '08:00' },
        updatedAt: new Date().toISOString(),
      },
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark as read (stub)' })
  markAsRead(@Param('id') id: string) {
    return { success: true };
  }

  @Patch('mark-read')
  @ApiOperation({ summary: 'Mark multiple as read (stub)' })
  markMultipleAsRead(@Body() body: { notificationIds: string[] }) {
    return { success: true };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all as read (stub)' })
  markAllAsRead() {
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification (stub)' })
  deleteNotification(@Param('id') id: string) {
    return { success: true };
  }

  @Delete('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete (stub)' })
  bulkDelete(@Body() body: { notificationIds: string[] }) {
    return { success: true };
  }

  @Delete('clear-all')
  @ApiOperation({ summary: 'Clear all (stub)' })
  clearAll() {
    return { success: true };
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update preferences (stub)' })
  updatePreferences(@Body() body: any) {
    return { success: true, data: body };
  }

  @Post('test')
  @ApiOperation({ summary: 'Send test notification (stub)' })
  sendTest(@Body() body: { type: string }) {
    return { success: true };
  }

  @Post('push/subscribe')
  @ApiOperation({ summary: 'Subscribe to push (stub)' })
  subscribeToPush(@Body() body: any) {
    return { success: true };
  }

  @Post('push/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from push (stub)' })
  unsubscribeFromPush() {
    return { success: true };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notification (stub)' })
  sendNotification(@Body() body: any) {
    return { success: true, data: { id: 'stub', ...body } };
  }
}
