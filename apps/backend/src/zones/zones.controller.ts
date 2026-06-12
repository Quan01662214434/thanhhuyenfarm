import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZonesService } from './zones.service';

@ApiTags('zones')
@Controller('zones')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ZonesController {
  constructor(private readonly zones: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'List all zones in org' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.zones.findAll(user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update zone info (name, description, address)' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; address?: string; vietgapCode?: string },
  ) {
    return this.zones.update(user, id, dto);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new zone' })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: { name: string; description?: string; address?: string; vietgapCode?: string; farmId?: string },
  ) {
    return this.zones.create(user, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete zone (soft delete)' })
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.zones.remove(user, id);
  }
}
