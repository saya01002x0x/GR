/**
 * Users Module
 * Handle user management operations
 * Reference: https://docs.nestjs.com/modules
 */

import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../database';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
