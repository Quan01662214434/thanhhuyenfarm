import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class SeasonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: RequestUser) {
    return this.prisma.season.findMany({
      where: {
        deletedAt: null,
        farm: { organizationId: user.organizationId, deletedAt: null },
      },
      include: {
        farm: { select: { name: true } },
        harvests: {
          select: { quantityKg: true, revenue: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(user: RequestUser, id: string) {
    const season = await this.prisma.season.findFirst({
      where: {
        id,
        deletedAt: null,
        farm: { organizationId: user.organizationId },
      },
      include: {
        farm: { select: { name: true } },
        harvests: {
          include: { plant: { select: { species: true, qrToken: true } } },
          orderBy: { harvested: 'desc' },
        },
      },
    });
    if (!season) throw new NotFoundException('Mùa vụ không tìm thấy.');
    return season;
  }

  async create(
    user: RequestUser,
    dto: {
      name: string;
      startDate: string;
      endDate: string;
      farmId?: string;
      laborCost?: number;
      inputCost?: number;
      revenue?: number;
    },
  ) {
    let farmId = dto.farmId;

    if (!farmId) {
      const firstFarm = await this.prisma.farm.findFirst({
        where: { organizationId: user.organizationId, deletedAt: null },
      });
      if (!firstFarm) throw new NotFoundException('Chưa có trang trại nào.');
      farmId = firstFarm.id;
    } else {
      const farm = await this.prisma.farm.findFirst({
        where: { id: farmId, organizationId: user.organizationId, deletedAt: null },
      });
      if (!farm) throw new ForbiddenException('Trang trại không thuộc tổ chức.');
    }

    const laborCost = dto.laborCost ?? 0;
    const inputCost = dto.inputCost ?? 0;
    const revenue = dto.revenue ?? 0;
    const profit = revenue - laborCost - inputCost;

    return this.prisma.season.create({
      data: {
        farmId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        laborCost,
        inputCost,
        revenue,
        profit,
      },
      include: {
        farm: { select: { name: true } },
      },
    });
  }

  async update(
    user: RequestUser,
    id: string,
    dto: {
      name?: string;
      startDate?: string;
      endDate?: string;
      laborCost?: number;
      inputCost?: number;
      revenue?: number;
    },
  ) {
    const season = await this.prisma.season.findFirst({
      where: { id, deletedAt: null, farm: { organizationId: user.organizationId } },
    });
    if (!season) throw new NotFoundException('Mùa vụ không tìm thấy.');

    const laborCost = dto.laborCost ?? season.laborCost;
    const inputCost = dto.inputCost ?? season.inputCost;
    const revenue = dto.revenue ?? season.revenue;
    const profit = revenue - laborCost - inputCost;

    return this.prisma.season.update({
      where: { id },
      data: {
        name: dto.name ?? season.name,
        startDate: dto.startDate ? new Date(dto.startDate) : season.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : season.endDate,
        laborCost,
        inputCost,
        revenue,
        profit,
      },
      include: {
        farm: { select: { name: true } },
      },
    });
  }

  async remove(user: RequestUser, id: string) {
    const season = await this.prisma.season.findFirst({
      where: { id, deletedAt: null, farm: { organizationId: user.organizationId } },
    });
    if (!season) throw new NotFoundException('Mùa vụ không tìm thấy.');

    return this.prisma.season.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
