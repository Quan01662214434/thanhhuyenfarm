import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get organization settings' })
  async getSettings(@CurrentUser() user: RequestUser) {
    return this.prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        standardWorkHours: true,
        qrConfig: true,
      },
    });
  }

  @Patch('settings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update organization settings' })
  async updateSettings(@CurrentUser() user: RequestUser, @Body() dto: { standardWorkHours?: number, name?: string, qrConfig?: any }) {
    return this.prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        name: dto.name,
        standardWorkHours: dto.standardWorkHours,
        qrConfig: dto.qrConfig,
      },
    });
  }
}
