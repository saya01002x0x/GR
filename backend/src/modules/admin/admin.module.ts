import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { AutoUnbanTask } from './auto-unban.task';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AutoUnbanTask],
  exports: [AdminService],
})
export class AdminModule { }
