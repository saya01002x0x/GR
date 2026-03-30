import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return next.handle().pipe(
      tap(() => {
        // Only log non-GET requests (mutations) made by staff (Mod/Admin/SuperAdmin)
        if (user && user.role !== 'USER' && request.method !== 'GET') {
          this.auditLogsService.log(
            user.id,
            `${request.method} ${request.route.path}`,
            { 
              body: request.body, 
              params: request.params, 
              query: request.query 
            }
          );
        }
      }),
    );
  }
}
