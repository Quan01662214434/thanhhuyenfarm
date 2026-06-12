import { Controller, Post, Get, Patch, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Employee check-in' })
  checkIn(@CurrentUser() user: RequestUser, @Body() dto: { latitude?: number; longitude?: number; note?: string }) {
    return this.attendance.checkIn(user, dto);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Employee check-out' })
  checkOut(@CurrentUser() user: RequestUser, @Body() dto: { note?: string }) {
    return this.attendance.checkOut(user, dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current user today attendance status' })
  getStatus(@CurrentUser() user: RequestUser) {
    return this.attendance.getTodayStatus(user.userId);
  }

  @Get('history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'List attendance history (Admin)' })
  getHistory(@CurrentUser() user: RequestUser) {
    return this.attendance.getHistory(user.organizationId);
  }

  @Get('my-history')
  @ApiOperation({ summary: 'List current user attendance history' })
  getMyHistory(@CurrentUser() user: RequestUser) {
    return this.attendance.getMyHistory(user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get current user monthly stats' })
  getMyStats(@CurrentUser() user: RequestUser) {
    return this.attendance.getMyMonthlyStats(user.userId);
  }

  @Get('daily-stats')
  @ApiOperation({ summary: 'Get organization daily labor cost stats' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getDailyStats(@CurrentUser() user: RequestUser) {
    return this.attendance.getDailyStats(user.organizationId);
  }

  @Get('standard-hours')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get organization standard work hours' })
  getStandardHours(@CurrentUser() user: RequestUser) {
    return this.attendance.getOrgStandardHours(user.organizationId);
  }

  @Get('job-categories')
  @ApiOperation({ summary: 'List job categories for organization' })
  listJobCategories(@CurrentUser() user: RequestUser) {
    return this.attendance.listJobCategories(user.organizationId);
  }

  @Post('job-categories')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new job category' })
  createJobCategory(@CurrentUser() user: RequestUser, @Body() dto: { name: string; dailyWage: number; standardHours?: number }) {
    return this.attendance.createJobCategory(user.organizationId, dto);
  }

  @Delete('job-categories/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a job category' })
  deleteJobCategory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.attendance.deleteJobCategory(user.organizationId, id);
  }

  @Get('payroll-summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get unpaid payroll summary per employee' })
  getPayrollSummary(@CurrentUser() user: RequestUser) {
    return this.attendance.getPayrollSummary(user.organizationId);
  }

  @Post('payroll/pay/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mark all unpaid logs for a user as paid' })
  markAsPaid(@CurrentUser() user: RequestUser, @Param('userId') userId: string) {
    return this.attendance.markAsPaid(user.organizationId, userId, user.userId);
  }

  // ═══════════════════════════════════════════════════════════════════
  // Admin: Create & Edit attendance logs
  // ═══════════════════════════════════════════════════════════════════

  @Post('admin/create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Admin: Create attendance log for an employee' })
  adminCreate(
    @CurrentUser() user: RequestUser,
    @Body() dto: { userId: string; jobCategoryId?: string; checkedIn: string; checkedOut?: string; note?: string },
  ) {
    return this.attendance.adminCreateLog(user.organizationId, dto);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Admin: Edit attendance log (hours, job, wage)' })
  adminUpdate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: { checkedIn?: string; checkedOut?: string; jobCategoryId?: string; note?: string; dailyWage?: number },
  ) {
    return this.attendance.adminUpdateLog(user.organizationId, id, user.userId, dto);
  }
}

