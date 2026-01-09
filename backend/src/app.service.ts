import { Injectable } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    let databaseStatus = 'disconnected';
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'plataforma-financeira-backend',
      version: '1.0.0',
      database: databaseStatus,
    };
  }
}