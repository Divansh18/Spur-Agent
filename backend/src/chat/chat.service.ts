import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { LlmService, ChatMessage } from '../llm/llm.service';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 20;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    private llmService: LlmService,
  ) {}

  async sendMessage(
    message: string,
    sessionId?: string,
  ): Promise<{ reply: string; sessionId: string }> {
    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      throw new BadRequestException('Message cannot be empty.');
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException('Message is too long.');
    }

    let conversation = sessionId
      ? await this.conversationRepo.findOne({ where: { id: sessionId } })
      : null;

    if (!conversation) {
      conversation = await this.conversationRepo.save(
        this.conversationRepo.create(),
      );
    }

    const userMessage = this.messageRepo.create({
      conversationId: conversation.id,
      text: trimmedMessage,
      sender: 'user',
    });
    await this.messageRepo.save(userMessage);

    const history = await this.messageRepo.find({
      where: { conversationId: conversation.id },
      order: { timestamp: 'DESC' },
      take: MAX_HISTORY_MESSAGES + 1,
    });

    const llmHistory: ChatMessage[] = history
      .slice(1)
      .reverse()
      .map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }));

    const reply = await this.llmService.generateReply(
      llmHistory,
      trimmedMessage,
    );

    const aiMessage = this.messageRepo.create({
      conversationId: conversation.id,
      text: reply,
      sender: 'ai',
    });
    await this.messageRepo.save(aiMessage);

    return { reply, sessionId: conversation.id };
  }

  async getHistory(sessionId: string): Promise<Message[]> {
    return this.messageRepo.find({
      where: { conversationId: sessionId },
      order: { timestamp: 'ASC' },
    });
  }
}
