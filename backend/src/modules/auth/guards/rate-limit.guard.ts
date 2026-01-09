import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { email } = request.body;

    // Only apply rate limiting to login attempts
    if (!email || request.url !== '/auth/login') {
      return true;
    }

    const lockStatus = await this.rateLimitService.isAccountLocked(email);
    
    if (lockStatus.locked) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Conta bloqueada devido a muitas tentativas falhadas. Tente novamente em ${lockStatus.remainingTime} minutos.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}