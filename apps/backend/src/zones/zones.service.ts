import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: RequestUser) {
    return this.prisma.zone.findMany({
      where: {
        deletedAt: null,
        farm: { organizationId: user.organizationId, deletedAt: null },
      },
      include: {
        farm: { select: { name: true } },
        _count: { select: { plants: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(user: RequestUser, id: string, dto: { name?: string; description?: string; address?: string; vietgapCode?: string }) {
    const zone = await this.prisma.zone.findFirst({
      where: {
        id,
        deletedAt: null,
        farm: { organizationId: user.organizationId },
      },
    });
    if (!zone) throw new NotFoundException('Zone not found');

    return this.prisma.zone.update({
      where: { id },
      data: {
        name: dto.name ?? zone.name,
        description: dto.description ?? zone.description,
        address: dto.address ?? zone.address,
        vietgapCode: dto.vietgapCode ?? zone.vietgapCode,
      },
    });
  }

  async create(user: RequestUser, dto: { name: string; description?: string; address?: string; vietgapCode?: string; farmId?: string }) {
    let farmId = dto.farmId;
    
    if (!farmId) {
      const firstFarm = await this.prisma.farm.findFirst({
        where: { organizationId: user.organizationId, deletedAt: null },
      });
      if (!firstFarm) throw new NotFoundException('No farm found in organization');
      farmId = firstFarm.id;
    } else {
      const farm = await this.prisma.farm.findFirst({
        where: { id: farmId, organizationId: user.organizationId, deletedAt: null },
      });
      if (!farm) throw new ForbiddenException('Farm not found in organization');
    }

    return this.prisma.zone.create({
      data: {
        name: dto.name,
        description: dto.description,
        address: dto.address,
        vietgapCode: dto.vietgapCode,
        farmId,
      },
    });
  }

  async remove(user: RequestUser, id: string) {
    const zone = await this.prisma.zone.findFirst({
      where: {
        id,
        deletedAt: null,
        farm: { organizationId: user.organizationId },
      },
    });
    if (!zone) throw new NotFoundException('Zone not found');

    return this.prisma.zone.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
