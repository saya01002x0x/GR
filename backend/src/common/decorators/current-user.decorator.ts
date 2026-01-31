/**
 * Current User Decorator
 * Lấy user hiện tại từ request (populated by ClerkStrategy)
 * Usage: @CurrentUser() user: UserPayload
 * Reference: https://docs.nestjs.com/custom-decorators
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
