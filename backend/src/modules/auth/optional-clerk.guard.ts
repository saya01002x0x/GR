/**
 * Optional Clerk Auth Guard
 * Protect routes with Clerk authentication but don't throw error if token is missing or invalid.
 * If token is valid, req.user will be populated. Otherwise, req.user will be null/undefined.
 * Usage: @UseGuards(OptionalClerkGuard)
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalClerkGuard extends AuthGuard('clerk') {
  // Override handleRequest to not throw an exception on failure
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    // If there's a valid user, return it (it will be attached to req.user)
    if (user) {
      return user;
    }
    // Otherwise, just return null (do not throw UnauthorizedException)
    return null;
  }
}
