import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { OrganizationController } from './organization.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, OrganizationController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
