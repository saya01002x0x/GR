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

@Module({
  imports: [
    // Global Configuration Module with Validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // Show all validation errors
      },
    }),

    // Database
    PrismaModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    StorageModule,
    ArtworksModule,
    LikesModule,
    CommentsModule,
    CollectionsModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

