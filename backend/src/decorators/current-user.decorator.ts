/**
 * Current User Decorator
 * Lấy user hiện tại từ request
 * Usage: @CurrentUser() user: UserPayload
 * Reference: https://docs.nestjs.com/custom-decorators
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  metadata: Record<string, any>;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
