import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmModule } from '../llm/llm.module';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message]), LlmModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
