import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  user: { id: string; email: string };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Connexion requise');
    try {
      request.user = await this.jwt.verifyAsync<{ id: string; email: string }>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Session invalide ou expirée');
    }
  }
}
