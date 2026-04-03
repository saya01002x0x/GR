/**
 * Auth Module
 * Handle authentication với Clerk
 * Reference: https://docs.nestjs.com/security/authentication
 */

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { ClerkClientProvider } from './providers/clerk-client.provider';
import { ClerkStrategy } from './strategies/clerk.strategy';
import { ClerkGuard } from './clerk/clerk.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, ConfigModule, UsersModule],
  providers: [AuthService, ClerkClientProvider, ClerkStrategy, ClerkGuard],
  exports: [AuthService, ClerkGuard],
})
export class AuthModule {}
