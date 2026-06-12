import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async assertSameOrg(user: RequestUser, targetUserId: string) {
    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!target) throw new ForbiddenException('Assignee not in organization');
    return target;
  }

  async create(creator: RequestUser, dto: CreateTaskDto) {
    await this.assertSameOrg(creator, dto.assigneeId);
    return this.prisma.employeeTask.create({
      data: {
        plantId: dto.plantId,
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        createdById: creator.userId,
        status: dto.status ?? TaskStatus.TODO,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
    });
  }

  listForUser(user: RequestUser) {
    const where =
      user.role === UserRole.EMPLOYEE
        ? { assigneeId: user.userId }
        : { assignee: { organizationId: user.organizationId, deletedAt: null } };
    return this.prisma.employeeTask.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { plant: true, assignee: true },
      take: 100,
    });
  }

  async updateStatus(user: RequestUser, id: string, status: TaskStatus) {
    const task = await this.prisma.employeeTask.findFirst({
      where: { id, assignee: { organizationId: user.organizationId } },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (user.role === UserRole.EMPLOYEE && task.assigneeId !== user.userId) {
      throw new ForbiddenException();
    }
    return this.prisma.employeeTask.update({ where: { id }, data: { status } });
  }

  async update(user: RequestUser, id: string, dto: Partial<CreateTaskDto>) {
    const task = await this.prisma.employeeTask.findFirst({
      where: { id, assignee: { organizationId: user.organizationId } },
    });
    if (!task) throw new NotFoundException('Task not found');

    if (user.role === UserRole.EMPLOYEE) {
      throw new ForbiddenException('Employees can only update task status');
    }

    if (dto.assigneeId) {
      await this.assertSameOrg(user, dto.assigneeId);
    }

    return this.prisma.employeeTask.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        plantId: dto.plantId,
        status: dto.status,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
    });
  }

  async remove(user: RequestUser, id: string) {
    const task = await this.prisma.employeeTask.findFirst({
      where: { id, assignee: { organizationId: user.organizationId } },
    });
    if (!task) throw new NotFoundException('Task not found');

    if (user.role === UserRole.EMPLOYEE) {
      throw new ForbiddenException('Employees cannot delete tasks');
    }

    return this.prisma.employeeTask.delete({ where: { id } });
  }
}
