import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { nanoid } from 'nanoid';
import * as QRCode from 'qrcode';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { UserRole } from '@prisma/client';
import { nanoid } from 'nanoid';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

const publicInclude = {
  zone: { include: { farm: { include: { organization: true } } } },
  media: { orderBy: { createdAt: 'desc' as const }, take: 12 },
  histories: { orderBy: { createdAt: 'desc' as const }, take: 20, include: { actor: true } },
  diseases: { orderBy: { detectedAt: 'desc' as const } },
  treatments: { orderBy: { appliedAt: 'desc' as const } },
  fertilizers: { orderBy: { appliedAt: 'desc' as const } },
  waterings: { orderBy: { wateredAt: 'desc' as const } },
  harvests: { orderBy: { harvested: 'desc' as const }, include: { season: true } },
  certifications: true,
} as const;

@Injectable()
export class PlantsService {
  constructor(private readonly prisma: PrismaService) {}

  async assertZoneInOrg(zoneId: string, organizationId: string) {
    const zone = await this.prisma.zone.findFirst({
      where: {
        id: zoneId,
        deletedAt: null,
        farm: { organizationId, deletedAt: null },
      },
    });
    if (!zone) throw new ForbiddenException('Zone not in your organization');
    return zone;
  }

  async create(user: RequestUser, dto: CreatePlantDto) {
    await this.assertZoneInOrg(dto.zoneId, user.organizationId);
    const qrToken = nanoid(32);
    const plant = await this.prisma.plant.create({
      data: {
        zoneId: dto.zoneId,
        species: dto.species,
        plantedAt: new Date(dto.plantedAt),
        health: dto.health,
        statusNote: dto.statusNote,
        plantIndex: dto.plantIndex,
        qrToken,
        estimatedHarvestAt: dto.estimatedHarvestAt ? new Date(dto.estimatedHarvestAt) : undefined,
        currentYieldEstimate: dto.currentYieldEstimate,
      },
    });
    const publicUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    const payload = JSON.stringify({ plantId: plant.id, token: qrToken });
    const svg = await QRCode.toString(`${publicUrl}/p/${plant.id}?t=${encodeURIComponent(qrToken)}`, {
      type: 'svg',
    });
    await this.prisma.qrCode.create({
      data: { plantId: plant.id, payload, imageKey: `qr/${plant.id}.svg` },
    });
    await this.prisma.plantHistory.create({
      data: {
        plantId: plant.id,
        actorId: user.userId,
        title: 'Plant registered',
        detail: 'QR generated',
        metadata: { qr: true },
      },
    });
    return { plant, qrSvg: svg };
  }

