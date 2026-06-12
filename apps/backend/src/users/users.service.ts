import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listOrganizationUsers(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        specialty: true,
        kpiScore: true,
        phone: true,
        birthYear: true,
        photoUrl: true,
        lastLoginAt: true,
        isActive: true,
        dailyWage: true,
      },
    });
  }

  async findInOrg(organizationId: string, id: string) {
    const u = await this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        attendanceLogs: { orderBy: { checkedIn: 'desc' }, take: 14 },
        tasksAssigned: { orderBy: { updatedAt: 'desc' }, take: 20 },
      },
    });
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  async create(organizationId: string, dto: { email: string; firstName: string; lastName: string; role?: any; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        organizationId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'EMPLOYEE',
        passwordHash: dto.passwordHash,
      },
    });
  }

  async createEmployee(organizationId: string, dto: any) {
    const emailTaken = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (emailTaken) {
      throw new Error('Email already registered');
    }

    // Default password '123456' if not provided
    const password = dto.password || '123456';
    const passwordHash = await require('bcrypt').hash(password, 10);

    return this.prisma.user.create({
      data: {
        organizationId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'EMPLOYEE',
        passwordHash,
        phone: dto.phone,
        birthYear: dto.birthYear ? parseInt(dto.birthYear) : null,
        photoUrl: dto.photoUrl,
        specialty: dto.specialty,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        dailyWage: dto.dailyWage ? parseFloat(dto.dailyWage) : null,
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async update(organizationId: string, id: string, dto: any) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        birthYear: dto.birthYear ? parseInt(dto.birthYear) : undefined,
        photoUrl: dto.photoUrl,
        role: dto.role,
        specialty: dto.specialty,
        isActive: dto.isActive,
        dailyWage: dto.dailyWage ? parseFloat(dto.dailyWage) : undefined,
      },
    });
  }

  async changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const bcrypt = require('bcrypt');
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new Error('Mật khẩu hiện tại không đúng');

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        birthYear: true,
        photoUrl: true,
        role: true,
        specialty: true,
        dailyWage: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; phone?: string; birthYear?: number }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        birthYear: dto.birthYear,
      },
    });
  }
}
