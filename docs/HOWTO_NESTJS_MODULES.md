# 📚 How To: NestJS Modules Best Practices

Quy trình và best practices khi làm việc với NestJS trong GR Project.

## 🎯 Rule Chính

### **LUÔN LUÔN sử dụng NestJS CLI để tạo modules/components**

Không tạo files thủ công! NestJS CLI sẽ:
- ✅ Tạo files với structure đúng chuẩn
- ✅ Auto-import vào module cha
- ✅ Tạo test files tự động
- ✅ Follow NestJS conventions

---

## 🚀 NestJS CLI Commands

### Cấu Trúc Lệnh

```bash
# Trong Docker container
docker exec gr-backend npx nest g [schematic] [name] [path]

# Hoặc local (nếu có Node.js)
cd backend
npx nest g [schematic] [name] [path]
```

### Common Schematics

| Schematic | Mô tả | Ví dụ |
|-----------|-------|-------|
| `module` | Module | `npx nest g module users` |
| `controller` | Controller | `npx nest g controller users` |
| `service` | Service | `npx nest g service users` |
| `provider` | Provider | `npx nest g provider users/email` |
| `guard` | Guard | `npx nest g guard auth/jwt` |
| `interceptor` | Interceptor | `npx nest g interceptor logging` |
| `middleware` | Middleware | `npx nest g middleware logger` |
| `pipe` | Pipe | `npx nest g pipe validation` |
| `filter` | Exception Filter | `npx nest g filter http-exception` |
| `decorator` | Decorator | `npx nest g decorator current-user` |
| `gateway` | WebSocket Gateway | `npx nest g gateway events` |
| `resolver` | GraphQL Resolver | `npx nest g resolver users` |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.module.ts           # Root module
│   ├── main.ts                 # Entry point
│   │
│   ├── auth/                   # Feature module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts
│   │   ├── strategies/         # Passport strategies
│   │   │   └── clerk.strategy.ts
│   │   ├── guards/             # Auth guards
│   │   │   └── clerk.guard.ts
│   │   └── providers/          # Custom providers
│   │       └── clerk-client.provider.ts
│   │
│   ├── users/                  # Feature module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/                # Data Transfer Objects
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── decorators/             # Global decorators
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   │
│   ├── guards/                 # Global guards
│   │   └── roles.guard.ts
│   │
│   └── common/                 # Shared utilities
│       ├── filters/
│       ├── interceptors/
│       └── pipes/
│
├── scripts/                    # Utility scripts
└── test/                       # E2E tests
```

---

## 🔧 Ví Dụ: Tạo Auth Module với Clerk

### Bước 1: Generate Module

```bash
docker exec gr-backend npx nest g module auth
```

**Output:**
```
CREATE src/auth/auth.module.ts
UPDATE src/app.module.ts (auto-import)
```

### Bước 2: Generate Service

```bash
docker exec gr-backend npx nest g service auth
```

**Output:**
```
CREATE src/auth/auth.service.ts
CREATE src/auth/auth.service.spec.ts
UPDATE src/auth/auth.module.ts (auto-register)
```

### Bước 3: Generate Guard

```bash
docker exec gr-backend npx nest g guard auth/clerk
```

**Output:**
```
CREATE src/auth/clerk/clerk.guard.ts
CREATE src/auth/clerk/clerk.guard.spec.ts
```

### Bước 4: Tạo Custom Files

Các files không có schematic (như providers, strategies):

```bash
# Tạo thủ công
touch backend/src/auth/providers/clerk-client.provider.ts
touch backend/src/auth/strategies/clerk.strategy.ts
```

### Bước 5: Install Dependencies

```bash
docker exec gr-backend npm install @clerk/backend @nestjs/passport passport passport-custom
```

### Bước 6: Code Implementation

Xem code đầy đủ tại:
- `src/auth/auth.module.ts`
- `src/auth/providers/clerk-client.provider.ts`
- `src/auth/strategies/clerk.strategy.ts`
- `src/auth/clerk/clerk.guard.ts`

---

## 📖 References & Documentation

### Official NestJS Docs

Khi implement feature, **LUÔN** tham khảo official docs:

| Feature | Documentation |
|---------|--------------|
| **Authentication** | https://docs.nestjs.com/security/authentication |
| **Authorization** | https://docs.nestjs.com/security/authorization |
| **Guards** | https://docs.nestjs.com/guards |
| **Custom Decorators** | https://docs.nestjs.com/custom-decorators |
| **Providers** | https://docs.nestjs.com/providers |
| **Modules** | https://docs.nestjs.com/modules |
| **Controllers** | https://docs.nestjs.com/controllers |
| **Pipes** | https://docs.nestjs.com/pipes |
| **Interceptors** | https://docs.nestjs.com/interceptors |
| **Exception Filters** | https://docs.nestjs.com/exception-filters |
| **Middleware** | https://docs.nestjs.com/middleware |
| **Database (Prisma)** | https://docs.nestjs.com/recipes/prisma |
| **Configuration** | https://docs.nestjs.com/techniques/configuration |
| **Validation** | https://docs.nestjs.com/techniques/validation |
| **Caching** | https://docs.nestjs.com/techniques/caching |
| **Task Scheduling** | https://docs.nestjs.com/techniques/task-scheduling |
| **Queues (BullMQ)** | https://docs.nestjs.com/techniques/queues |
| **Testing** | https://docs.nestjs.com/fundamentals/testing |

### Third-Party Integrations

| Service | Documentation |
|---------|--------------|
| **Clerk** | https://clerk.com/docs/backend-requests/handling/nodejs |
| **Prisma** | https://www.prisma.io/docs/orm/prisma-client |
| **Redis** | https://github.com/redis/ioredis |
| **BullMQ** | https://docs.bullmq.io/ |
| **Meilisearch** | https://www.meilisearch.com/docs |
| **AWS SDK (MinIO)** | https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/ |

---

## 💡 Best Practices

### 1. Module Organization

#### ✅ Good - Feature-Based Modules

```typescript
// users/users.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export để dùng ở modules khác
})
export class UsersModule {}
```

#### ❌ Bad - Everything in AppModule

```typescript
// Không nên!
@Module({
  controllers: [
    UsersController,
    PostsController,
    CommentsController,
  ],
  providers: [
    UsersService,
    PostsService,
    CommentsService,
  ],
})
export class AppModule {}
```

### 2. Dependency Injection

#### ✅ Good - Constructor Injection

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerk: ClerkService,
  ) {}
}
```

