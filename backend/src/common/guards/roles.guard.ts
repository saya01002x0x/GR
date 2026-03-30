/**
 * Roles Guard
 * Check user role from DB (Postgres = single source of truth)
 * Also blocks banned users before any role check
 * Reference: https://docs.nestjs.com/guards
 */

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<string, number> = {
    USER: 0,
    MODERATOR: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest<{ user: User }>();

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        if (user.isBanned) {
            throw new ForbiddenException('Your account has been suspended');
        }

        const userLevel = ROLE_HIERARCHY[String(user.role)] ?? 0;
        const hasRole = requiredRoles.some(
            (role) => userLevel >= (ROLE_HIERARCHY[role] ?? 0),
        );

        if (!hasRole) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
