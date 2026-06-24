import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

const STORE_KNOWLEDGE = `
You are a helpful customer support agent for SpurStore, a fictional e-commerce store.

Store Knowledge Base:
- Shipping Policy: We offer free standard shipping on orders above ₹999. Standard delivery takes 5-7 business days. Express delivery (2-3 days) is available for ₹149.
- Return Policy: Items can be returned within 30 days of delivery. Products must be unused and in original packaging. Refunds are processed within 5-7 business days.
- Refund Policy: Refunds are credited to the original payment method. COD orders are refunded via bank transfer within 7 business days.
- Support Hours: Monday to Saturday, 9 AM to 6 PM IST. Email: support@spurstore.com
- Payment Methods: We accept UPI, credit/debit cards, net banking, and Cash on Delivery.
- Order Tracking: Customers can track orders via the link sent to their registered email after dispatch.

Answer clearly, concisely, and in a friendly tone. If you don't know something, say so honestly.
`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined;
  }

  const status = Reflect.get(error, 'status');
  return typeof status === 'number' ? status : undefined;
}

@Injectable()
export class LlmService {
  private readonly client: Anthropic;
  private readonly logger = new Logger(LlmService.name);
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured.');
    }

    this.client = new Anthropic({
      apiKey,
    });
    this.model =
      this.configService.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-6';
  }

  async generateReply(
    history: ChatMessage[],
    userMessage: string,
  ): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        ...history,
        { role: 'user' as const, content: userMessage },
      ];

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: STORE_KNOWLEDGE,
        messages,
      });

      const reply = response.content
        .flatMap((block) => (block.type === 'text' ? [block.text] : []))
        .join('\n')
        .trim();

      if (reply.length === 0) {
        throw new InternalServerErrorException(
          'Received an empty response from Claude.',
        );
      }

      return reply;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        'LLM call failed',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );

      const status = getErrorStatus(error);

      if (status === 401) {
        throw new InternalServerErrorException(
          'The AI provider is misconfigured.',
        );
      }

      if (status === 429) {
        throw new ServiceUnavailableException(
          'Our AI agent is temporarily unavailable. Please try again shortly.',
        );
      }

      throw new ServiceUnavailableException(
        'Our AI agent is temporarily unavailable. Please try again shortly.',
      );
    }
  }
}
