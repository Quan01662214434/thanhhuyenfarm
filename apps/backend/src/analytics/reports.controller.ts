import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

function toCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => 
    headers.map((h) => {
      let val = row[h];
      if (val === null || val === undefined) val = '';
      val = val.toString().replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('attendance')
  @ApiOperation({ summary: 'Export attendance logs as CSV' })
  async exportAttendance(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const logs = await this.prisma.attendanceLog.findMany({
      where: { user: { organizationId: user.organizationId } },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        jobCategory: { select: { name: true } },
      },
      orderBy: { checkedIn: 'desc' },
    });

    const data = logs.map((log) => ({
      'Nhân viên': `${log.user.firstName} ${log.user.lastName}`,
      'Email': log.user.email,
      'Ngày Check-in': log.checkedIn.toLocaleString('vi-VN'),
      'Ngày Check-out': log.checkedOut ? log.checkedOut.toLocaleString('vi-VN') : '',
      'Công việc': log.jobCategory?.name || 'Không có',
      'Giờ làm': log.workHours || 0,
      'Tiền lương': log.calculatedSalary || 0,
      'Trạng thái': log.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán',
      'Ghi chú': log.note || '',
    }));

    if (data.length === 0) {
      return res.status(200).send('No data');
    }

    const csv = toCSV(data);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename="BaoCaoChamCong.csv"');
    return res.send(Buffer.from('\uFEFF' + csv, 'utf-8')); // Add BOM for Excel UTF-8 support
  }

  @Get('plants')
  @ApiOperation({ summary: 'Export plants list as CSV' })
  async exportPlants(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const plants = await this.prisma.plant.findMany({
      where: { zone: { farm: { organizationId: user.organizationId } }, deletedAt: null },
      include: {
        zone: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = plants.map((p) => ({
      'ID Cây': p.id,
      'Giống Sầu Riêng': p.species,
      'Khu vực': p.zone.name,
      'Ngày trồng': p.plantedAt ? p.plantedAt.toLocaleDateString('vi-VN') : '',
      'Tình trạng sức khỏe': p.health === 'HEALTHY' ? 'Khỏe mạnh' : p.health === 'WATCH' ? 'Theo dõi' : 'Bệnh',
      'Ghi chú sức khỏe': p.statusNote || '',
    }));

    if (data.length === 0) {
      return res.status(200).send('No data');
    }

    const csv = toCSV(data);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename="DanhSachCayTrong.csv"');
    return res.send(Buffer.from('\uFEFF' + csv, 'utf-8')); // Add BOM for Excel UTF-8 support
  }
}
