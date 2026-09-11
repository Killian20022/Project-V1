import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SavedWordsController } from './saved-words.controller';
import { SavedWordsService } from './saved-words.service';

@Module({ imports: [AuthModule], controllers: [SavedWordsController], providers: [SavedWordsService] })
export class SavedWordsModule {}
