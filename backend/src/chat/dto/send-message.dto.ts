import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

function trimString({ value }: TransformFnParams): unknown {
  const rawValue = value as unknown;
  return typeof rawValue === 'string' ? rawValue.trim() : rawValue;
}

function trimOptionalString({ value }: TransformFnParams): unknown {
  const rawValue = value as unknown;
  return typeof rawValue === 'string' ? rawValue.trim() || undefined : rawValue;
}

export class SendMessageDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty.' })
  @MaxLength(2000, { message: 'Message is too long.' })
  message!: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  @IsUUID()
  sessionId?: string;
}
