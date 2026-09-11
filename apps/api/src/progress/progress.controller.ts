import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { AuthGuard } from '../auth/auth.guard';
import { SaveProgressDto } from './progress.dto';
import { ProgressService } from './progress.service';

@Controller('progress')
@UseGuards(AuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}
  @Get() get(@Req() request: AuthenticatedRequest) { return this.progress.get(request.user.id); }
  @Put() save(@Req() request: AuthenticatedRequest, @Body() dto: SaveProgressDto) { return this.progress.save(request.user.id, dto.state); }
}
