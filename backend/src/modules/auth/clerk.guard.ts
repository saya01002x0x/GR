/**
 * Clerk Auth Guard
 * Protect routes v盻嬖 Clerk authentication
 * Usage: @UseGuards(ClerkGuard)
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClerkGuard extends AuthGuard('clerk') {}
