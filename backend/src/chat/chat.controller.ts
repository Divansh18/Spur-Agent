import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  sendMessage(@Body() body: SendMessageDto) {
    return this.chatService.sendMessage(body.message, body.sessionId);
  }

  @Get('history/:sessionId')
  async getHistory(@Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    const messages = await this.chatService.getHistory(sessionId);
    return { messages };
  }
}
