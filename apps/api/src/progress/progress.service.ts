import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}
  async get(userId: string) {
    const progress = await this.prisma.progress.findUnique({ where: { userId } });
    return progress ? { state: progress.state, updatedAt: progress.updatedAt } : null;
  }
  async save(userId: string, state: Record<string, unknown>) {
    const progress = await this.prisma.progress.upsert({ where: { userId }, create: { userId, state: state as never }, update: { state: state as never } });
    return { state: progress.state, updatedAt: progress.updatedAt };
  }
}
