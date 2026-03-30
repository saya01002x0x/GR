import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import { BaseExceptionFilter } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';
import basicAuth from 'express-basic-auth';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (!process.env.SENTRY_DISABLED) {
      Sentry.captureException(exception);
    }
    super.catch(exception, host);
  }
}

async function bootstrap() {
  if (!process.env.SENTRY_DISABLED) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
    });
  }
  const app = await NestFactory.create(AppModule);

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Sentry
  if (!process.env.SENTRY_DISABLED) {
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryFilter(httpAdapter));
  }

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Lumina API')
    .setDescription('Digital Art Platform - Pixiv Clone API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token from Clerk',
        in: 'header',
      },
      'clerk-auth',
    )
    .addTag('artworks', 'Artwork management - upload, view, search')
    .addTag('users', 'User management - profile, become artist')
    .addTag('likes', 'Like/Unlike artworks')
    .addTag('comments', 'Artwork comments')
    .addTag('collections', 'Save artworks to collections')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Enable CORS
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3846';
  app.enableCors({
    origin: origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    credentials: true,
  });

  // Bull Board Setup
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  // Basic Auth for Bull Board
  app.use(
    ['/admin/queues', '/admin/queues/*', '/metrics', '/metrics/*'],
    basicAuth({
      users: { admin: process.env.ADMIN_PASSWORD || 'admin123' },
      challenge: true,
    }),
  );

  // Create Queue instances to monitor
  const artworkQueue = new Queue('artwork-processing', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });

  const statsQueue = new Queue('stats-queue', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });

  // Setup Bull Board
  createBullBoard({
    queues: [new BullMQAdapter(artworkQueue), new BullMQAdapter(statsQueue)],
    serverAdapter: serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  const port = process.env.PORT ?? 3847;
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Backend running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api`);
  logger.log(
    `🎯 Bull Board at http://localhost:${port}/admin/queues (User: admin)`,
  );
  logger.log(`🌐 CORS enabled for: ${origin}`);
}
void bootstrap();
