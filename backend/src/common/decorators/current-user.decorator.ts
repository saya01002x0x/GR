/**
 * Current User Decorator
 * Lấy user hiện tại từ request (populated by ClerkStrategy -> DB User)
 * Usage: @CurrentUser() user: User
 * Reference: https://docs.nestjs.com/custom-decorators
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';

/**
 * @deprecated Use User from @prisma/client instead
 * Giữ lại cho backward compatibility
 */
export interface UserPayload {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
}

/**
 * CurrentUser Decorator
 * Trả về DB User (Prisma User) thay vì Clerk payload
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
