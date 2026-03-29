/**
 * App Module - Root Module
 * Orchestrates all feature modules
 * Reference: https://docs.nestjs.com/modules
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './database';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { UsersModule } from './modules/users/users/users.module';
import { StorageModule } from './modules/storage/storage/storage.module';
import { ArtworksModule } from './modules/artworks/artworks/artworks.module';
import { LikesModule } from './modules/likes/likes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { QueueModule } from './modules/queue/queue.module';
import { SearchModule } from './modules/search/search.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),

    PrismaModule,

    AuthModule,
    UsersModule,
    StorageModule,
    ArtworksModule,
    LikesModule,
    CommentsModule,
    CollectionsModule,
    QueueModule,
    SearchModule,
    AuditLogsModule,
    ReportsModule,
    AdminModule,
    AnnouncementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

