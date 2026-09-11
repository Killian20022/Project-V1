import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CreateSavedWordDto } from './saved-word.dto';
import { SavedWordsService } from './saved-words.service';

@Controller('saved-words')
@UseGuards(AuthGuard)
export class SavedWordsController {
  constructor(private readonly words: SavedWordsService) {}
  @Get() list(@Req() request: AuthenticatedRequest) { return this.words.list(request.user.id); }
  @Post() save(@Req() request: AuthenticatedRequest, @Body() dto: CreateSavedWordDto) { return this.words.save(request.user.id, dto); }
  @Delete(':id') remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.words.remove(request.user.id, id); }
}
