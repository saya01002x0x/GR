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
import { ArtworksController } from './modules/artworks/artworks.controller';
import { PrismaModule } from './database';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';

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
  ],
  controllers: [AppController, ArtworksController],
  providers: [AppService],
})
export class AppModule {}
