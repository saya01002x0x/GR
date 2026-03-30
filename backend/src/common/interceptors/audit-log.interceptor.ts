import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import type { User } from '@prisma/client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<ExpressRequest & { user?: User; route: { path: string } }>();
    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        // Only log non-GET requests (mutations) made by staff (Mod/Admin/SuperAdmin)
        if (user && user.role !== 'USER' && request.method !== 'GET') {
          void this.auditLogsService.log(
            user.id,
            `${request.method} ${(request as unknown as { route?: { path?: string } }).route?.path || request.path}`,
            {
              body: request.body as Record<string, unknown>,
              params: request.params as Record<string, unknown>,
              query: request.query as Record<string, unknown>,
            },
          );
        }
      }),
    );
  }
}