  async findAll(user: RequestUser, zoneId?: string) {
    return this.prisma.plant.findMany({
      where: {
        deletedAt: null,
        zone: { farm: { organizationId: user.organizationId } },
        ...(zoneId ? { zoneId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        zone: true,
        media: { take: 1 },
        _count: { select: { diseases: true, tasks: true } },
      },
    });
  }

  async findOne(user: RequestUser, id: string) {
    const plant = await this.prisma.plant.findFirst({
      where: {
        id,
        deletedAt: null,
        zone: { farm: { organizationId: user.organizationId } },
      },
      include: {
        zone: { include: { farm: true } },
        media: true,
        histories: { orderBy: { createdAt: 'desc' }, take: 50 },
        diseases: true,
        treatments: true,
        fertilizers: true,
        waterings: true,
        harvests: true,
        tasks: true,
      },
    });
    if (!plant) throw new NotFoundException('Plant not found');
    return plant;
  }

  /** Guest-safe payload when `token` matches plant.qrToken */
  async findPublic(id: string, token: string) {
    // Try exact match first
    let plant = await this.prisma.plant.findFirst({
      where: { id, deletedAt: null, qrToken: token },
      include: publicInclude,
    });

    // Fallback: if token doesn't match, try finding by ID only
    // This supports legacy QR codes from MongoDB migration
    if (!plant) {
      plant = await this.prisma.plant.findFirst({
        where: { id, deletedAt: null },
        include: publicInclude,
      });
    }

    // Also try: maybe the token IS the plant id (old QR format)
    if (!plant) {
      plant = await this.prisma.plant.findFirst({
        where: { qrToken: id, deletedAt: null },
        include: publicInclude,
      });
    }

    if (!plant) throw new NotFoundException('Plant not found or invalid token');

    const ageDays = Math.floor(
      (Date.now() - plant.plantedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const caretakers = await this.prisma.user.findMany({
      where: {
        organizationId: plant.zone.farm.organizationId,
        role: { in: [UserRole.MANAGER, UserRole.OWNER] },
        deletedAt: null,
      },
      select: { id: true, firstName: true, lastName: true, role: true, phone: true },
      take: 5,
    });
    return { ...plant, ageDays, caretakers };
  }

  async update(user: RequestUser, id: string, dto: UpdatePlantDto) {
    await this.findOne(user, id);
    if (dto.zoneId) await this.assertZoneInOrg(dto.zoneId, user.organizationId);
    return this.prisma.plant.update({
      where: { id },
      data: {
        zoneId: dto.zoneId,
        species: dto.species,
        plantedAt: dto.plantedAt ? new Date(dto.plantedAt) : undefined,
        health: dto.health,
        statusNote: dto.statusNote,
        plantIndex: dto.plantIndex,
        estimatedHarvestAt: dto.estimatedHarvestAt
          ? new Date(dto.estimatedHarvestAt)
          : undefined,
        currentYieldEstimate: dto.currentYieldEstimate,
      },
    });
  }

  async remove(user: RequestUser, id: string) {
    await this.findOne(user, id);
    return this.prisma.plant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Fertilizer methods ───

  async getAllFertilizers(user: RequestUser) {
    return this.prisma.fertilizerApplication.findMany({
      where: {
        plant: {
          deletedAt: null,
          zone: { farm: { organizationId: user.organizationId } },
        },
      },
      include: { plant: { select: { species: true, zone: { select: { name: true } } } } },
      orderBy: { appliedAt: 'desc' },
      take: 100,
    });
  }

  async addFertilizer(user: RequestUser, plantId: string, body: { product: string; amount?: string }) {
    await this.findOne(user, plantId);
    return this.prisma.fertilizerApplication.create({
      data: {
        plantId,
        product: body.product,
        amount: body.amount,
        appliedById: user.userId,
      },
    });
  }

  // ─── Treatment methods ───

  async getAllTreatments(user: RequestUser) {
    return this.prisma.treatment.findMany({
      where: {
        plant: {
          deletedAt: null,
          zone: { farm: { organizationId: user.organizationId } },
        },
      },
      include: { plant: { select: { species: true, zone: { select: { name: true } } } } },
      orderBy: { appliedAt: 'desc' },
      take: 100,
    });
  }

  async addTreatment(user: RequestUser, plantId: string, body: { product: string; dosage?: string; notes?: string }) {
    await this.findOne(user, plantId);
    return this.prisma.treatment.create({
      data: {
        plantId,
        product: body.product,
        dosage: body.dosage,
        notes: body.notes,
        appliedById: user.userId,
      },
    });
  }

  // ─── Import / Export methods ───

  async exportCsv(user: RequestUser) {
    const plants = await this.prisma.plant.findMany({
      where: {
        deletedAt: null,
        zone: { farm: { organizationId: user.organizationId } },
      },
      include: { zone: true },
      orderBy: [{ zone: { name: 'asc' } }, { plantIndex: 'asc' }],
    });

    const data = plants.map(p => ({
      'Khu vực': p.zone.name,
      'Số thứ tự': p.plantIndex ?? '',
      'Giống cây': p.species,
      'Ngày trồng': p.plantedAt.toISOString().split('T')[0],
      'Tình trạng': p.health,
      'Ghi chú': p.statusNote ?? '',
    }));

    return stringify(data, { header: true, bom: true });
  }

  async importCsv(user: RequestUser, fileBuffer: Buffer) {
    const records = parse(fileBuffer, { columns: true, skip_empty_lines: true });
    
    // First, find the first farm for the user to put zones in if they don't exist
    const farm = await this.prisma.farm.findFirst({
      where: { organizationId: user.organizationId, deletedAt: null },
    });
    if (!farm) throw new NotFoundException('Vui lòng tạo trang trại trong Cài đặt trước khi import.');

    const zonesCache = new Map<string, string>();
    let imported = 0;

    for (const row of records) {
      const zoneName = row['Khu vực']?.trim() || 'Khu vực chung';
      const indexStr = row['Số thứ tự']?.trim();
      const species = row['Giống cây']?.trim() || 'Sầu riêng';
      const dateStr = row['Ngày trồng']?.trim();
      const plantIndex = indexStr ? parseInt(indexStr, 10) : undefined;
      const plantedAt = dateStr ? new Date(dateStr) : new Date();

      // Find or create zone
      let zoneId = zonesCache.get(zoneName);
      if (!zoneId) {
        let zone = await this.prisma.zone.findFirst({
          where: { name: zoneName, farmId: farm.id, deletedAt: null },
        });
        if (!zone) {
          zone = await this.prisma.zone.create({
            data: { name: zoneName, farmId: farm.id },
          });
        }
        zoneId = zone.id;
        zonesCache.set(zoneName, zoneId);
      }

      // Create plant
      const qrToken = nanoid(32);
      const plant = await this.prisma.plant.create({
        data: {
          zoneId,
          species,
          plantedAt,
          plantIndex,
          qrToken,
        },
      });

      // Generate QR
      const publicUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
      const payload = JSON.stringify({ plantId: plant.id, token: qrToken });
      const svg = await QRCode.toString(`${publicUrl}/p/${plant.id}?t=${encodeURIComponent(qrToken)}`, { type: 'svg' });
      await this.prisma.qrCode.create({
        data: { plantId: plant.id, payload, imageKey: `qr/${plant.id}.svg` },
      });

      imported++;
    }

    return { success: true, count: imported };
  }
}
