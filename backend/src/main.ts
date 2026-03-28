import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@bull-board/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
  });

  // Bull Board Setup
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const { createBullBoard } = require('@bull-board/api');
  const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
  const { Queue } = require('bullmq');

  // Basic Auth for Bull Board
  const basicAuth = require('express-basic-auth');
  app.use('/admin/queues', basicAuth({
    users: { 'admin': process.env.ADMIN_PASSWORD || 'admin123' },
    challenge: true,
  }));

  // Create Queue instance to monitor
  const artworkQueue = new Queue('artwork-processing', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });

  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [new BullMQAdapter(artworkQueue)],
    serverAdapter: serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  const port = process.env.PORT ?? 3847;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api`);
  console.log(`🎯 Bull Board at http://localhost:${port}/admin/queues (User: admin)`);
  console.log(`🌐 CORS enabled for: ${origin}`);
}
bootstrap();

