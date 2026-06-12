import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationSeverity, UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Example cron: remind owners about plants approaching harvest window. */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async harvestReminders() {
    const soon = new Date();
    soon.setDate(soon.getDate() + 14);
    const plants = await this.prisma.plant.findMany({
      where: {
        deletedAt: null,
        estimatedHarvestAt: { lte: soon, gte: new Date() },
      },
      include: { zone: { include: { farm: true } } },
      take: 50,
    });
    for (const p of plants) {
      const owners = await this.prisma.user.findMany({
        where: {
          organizationId: p.zone.farm.organizationId,
          role: UserRole.OWNER,
          deletedAt: null,
        },
      });
      for (const o of owners) {
        await this.notifications.createForUser(
          o.id,
          'Harvest window',
          `${p.species} may be ready within 2 weeks`,
          NotificationSeverity.INFO,
          { plantId: p.id },
        );
      }
    }
    this.logger.log(`Harvest reminder job processed ${plants.length} plants`);
  }
}
