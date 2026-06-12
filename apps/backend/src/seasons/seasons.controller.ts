import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SeasonsService } from './seasons.service';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('seasons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasons: SeasonsService) {}

  @Get()
  @ApiOperation({ summary: 'List seasons for organization' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.seasons.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get season detail' })
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.seasons.findOne(user, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new season' })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: { name: string; startDate: string; endDate: string; farmId?: string; laborCost?: number; inputCost?: number; revenue?: number },
  ) {
    return this.seasons.create(user, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update season' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: { name?: string; startDate?: string; endDate?: string; laborCost?: number; inputCost?: number; revenue?: number },
  ) {
    return this.seasons.update(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete season (soft)' })
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.seasons.remove(user, id);
  }
}
