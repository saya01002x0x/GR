/**
 * Clerk Auth Guard
 * Protect routes với Clerk authentication
 * Usage: @UseGuards(ClerkGuard)
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClerkGuard extends AuthGuard('clerk') {}
