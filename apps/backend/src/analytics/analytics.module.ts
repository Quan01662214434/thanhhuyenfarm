import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [AnalyticsController, ReportsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
