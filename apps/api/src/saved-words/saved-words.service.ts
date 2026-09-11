import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedWordDto } from './saved-word.dto';

@Injectable()
export class SavedWordsService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return this.prisma.savedWord.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }
  save(userId: string, dto: CreateSavedWordDto) {
    const word = dto.word.trim().toLowerCase();
    return this.prisma.savedWord.upsert({ where: { userId_word: { userId, word } }, create: { userId, word, definition: dto.definition }, update: { definition: dto.definition } });
  }
  async remove(userId: string, id: string) {
    const result = await this.prisma.savedWord.deleteMany({ where: { id, userId } });
    if (!result.count) throw new NotFoundException('Mot introuvable');
    return { success: true };
  }
}
