/**
 * Users Module
 * Handle user management operations
 * Reference: https://docs.nestjs.com/modules
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../database';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController], // Export để AuthModule có thể dùng
})
export class UsersModule {}
