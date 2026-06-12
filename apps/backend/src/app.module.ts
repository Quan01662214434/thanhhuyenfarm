import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PlantsModule } from './plants/plants.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { ZonesModule } from './zones/zones.module';
import { DiseasesModule } from './diseases/diseases.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SeasonsModule } from './seasons/seasons.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PlantsModule,
    TasksModule,
    NotificationsModule,
    UploadModule,
    AnalyticsModule,
    HealthModule,
    JobsModule,
    ZonesModule,
    DiseasesModule,
    AttendanceModule,
    SeasonsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
