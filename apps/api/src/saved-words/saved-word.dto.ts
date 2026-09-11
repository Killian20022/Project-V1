import { IsString, Length, MaxLength } from 'class-validator';

export class CreateSavedWordDto {
  @IsString()
  @Length(1, 80)
  word: string;

  @IsString()
  @MaxLength(2000)
  definition: string;
}
