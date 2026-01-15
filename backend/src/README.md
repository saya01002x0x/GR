# 📁 Backend Source Code Structure

## 🎯 Architecture Overview

```
src/
├── app.module.ts              # Root Module - Orchestrates everything
├── main.ts                    # Entry Point - Bootstrap application
│
├── common/                    # 🔧 Shared Utilities (Cross-cutting concerns)
│   ├── decorators/            # Custom decorators (@CurrentUser, @Roles, @Public)
│   ├── filters/               # Exception filters (Global error handling)
│   ├── guards/                # Guards (RolesGuard, ThrottleGuard)
│   ├── interceptors/          # Interceptors (Logging, Transform response)
│   └── utils/                 # Helper functions (date, string manipulation)
│
├── config/                    # ⚙️ Configuration Layer
│   ├── configuration.ts       # Type-safe config object
│   └── env.validation.ts      # Environment variables validation (Joi)
│
├── database/                  # 🗄️ Database Layer (Coming Soon - Prisma)
│   ├── prisma.module.ts       # @Global() Prisma Module
│   └── prisma.service.ts      # Database connection & queries
│
└── modules/                   # 🎨 Feature Modules (Business Logic)
    ├── auth/                  # Authentication & Authorization
    │   ├── strategies/        # Passport strategies (Clerk)
    │   ├── guards/            # Auth guards
    │   ├── providers/         # Clerk client provider
    │   ├── auth.module.ts
    │   └── auth.service.ts
    │
    ├── users/                 # User Management
    │   ├── dto/               # Data Transfer Objects
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   └── users.module.ts
    │
    ├── artworks/              # Artwork Management (Core Feature)
    │   ├── dto/
    │   ├── artworks.controller.ts
    │   ├── artworks.service.ts
    │   └── artworks.module.ts
    │
    ├── storage/               # File Upload & Storage (MinIO/S3/R2)
    │   ├── storage.service.ts
    │   └── storage.module.ts
    │
    └── search/                # Search Engine Integration (Meilisearch)
        ├── search.service.ts
        └── search.module.ts
```

---

## 📚 Layers Explanation

### 1. **Common Layer** (`common/`)

**Purpose:** Shared code used across multiple modules

**Examples:**
- `decorators/` - `@CurrentUser()`, `@Roles('admin')`, `@Public()`
- `guards/` - `RolesGuard`, `ThrottleGuard`
- `filters/` - `HttpExceptionFilter`, `ValidationExceptionFilter`
- `interceptors/` - `LoggingInterceptor`, `TransformInterceptor`

**Rule:** Code here MUST be generic and reusable!

### 2. **Config Layer** (`config/`)

**Purpose:** Centralized configuration management

**Features:**
- ✅ Type-safe configuration object
- ✅ Environment variable validation (Joi schema)
- ✅ Fail-fast on missing required variables
- ✅ Global access via `ConfigService`

**Example:**
```typescript
constructor(private configService: ConfigService) {
  const clerkKey = this.configService.get('clerk.secretKey');
}
```

### 3. **Database Layer** (`database/`) - Coming Soon

**Purpose:** Database access layer with Prisma

**Features:**
- ✅ `@Global()` module - Auto-available everywhere
- ✅ Single source of truth for DB connection
- ✅ Transaction management
- ✅ Query optimization

### 4. **Modules Layer** (`modules/`)

**Purpose:** Business logic and features

**Structure:**
```
modules/
└── feature-name/
    ├── dto/                  # Data Transfer Objects (validation)
    ├── entities/             # Domain models (optional)
    ├── feature.controller.ts # HTTP endpoints
    ├── feature.service.ts    # Business logic
    └── feature.module.ts     # Module definition
```

**Rules:**
- Each module is **self-contained**
- Modules communicate via **well-defined interfaces**
- No circular dependencies!

---

## 🎯 Design Principles

### 1. **Separation of Concerns**

