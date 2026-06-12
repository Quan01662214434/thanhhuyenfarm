import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        farms: {
          where: { deletedAt: null },
          take: 1,
        }
      }
    });

    const farms = await this.prisma.farm.count({
      where: { organizationId, deletedAt: null },
    });
    const plants = await this.prisma.plant.count({
      where: { deletedAt: null, zone: { farm: { organizationId } } },
    });
    const diseased = await this.prisma.plant.count({
      where: {
        deletedAt: null,
        health: { in: ['DISEASED', 'WATCH'] },
        zone: { farm: { organizationId } },
      },
    });
    const tasksOpen = await this.prisma.employeeTask.count({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        assignee: { organizationId },
      },
    });
    const byHealth = await this.prisma.plant.groupBy({
      by: ['health'],
      where: { deletedAt: null, zone: { farm: { organizationId } } },
      _count: { _all: true },
    });
    const yieldBySeason = await this.prisma.harvest.groupBy({
      by: ['seasonId'],
      where: { plant: { zone: { farm: { organizationId } } } },
      _sum: { quantityKg: true },
    });

    const laborCostSum = await this.prisma.attendanceLog.aggregate({
      where: { user: { organizationId } },
      _sum: { calculatedSalary: true },
    });

    return { 
      farms, 
      plants, 
      diseased, 
      tasksOpen, 
      byHealth, 
      yieldBySeason,
      laborCost: laborCostSum._sum.calculatedSalary || 0,
      orgName: org?.name || 'Thanh Huyền',
      orgAddress: org?.farms?.[0]?.address || 'Định Quán, Đồng Nai',
    };
  }

  async getActivityLogs(organizationId: string) {
    return this.prisma.activityLog.findMany({
      where: {
        actor: { organizationId }
      },
      include: {
        actor: { select: { firstName: true, lastName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async mapOverview(organizationId: string) {
    const zones = await this.prisma.zone.findMany({
      where: {
        deletedAt: null,
        farm: { organizationId, deletedAt: null },
      },
      select: {
        id: true,
        name: true,
        description: true,
        plants: {
          where: { deletedAt: null },
          select: { health: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    return zones.map(zone => {
      const stats = { HEALTHY: 0, WATCH: 0, DISEASED: 0, RECOVERING: 0, DEAD: 0 };
      zone.plants.forEach(p => {
        if (stats[p.health] !== undefined) stats[p.health]++;
      });
      return {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        totalPlants: zone.plants.length,
        stats,
      };
    });
  }
}
