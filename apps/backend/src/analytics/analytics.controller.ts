import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Dashboard KPIs + grouped metrics' })
  overview(@CurrentUser() user: RequestUser) {
    return this.analytics.overview(user.organizationId);
  }

  @Get('map-overview')
  @ApiOperation({ summary: 'Zone map with heatmap stats' })
  mapOverview(@CurrentUser() user: RequestUser) {
    return this.analytics.mapOverview(user.organizationId);
  }

  @Get('activity-logs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'List recent activity logs (Owner only)' })
  getActivityLogs(@CurrentUser() user: RequestUser) {
    return this.analytics.getActivityLogs(user.organizationId);
  }
}
