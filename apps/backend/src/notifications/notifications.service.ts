import { Injectable } from '@nestjs/common';
import { NotificationSeverity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createForUser(
    userId: string,
    title: string,
    body: string | undefined,
    severity: NotificationSeverity = NotificationSeverity.INFO,
    metadata?: Record<string, unknown>,
  ) {
    const n = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        severity,
        metadata: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
      },
    });
    this.gateway.broadcast('notification', n);
    return n;
  }

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
