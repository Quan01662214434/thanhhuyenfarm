import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'In-app notifications' })
  list(@CurrentUser() user: RequestUser) {
    return this.notifications.listForUser(user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification read' })
  markRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.markRead(user.userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications read' })
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllRead(user.userId);
  }
}
