import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT ?? 3847;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api`);
  console.log(`🌐 CORS enabled for: ${origin}`);
}
bootstrap();

