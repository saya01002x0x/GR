# NestJS Knowledge Base

Các concept và patterns được sử dụng trong dự án NestJS.

---

## Authentication

#### PassportStrategy

- **Là gì:** Base class để tạo custom authentication strategy với Passport.js
- **Cách dùng:**
  ```typescript
  import { PassportStrategy } from '@nestjs/passport';
  import { Strategy } from 'passport-custom';
  
  @Injectable()
  export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
    async validate(req: Request): Promise<UserPayload> {
      // Verify token và return user
      const token = this.extractTokenFromHeader(req);
      const user = await this.verifyToken(token);
      return user;
    }
  }
  ```
- **Ứng dụng:** `ClerkStrategy` verify JWT token từ Clerk và populate user vào request

#### AuthGuard

- **Là gì:** Guard sử dụng Passport strategy để protect routes
- **Cách dùng:**
  ```typescript
  import { AuthGuard } from '@nestjs/passport';
  
  @Injectable()
  export class ClerkGuard extends AuthGuard('clerk') {}
  
  // Usage
  @Get('protected')
  @UseGuards(ClerkGuard)
  getProtected() { ... }
  ```
- **Ứng dụng:** `ClerkGuard` protect các API endpoints yêu cầu authentication

---

## Dependency Injection

#### @Inject() Decorator

- **Là gì:** Inject custom provider bằng token (thay vì class type)
- **Cách dùng:**
  ```typescript
  // Provider
  export const CLERK_CLIENT = 'CLERK_CLIENT';
  export const ClerkClientProvider = {
    provide: CLERK_CLIENT,
    useFactory: (config: ConfigService) => createClerkClient({ ... }),
    inject: [ConfigService],
  };
  
  // Usage
  @Injectable()
  export class ClerkStrategy {
    constructor(
      @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
    ) {}
  }
  ```
- **Ứng dụng:** Inject Clerk client vào strategy để verify tokens

#### Custom Providers (useFactory)

- **Là gì:** Tạo provider với factory function để khởi tạo dependencies
- **Cách dùng:**
  ```typescript
  export const ClerkClientProvider = {
    provide: CLERK_CLIENT,
    useFactory: (configService: ConfigService) => {
      return createClerkClient({
        secretKey: configService.get('CLERK_SECRET_KEY'),
      });
    },
    inject: [ConfigService],
  };
  ```
- **Ứng dụng:** Tạo Clerk client với config từ environment variables

---

## Custom Decorators

#### Parameter Decorator (createParamDecorator)

- **Là gì:** Tạo custom decorator để extract data từ request
- **Cách dùng:**
  ```typescript
  import { createParamDecorator, ExecutionContext } from '@nestjs/common';
  
  export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    },
  );
  
  // Usage
  @Get('me')
  getMe(@CurrentUser() user: UserPayload) {
    return user;
  }
  ```
- **Ứng dụng:** `@CurrentUser()` decorator lấy user đã authenticated từ request

---

## Module Structure

#### Feature Modules

- **Là gì:** Nhóm related components (controller, service, providers) thành module
- **Cách dùng:**
  ```typescript
  @Module({
    imports: [PassportModule, ConfigModule],
    providers: [AuthService, ClerkClientProvider, ClerkStrategy, ClerkGuard],
    exports: [AuthService, ClerkGuard],
  })
  export class AuthModule {}
  ```
- **Ứng dụng:** `AuthModule` chứa tất cả authentication-related code

---

## Database (Prisma)

#### PrismaService

- **Là gì:** Service extends `PrismaClient` để quản lý database connection lifecycle
- **Cách dùng:**
  ```typescript
  import { PrismaClient } from '@prisma/client';
  
  @Injectable()
  export class PrismaService extends PrismaClient 
    implements OnModuleInit, OnModuleDestroy {
    
    async onModuleInit() {
      await this.$connect();
    }
    
    async onModuleDestroy() {
      await this.$disconnect();
    }
  }
  ```
- **Ứng dụng:** Inject vào services để query database

#### @Global() Decorator

- **Là gì:** Đánh dấu module là global, tự động available ở mọi nơi mà không cần import
- **Cách dùng:**
  ```typescript
  @Global()
  @Module({
    providers: [PrismaService],
    exports: [PrismaService],
  })
  export class PrismaModule {}
  ```
- **Ứng dụng:** `PrismaModule` là global, các module khác không cần import mà vẫn dùng được `PrismaService`

#### Prisma CLI Commands

- **Là gì:** Các lệnh CLI để quản lý database schema và migrations
- **Cách dùng:**
  ```bash
  # Push schema to database (development)
  prisma db push
  
  # Generate Prisma Client
  prisma generate
  
  # Open Prisma Studio (Database GUI)
  prisma studio
  
  # Create migration (production)
  prisma migrate dev --name init
  
  # Reset database
  prisma migrate reset
  ```
- **Ứng dụng:** Dùng `db push` trong development, `migrate` cho production
