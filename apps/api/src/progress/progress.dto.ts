import { IsObject } from 'class-validator';

export class SaveProgressDto {
  @IsObject()
  state: Record<string, unknown>;
}
