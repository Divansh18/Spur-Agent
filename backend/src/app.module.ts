import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<string>('DB_PORT');
        const dbName = configService.get<string>('DB_NAME');
        const dbUsername = configService.get<string>('DB_USERNAME');

        console.log('DB_HOST:', dbHost);
        console.log('DB_PORT:', dbPort);
        console.log('DB_NAME:', dbName);
        console.log('DB_USERNAME:', dbUsername);

        return {
          type: 'postgres',
          host: dbHost,
          port: Number(dbPort || 5432),
          username: dbUsername,
          password: configService.get<string>('DB_PASSWORD'),
          database: dbName,
          entities: [Conversation, Message],
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        };
      },
    }),

    ChatModule,
  ],
})
export class AppModule {}