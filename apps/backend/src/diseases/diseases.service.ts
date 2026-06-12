import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class DiseasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: RequestUser) {
    return this.prisma.diseaseRecord.findMany({
      where: {
        plant: {
          deletedAt: null,
          zone: { farm: { organizationId: user.organizationId } },
        },
      },
      include: {
        plant: {
          select: { id: true, species: true, zone: { select: { name: true } } },
        },
      },
      orderBy: { detectedAt: 'desc' },
    });
  }

  async create(
    user: RequestUser,
    dto: { plantId: string; name: string; severity: number; notes?: string },
  ) {
    // Verify plant belongs to org
    const plant = await this.prisma.plant.findFirst({
      where: {
        id: dto.plantId,
        deletedAt: null,
        zone: { farm: { organizationId: user.organizationId } },
      },
    });
    if (!plant) throw new ForbiddenException('Plant not in your organization');

    return this.prisma.diseaseRecord.create({
      data: {
        plantId: dto.plantId,
        name: dto.name,
        severity: dto.severity,
        notes: dto.notes,
      },
      include: {
        plant: {
          select: { id: true, species: true, zone: { select: { name: true } } },
        },
      },
    });
  }

  async update(
    user: RequestUser,
    id: string,
    dto: { name?: string; severity?: number; notes?: string; resolved?: boolean },
  ) {
    const record = await this.prisma.diseaseRecord.findFirst({
      where: {
        id,
        plant: {
          deletedAt: null,
          zone: { farm: { organizationId: user.organizationId } },
        },
      },
    });
    if (!record) throw new NotFoundException('Disease record not found');

    return this.prisma.diseaseRecord.update({
      where: { id },
      data: {
        name: dto.name,
        severity: dto.severity,
        notes: dto.notes,
        resolvedAt: dto.resolved ? new Date() : undefined,
      },
      include: {
        plant: {
          select: { id: true, species: true, zone: { select: { name: true } } },
        },
      },
    });
  }

  async remove(user: RequestUser, id: string) {
    const record = await this.prisma.diseaseRecord.findFirst({
      where: {
        id,
        plant: {
          deletedAt: null,
          zone: { farm: { organizationId: user.organizationId } },
        },
      },
    });
    if (!record) throw new NotFoundException('Disease record not found');

    return this.prisma.diseaseRecord.delete({ where: { id } });
  }
}
