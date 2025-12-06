import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const role = req.user?.role;
    if (role === 'ADMIN') return true;
    throw new ForbiddenException('Admin only');
  }
}
