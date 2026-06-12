import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { PlantsService } from './plants.service';

@ApiTags('plants')
@Controller('plants')
export class PlantsController {
  constructor(private readonly plants: PlantsService) {}

  @Get('public/:id')
  @ApiOperation({ summary: 'Public plant card (token optional for legacy QR)' })
  findPublic(@Param('id') id: string, @Query('t') token?: string) {
    return this.plants.findPublic(id, token || '');
  }

  // ─── Fertilizer endpoints (MUST be before :id) ───

  @Get('fertilizers/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all fertilizer applications in org' })
  getAllFertilizers(@CurrentUser() user: RequestUser) {
    return this.plants.getAllFertilizers(user);
  }

  // ─── Treatment endpoints (MUST be before :id) ───

  @Get('treatments/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all treatment applications in org' })
  getAllTreatments(@CurrentUser() user: RequestUser) {
    return this.plants.getAllTreatments(user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create plant + QR' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreatePlantDto) {
    return this.plants.create(user, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(@CurrentUser() user: RequestUser, @Query('zoneId') zoneId?: string) {
    return this.plants.findAll(user, zoneId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.plants.findOne(user, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiBearerAuth()
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdatePlantDto) {
    return this.plants.update(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.plants.remove(user, id);
  }

  @Post(':id/fertilizers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add fertilizer application to a plant' })
  addFertilizer(
    @CurrentUser() user: RequestUser,
    @Param('id') plantId: string,
    @Body() body: { product: string; amount?: string },
  ) {
    return this.plants.addFertilizer(user, plantId, body);
  }

  @Post(':id/treatments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add treatment to a plant' })
  addTreatment(
    @CurrentUser() user: RequestUser,
    @Param('id') plantId: string,
    @Body() body: { product: string; dosage?: string; notes?: string },
  ) {
    return this.plants.addTreatment(user, plantId, body);
  }
}
