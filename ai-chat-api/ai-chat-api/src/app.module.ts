import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PersonalityModule } from './personality/personality.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { LongTermMemoryModule } from './long-term-memory/long-term-memory.module';
import { MemoryService } from './memory/memory.service';
import { MemoryModule } from './memory/memory.module';
import { ThemeModule } from './theme/theme.module';
import { ModelModule } from './model/model.module';
import { MaintenanceModule } from './maintenance/maintenance.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    PersonalityModule,
    ChatModule,
    UserModule,
    ConversationModule,
    MessageModule,
    LongTermMemoryModule,
    MemoryModule,
    ThemeModule,
    ModelModule,
    MaintenanceModule,
  ],
})
export class AppModule {}

function getDatabaseConfig(): TypeOrmModuleOptions {
  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    return {
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      synchronize: true,
      autoLoadEntities: true,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: true,
  };
}
