import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Helper: calculate salary from hours ──────────────────────────
  private calcSalary(workHours: number, dailyWage: number, standardHours: number): number {
    if (!dailyWage || !standardHours) return 0;
    return (workHours / standardHours) * dailyWage;
  }

  private async resolveDailyWage(userId: string, jobCategoryId?: string | null): Promise<{ dailyWage: number; standardHours: number }> {
    let dailyWage = 0;
    let standardHours = 0;

    if (jobCategoryId) {
      const cat = await this.prisma.jobCategory.findUnique({ where: { id: jobCategoryId } });
      if (cat) {
        dailyWage = cat.dailyWage;
        standardHours = cat.standardHours;
      }
    }

    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!dailyWage) dailyWage = userData?.dailyWage || 0;
    if (!standardHours) standardHours = userData?.organization?.standardWorkHours || 8;

    return { dailyWage, standardHours };
  }

  async checkIn(user: RequestUser, dto: { jobCategoryId?: string; latitude?: number; longitude?: number; note?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendanceLog.findFirst({
      where: {
        userId: user.userId,
        checkedIn: { gte: today },
        checkedOut: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Bạn đã chấm công vào rồi.');
    }

    const { dailyWage } = await this.resolveDailyWage(user.userId, dto.jobCategoryId);

    return this.prisma.attendanceLog.create({
      data: {
        userId: user.userId,
        jobCategoryId: dto.jobCategoryId,
        dailyWage,
        latitude: dto.latitude,
        longitude: dto.longitude,
        note: dto.note,
      },
    });
  }

  async checkOut(user: RequestUser, dto: { note?: string }) {
    const activeLog = await this.prisma.attendanceLog.findFirst({
      where: {
        userId: user.userId,
        checkedOut: null,
      },
      orderBy: { checkedIn: 'desc' },
    });

    if (!activeLog) {
      throw new BadRequestException('Bạn chưa chấm công vào.');
    }

    const now = new Date();
    const checkedIn = new Date(activeLog.checkedIn);
    const diffMs = now.getTime() - checkedIn.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    const { dailyWage, standardHours } = await this.resolveDailyWage(activeLog.userId, activeLog.jobCategoryId);
    const wage = activeLog.dailyWage || dailyWage;
    const calculatedSalary = this.calcSalary(hours, wage, standardHours);

    return this.prisma.attendanceLog.update({
      where: { id: activeLog.id },
      data: {
        checkedOut: now,
        workHours: hours,
        calculatedSalary,
        note: dto.note ? `${activeLog.note || ''} | Out: ${dto.note}` : activeLog.note,
      },
    });
  }

  async getTodayStatus(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.attendanceLog.findFirst({
      where: {
        userId,
        checkedIn: { gte: today },
      },
      include: { jobCategory: { select: { name: true, dailyWage: true } } },
      orderBy: { checkedIn: 'desc' },
    });
  }

  async getHistory(organizationId: string) {
    return this.prisma.attendanceLog.findMany({
      where: {
        user: { organizationId },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, dailyWage: true }
        },
        jobCategory: {
          select: { name: true, dailyWage: true }
        },
      },
      orderBy: { checkedIn: 'desc' },
      take: 200,
    });
  }

  async getMyHistory(userId: string) {
    return this.prisma.attendanceLog.findMany({
      where: { userId },
      include: {
        jobCategory: {
          select: { name: true, dailyWage: true, standardHours: true }
        },
      },
      orderBy: { checkedIn: 'desc' },
      take: 20,
    });
  }

  async getMyMonthlyStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const logs = await this.prisma.attendanceLog.findMany({
      where: {
        userId,
        checkedIn: { gte: startOfMonth },
        checkedOut: { not: null },
      },
    });

    const totalSalary = logs.reduce((acc, log) => acc + (log.calculatedSalary || 0), 0);
    const totalHours = logs.reduce((acc, log) => acc + (log.workHours || 0), 0);
    const totalDays = new Set(logs.map(l => l.checkedIn.toDateString())).size;

    return { totalSalary, totalHours, totalDays };
  }

  async getDailyStats(organizationId: string) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const stats = await this.prisma.attendanceLog.groupBy({
      by: ['checkedIn'],
      where: {
        user: { organizationId },
        checkedIn: { gte: fourteenDaysAgo },
        checkedOut: { not: null },
      },
      _sum: { calculatedSalary: true },
    });

    // Grouping by Date part only since checkedIn is DateTime
    const dailyData = stats.reduce((acc, curr) => {
      const date = curr.checkedIn.toDateString();
      acc[date] = (acc[date] || 0) + (curr._sum.calculatedSalary || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyData).map(([date, amount]) => ({
      date,
      amount,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async listJobCategories(organizationId: string) {
    return this.prisma.jobCategory.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async createJobCategory(organizationId: string, dto: { name: string; dailyWage: number; standardHours?: number }) {
    return this.prisma.jobCategory.create({
      data: {
        organizationId,
        name: dto.name,
        dailyWage: dto.dailyWage,
        standardHours: dto.standardHours ?? 8,
      },
    });
  }

  async deleteJobCategory(organizationId: string, id: string) {
    return this.prisma.jobCategory.deleteMany({
      where: { id, organizationId },
    });
  }

  async getPayrollSummary(organizationId: string) {
    const logs = await this.prisma.attendanceLog.findMany({
      where: {
        user: { organizationId },
        checkedOut: { not: null },
        isPaid: false,
      },
      include: {
        user: true,
        jobCategory: { select: { name: true } },
      },
    });

    const summary = logs.reduce((acc, log) => {
      const userId = log.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          fullName: `${log.user.firstName} ${log.user.lastName}`,
          email: log.user.email,
          totalUnpaid: 0,
          shiftCount: 0,
          totalHours: 0,
        };
      }
      acc[userId].totalUnpaid += log.calculatedSalary || 0;
      acc[userId].shiftCount += 1;
      acc[userId].totalHours += log.workHours || 0;
      return acc;
    }, {} as Record<string, { userId: string; fullName: string; email: string; totalUnpaid: number; shiftCount: number; totalHours: number }>);

    return Object.values(summary);
  }

  async markAsPaid(organizationId: string, userId: string, actorId: string) {
    const res = await this.prisma.attendanceLog.updateMany({
      where: {
        userId,
        user: { organizationId },
        checkedOut: { not: null },
        isPaid: false,
      },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });

    await this.prisma.activityLog.create({
      data: {
        actorId,
        action: 'MARK_AS_PAID',
        entity: 'AttendanceLog',
        entityId: userId,
        metadata: { updatedCount: res.count }
      }
    });

    return res;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Admin: Create attendance log on behalf of an employee
  // ═══════════════════════════════════════════════════════════════════
  async adminCreateLog(
    organizationId: string,
    dto: {
      userId: string;
      jobCategoryId?: string;
      checkedIn: string;
      checkedOut?: string;
      note?: string;
    },
  ) {
    // Verify user belongs to org
    const targetUser = await this.prisma.user.findFirst({
      where: { id: dto.userId, organizationId },
      include: { organization: true },
    });
    if (!targetUser) throw new NotFoundException('Nhân viên không tìm thấy.');

    const { dailyWage, standardHours } = await this.resolveDailyWage(dto.userId, dto.jobCategoryId);

    const checkedInDate = new Date(dto.checkedIn);
    let checkedOutDate: Date | null = null;
    let workHours: number | null = null;
    let calculatedSalary: number | null = null;

    if (dto.checkedOut) {
      checkedOutDate = new Date(dto.checkedOut);
      const diffMs = checkedOutDate.getTime() - checkedInDate.getTime();
      workHours = diffMs / (1000 * 60 * 60);
      if (workHours < 0) throw new BadRequestException('Giờ ra phải sau giờ vào.');
      calculatedSalary = this.calcSalary(workHours, dailyWage, standardHours);
    }

    return this.prisma.attendanceLog.create({
      data: {
        userId: dto.userId,
        jobCategoryId: dto.jobCategoryId || null,
        dailyWage,
        checkedIn: checkedInDate,
        checkedOut: checkedOutDate,
        workHours,
        calculatedSalary,
        note: dto.note || null,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        jobCategory: { select: { name: true, dailyWage: true } },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Admin: Update an existing attendance log (edit hours, recalculate)
  // ═══════════════════════════════════════════════════════════════════
  async adminUpdateLog(
    organizationId: string,
    logId: string,
    actorId: string,
    dto: {
      checkedIn?: string;
      checkedOut?: string;
      jobCategoryId?: string;
      note?: string;
      dailyWage?: number;
    },
  ) {
    const log = await this.prisma.attendanceLog.findFirst({
      where: { id: logId, user: { organizationId } },
    });
    if (!log) throw new NotFoundException('Bản ghi chấm công không tìm thấy.');

    const newCheckedIn = dto.checkedIn ? new Date(dto.checkedIn) : log.checkedIn;
    const newCheckedOut = dto.checkedOut ? new Date(dto.checkedOut) : log.checkedOut;
    const newJobCategoryId = dto.jobCategoryId !== undefined ? (dto.jobCategoryId || null) : log.jobCategoryId;

    // Resolve wage
    let wage = dto.dailyWage ?? log.dailyWage ?? 0;
    if (dto.jobCategoryId) {
      const cat = await this.prisma.jobCategory.findUnique({ where: { id: dto.jobCategoryId } });
      if (cat) wage = cat.dailyWage;
    }

    // Get standard hours (override with job if present)
    let standardHours = 8;
    if (dto.jobCategoryId) {
      const cat = await this.prisma.jobCategory.findUnique({ where: { id: dto.jobCategoryId } });
      if (cat) standardHours = cat.standardHours;
    } else {
      const user = await this.prisma.user.findUnique({
        where: { id: log.userId },
        include: { organization: true },
      });
      standardHours = user?.organization?.standardWorkHours || 8;
    }

    let workHours = log.workHours;
    let calculatedSalary = log.calculatedSalary;

    if (newCheckedOut) {
      const diffMs = newCheckedOut.getTime() - newCheckedIn.getTime();
      workHours = diffMs / (1000 * 60 * 60);
      if (workHours < 0) throw new BadRequestException('Giờ ra phải sau giờ vào.');
      calculatedSalary = this.calcSalary(workHours, wage, standardHours);
    }

    const updated = await this.prisma.attendanceLog.update({
      where: { id: logId },
      data: {
        checkedIn: newCheckedIn,
        checkedOut: newCheckedOut,
        jobCategoryId: newJobCategoryId,
        dailyWage: wage,
        workHours,
        calculatedSalary,
        note: dto.note !== undefined ? dto.note : log.note,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        jobCategory: { select: { name: true, dailyWage: true } },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        actorId,
        action: 'UPDATE_ATTENDANCE',
        entity: 'AttendanceLog',
        entityId: logId,
        metadata: { previousHours: log.workHours, newHours: workHours }
      }
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Admin: Get organization standard work hours
  // ═══════════════════════════════════════════════════════════════════
  async getOrgStandardHours(organizationId: string): Promise<number> {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    return org?.standardWorkHours || 8;
  }
}
