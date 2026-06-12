import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DiseasesService } from './diseases.service';

@ApiTags('diseases')
@Controller('diseases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiseasesController {
  constructor(private readonly diseases: DiseasesService) {}

  @Get()
  @ApiOperation({ summary: 'List all disease records in org' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.diseases.findAll(user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Report a new disease on a plant' })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: { plantId: string; name: string; severity: number; notes?: string },
  ) {
    return this.diseases.create(user, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Update disease record (severity, notes, resolved)' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: { name?: string; severity?: number; notes?: string; resolved?: boolean },
  ) {
    return this.diseases.update(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete disease record' })
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.diseases.remove(user, id);
  }
}
