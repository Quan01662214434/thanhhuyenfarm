import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../decorators/current-user.decorator';

/** Lightweight audit hook for mutating requests — extend as needed. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      user?: RequestUser;
      method: string;
      route?: { path?: string };
      ip?: string;
    }>();
    const method = req.method;
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }
    return next.handle().pipe(
      tap({
        next: async () => {
          try {
            await this.prisma.activityLog.create({
              data: {
                actorId: req.user?.userId,
                action: `${method} ${req.route?.path ?? ''}`.trim(),
                entity: 'HTTP',
                metadata: { path: req.route?.path },
                ip: req.ip,
              },
            });
          } catch {
            /* avoid failing request if audit insert fails */
          }
        },
      }),
    );
  }
}