```
❌ Bad:
src/
├── auth.module.ts
├── users.module.ts
├── current-user.decorator.ts  // Mixed with modules
├── artworks.module.ts
└── ...

✅ Good:
src/
├── common/decorators/current-user.decorator.ts  // Clearly separated
└── modules/
    ├── auth/
    ├── users/
    └── artworks/
```

### 2. **Scalability**

When adding 20 features:
```
modules/
├── auth/
├── users/
├── artworks/
├── comments/
├── tags/
├── collections/
├── notifications/
├── payments/
├── analytics/
... (Easy to scale!)
```

### 3. **Dependency Injection**

```typescript
// Bad: Import module everywhere
@Module({
  imports: [ConfigModule, PrismaModule],  // Repeated!
})

// Good: Use @Global() modules
@Module({
  // ConfigModule & PrismaModule auto-available
})
```

---

## 🚀 Quick Start Guide

### Create New Feature Module

```bash
# Generate module via NestJS CLI
docker exec gr-backend npx nest g module modules/feature-name
docker exec gr-backend npx nest g controller modules/feature-name
docker exec gr-backend npx nest g service modules/feature-name
```

### Create DTO

```bash
# Manual creation
touch src/modules/feature-name/dto/create-feature.dto.ts
```

```typescript
// create-feature.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFeatureDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
```

### Use Config Service

```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  doSomething() {
    const clerkKey = this.configService.get<string>('clerk.secretKey');
    const port = this.configService.get<number>('port');
  }
}
```

---

## 📖 Module Examples

### Auth Module (Already Implemented)

```typescript
@Module({
  imports: [PassportModule, ConfigModule],
  providers: [AuthService, ClerkClientProvider, ClerkStrategy, ClerkGuard],
  exports: [AuthService, ClerkGuard],
})
export class AuthModule {}
```

### Artworks Module (Example)

```typescript
@Module({
  controllers: [ArtworksController],
  providers: [ArtworksService],
  exports: [ArtworksService],
})
export class ArtworksModule {}
```

---

## 🔐 Best Practices

### 1. Always Use NestJS CLI

```bash
# ✅ Good
npx nest g module modules/feature-name

# ❌ Bad
mkdir src/modules/feature-name  # Manual creation
```

### 2. Follow Naming Conventions

```
feature-name.controller.ts   # HTTP layer
feature-name.service.ts      # Business logic
feature-name.module.ts       # Module definition
create-feature.dto.ts        # Input validation
feature.entity.ts            # Domain model
```

### 3. Keep Modules Loosely Coupled

```typescript
// ✅ Good: Inject service from another module
@Injectable()
export class ArtworksService {
  constructor(private usersService: UsersService) {}
}

// ❌ Bad: Direct import
import { User } from '../users/user.entity';
```

### 4. Use Guards for Authorization

```typescript
@Controller('artworks')
@UseGuards(ClerkGuard)  // Protect all routes
export class ArtworksController {
  @Post()
  @Roles('admin')  // Additional role check
  create() {}
}
```

---

## 🧪 Testing Structure

```
src/modules/feature-name/
├── feature.controller.spec.ts   # Controller tests
├── feature.service.spec.ts      # Service tests
└── __tests__/
    └── feature.integration.spec.ts  # Integration tests
```

---

## 📚 References

- **NestJS Modules:** https://docs.nestjs.com/modules
- **Configuration:** https://docs.nestjs.com/techniques/configuration
- **Guards:** https://docs.nestjs.com/guards
- **Custom Decorators:** https://docs.nestjs.com/custom-decorators
- **Exception Filters:** https://docs.nestjs.com/exception-filters

---

## 🎓 Learning Path

1. Read [HOWTO_NESTJS_MODULES.md](../../docs/HOWTO_NESTJS_MODULES.md)
2. Study existing modules (`auth/`, `artworks/`)
3. Create your first feature module
4. Add tests
5. Document your code

---

**Happy Coding! 🚀**
