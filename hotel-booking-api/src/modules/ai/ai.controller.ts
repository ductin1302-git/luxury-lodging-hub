import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { SupportChatDto } from './dto/support-chat.dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('support')
  @UseGuards(OptionalJwtAuthGuard)
  createSupportReply(@Request() req: any, @Body() dto: SupportChatDto) {
    return this.aiService.createSupportReply(
      req.user?.userId,
      dto.message,
      dto.language || 'vi',
      dto.pageUrl,
      dto.history || [],
    );
  }
}