#### ❌ Bad - Direct Instantiation

```typescript
// Không nên!
export class UsersService {
  private prisma = new PrismaService();
}
```

### 3. DTOs (Data Transfer Objects)

#### ✅ Good - Use DTOs with Validation

```typescript
// dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsEmail()
  email: string;
}
```

### 4. Guards Usage

#### ✅ Good - Use Guards for Authentication

```typescript
@Controller('artworks')
@UseGuards(ClerkGuard) // Require authentication cho tất cả routes
export class ArtworksController {
  @Get()
  findAll() {}

  @Post()
  @Roles('admin') // Combine với RolesGuard
  create() {}
}
```

### 5. Custom Decorators

#### ✅ Good - Reusable Decorators

```typescript
// decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Usage
@Get('profile')
getProfile(@CurrentUser() user: UserPayload) {
  return user;
}
```

---

## 🧪 Testing

### Generate Test Files

NestJS CLI tự động tạo test files:

```bash
# Service test
npx nest g service users
# Creates: users.service.spec.ts

# Controller test  
npx nest g controller users
# Creates: users.controller.spec.ts
```

### Unit Test Example

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### E2E Test Example

```typescript
// test/users.e2e-spec.ts
describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200);
  });
});
```

---

## 📝 Documentation trong Code

### Comments Best Practices

```typescript
/**
 * UsersService
 * Handle all user-related operations
 * Reference: https://docs.nestjs.com/providers
 */
@Injectable()
export class UsersService {
  /**
   * Create a new user
   * @param createUserDto - User data
   * @returns Created user
   */
  async create(createUserDto: CreateUserDto) {
    // Implementation
  }
}
```

### File Headers

Mỗi file nên có comment header:

```typescript
/**
 * Clerk Client Provider
 * Tạo và inject Clerk client vào application
 * Reference: https://clerk.com/docs/references/backend/overview
 */
```

---

## 🔄 Workflow Checklist

Khi implement feature mới:

- [ ] Generate module: `npx nest g module feature-name`
- [ ] Generate service: `npx nest g service feature-name`
- [ ] Generate controller (nếu cần): `npx nest g controller feature-name`
- [ ] Generate guard/pipe/etc (nếu cần)
- [ ] Install dependencies: `npm install packages`
- [ ] Tham khảo NestJS official docs
- [ ] Implement logic
- [ ] Write tests
- [ ] Document trong code
- [ ] Test manually
- [ ] Run unit tests: `npm run test`
- [ ] Run e2e tests: `npm run test:e2e`

---

## 🎓 Learning Resources

### Official

- **NestJS Docs:** https://docs.nestjs.com
- **NestJS CLI:** https://docs.nestjs.com/cli/overview
- **NestJS Courses:** https://courses.nestjs.com

### Community

- **NestJS Discord:** https://discord.gg/nestjs
- **GitHub Examples:** https://github.com/nestjs/nest/tree/master/sample
- **Awesome NestJS:** https://github.com/juliandavidmr/awesome-nestjs

---

## ✅ Summary

**3 Rules Vàng:**

1. 🎯 **LUÔN dùng NestJS CLI** để generate modules/components
2. 📖 **LUÔN tham khảo official docs** trước khi implement
3. 📝 **LUÔN document** code với comments và references

**Workflow:**
```
Generate → Install → Reference Docs → Implement → Test → Document
```

---

**Remember: NestJS CLI là bạn của bạn! 🚀**
