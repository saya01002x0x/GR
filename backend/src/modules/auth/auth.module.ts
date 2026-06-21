/**
 * Auth Module
 * Handle authentication với Clerk
 * Reference: https://docs.nestjs.com/security/authentication
 */

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database';
import { AuthService } from './auth.service';
import { ClerkClientProvider } from './clerk-client.provider';
import { ClerkStrategy } from './clerk.strategy';
import { ClerkGuard } from './clerk.guard';
import { OptionalClerkGuard } from './optional-clerk.guard';

@Module({
  imports: [PassportModule, ConfigModule, PrismaModule],
  providers: [AuthService, ClerkClientProvider, ClerkStrategy, ClerkGuard, OptionalClerkGuard],
  exports: [AuthService, ClerkGuard, OptionalClerkGuard],
})
export class AuthModule { }
