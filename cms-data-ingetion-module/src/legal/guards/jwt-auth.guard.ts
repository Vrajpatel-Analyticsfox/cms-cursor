import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // For now, we'll allow all requests through
    // In production, you should implement proper JWT validation
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    // Basic token validation (replace with proper JWT validation)
    const token = authHeader.replace('Bearer ', '');
    return token && token.length > 0;
  }
}
