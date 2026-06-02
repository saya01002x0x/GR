import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { ClerkGuard } from '../src/modules/auth/clerk.guard';
import { ExecutionContext } from '@nestjs/common';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Mock user for testing
  const mockUser = {
    id: 'test-uuid-123',
    clerkId: 'user_2t1I...',
    email: 'test@example.com',
    username: 'testuser',
    isBanned: false,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ClerkGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          // Inject mock user into request
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    
    // Ensure test database is clean before starting
    // Note: Make sure .env.test is pointed to gr_test
    await prisma.cleanDatabase();
    
    // Seed the mock user into DB
    await prisma.user.create({
      data: {
        id: mockUser.id,
        clerkId: mockUser.clerkId,
        email: mockUser.email,
        username: mockUser.username,
      }
    });
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  it('GET /artworks/user/me should return the mock user info (Protected Route)', async () => {
    const response = await request(app.getHttpServer())
      .get('/artworks/user/me')
      .expect(200);

    expect(response.body.message).toBe('My artworks');
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('GET /users/profile/me should return profile (Protected Route)', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/profile/me')
      .expect(200);

    expect(response.body.data.username).toBe(mockUser.username);
  });
});
