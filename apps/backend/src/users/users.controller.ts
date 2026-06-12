import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ─── Self-service profile endpoints (any authenticated user) ───

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getProfile(@CurrentUser() user: RequestUser) {
    return this.users.getProfile(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: { firstName?: string; lastName?: string; phone?: string; birthYear?: number }) {
    return this.users.updateProfile(user.userId, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change own password' })
  async changePassword(@CurrentUser() user: RequestUser, @Body() dto: { currentPassword: string; newPassword: string }) {
    try {
      await this.users.changePassword(user.userId, dto);
      return { message: 'Đổi mật khẩu thành công' };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Đổi mật khẩu thất bại');
    }
  }

  // ─── Admin endpoints (OWNER / MANAGER only) ───

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'List employees in organization' })
  list(@CurrentUser() user: RequestUser) {
    return this.users.listOrganizationUsers(user.organizationId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Employee profile' })
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.findInOrg(user.organizationId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new employee' })
  createEmployee(@CurrentUser() user: RequestUser, @Body() dto: any) {
    return this.users.createEmployee(user.organizationId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update employee info' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.users.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remove employee (soft delete)' })
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.remove(user.organizationId, id);
  }
}
