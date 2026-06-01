import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

class SupportChatHistoryMessageDto {
  @IsIn(['assistant', 'user'])
  role: 'assistant' | 'user';

  @IsString()
  @MaxLength(1200)
  content: string;
}

export class SupportChatDto {
  @IsString()
  @MaxLength(1200)
  message: string;

  @IsOptional()
  @IsIn(['vi', 'en'])
  language?: 'vi' | 'en';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pageUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => SupportChatHistoryMessageDto)
  history?: SupportChatHistoryMessageDto[];
}
