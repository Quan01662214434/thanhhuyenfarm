import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [NotificationsModule],
  providers: [JobsService],
})
export class JobsModule {}
