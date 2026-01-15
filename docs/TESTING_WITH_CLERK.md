# 🧪 Testing với Clerk - Authentication & RBAC

Hướng dẫn chi tiết về cách test API endpoints có authentication và authorization (RBAC) khi sử dụng Clerk.

## 📋 Tổng Quan

Clerk hoàn toàn hỗ trợ testing với:
- ✅ Test mode với API keys riêng
- ✅ Mock users và sessions
- ✅ RBAC với Organizations và Roles
- ✅ Test tokens cho API calls
- ✅ Webhook testing

---

## 🔐 RBAC với Clerk

### Cách 1: Dùng Organizations (Recommended)

Clerk có built-in support cho Organizations với roles.

#### Setup Organizations

1. Vào Clerk Dashboard: https://dashboard.clerk.com
2. Sidebar → **Organizations**
3. Enable organizations
4. Configure roles:
   - `admin` - Full access
   - `moderator` - Moderate content
   - `member` - Basic access

#### Backend Code

```typescript
// backend/src/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { clerkClient } from '@clerk/express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.auth.userId; // Từ Clerk middleware

    // Get user's organization memberships
    const orgMemberships = await clerkClient.users.getOrganizationMembershipList({
      userId,
    });

    // Check if user has required role in any org
    return orgMemberships.some((membership) =>
      requiredRoles.includes(membership.role),
    );
  }
}
```

#### Sử dụng trong Controller

```typescript
// backend/src/modules/artworks/artworks.controller.ts
import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '@clerk/express';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('artworks')
@UseGuards(ClerkAuthGuard) // Require authentication
export class ArtworksController {
  // Public endpoint (authenticated users)
  @Get()
  findAll() {
    return 'List all artworks';
  }

  // Require member role or higher
  @Post()
  @UseGuards(RolesGuard)
  @Roles('member', 'moderator', 'admin')
  create() {
    return 'Create artwork';
  }

  // Require moderator role
  @Post(':id/feature')
  @UseGuards(RolesGuard)
  @Roles('moderator', 'admin')
  featureArtwork() {
    return 'Feature artwork';
  }

  // Require admin role
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove() {
    return 'Delete artwork';
  }
}
```

### Cách 2: Custom Metadata

Nếu không dùng Organizations, có thể dùng custom metadata:

```typescript
// Lưu role trong user metadata
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
  },
});

// Check role
const user = await clerkClient.users.getUser(userId);
const role = user.publicMetadata.role;
```

---

## 🧪 Testing API Endpoints

### 1. Test với Postman/Thunder Client

#### Bước 1: Lấy Token từ Clerk

**Cách A: Từ Browser (Dev)**

```javascript
// Mở DevTools console tại http://localhost:3000
// Paste code này:
const token = await window.Clerk.session.getToken();
console.log(token);
```

Copy token và dùng trong Postman.

**Cách B: Tạo Test User và Get Token**

```typescript
// backend/scripts/create-test-token.ts
import { clerkClient } from '@clerk/clerk-sdk-node';

async function createTestUser() {
  // Create test user
  const user = await clerkClient.users.createUser({
    emailAddress: ['test@example.com'],
    password: 'TestPassword123!',
  });

  // Create session for user
  const session = await clerkClient.sessions.createSession({
    userId: user.id,
  });

  // Get token
  const token = await clerkClient.sessions.getToken(session.id);
  
  console.log('User ID:', user.id);
  console.log('Token:', token);
  
  return { user, token };
}

createTestUser();
```

#### Bước 2: Test API với Postman

```http
GET http://localhost:3001/api/artworks
Authorization: Bearer YOUR_TOKEN_HERE
```

### 2. Test với cURL

```bash
# Get token từ step trên, sau đó:
curl http://localhost:3001/api/artworks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Test với Jest/Vitest

#### Setup Test User

```typescript
// backend/test/setup.ts
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function createTestUser(role: string = 'member') {
  const testEmail = `test-${Date.now()}@example.com`;
  
  const user = await clerkClient.users.createUser({
    emailAddress: [testEmail],
    password: 'TestPassword123!',
    publicMetadata: { role },
  });

  const session = await clerkClient.sessions.createSession({
    userId: user.id,
  });

  const token = await clerkClient.sessions.getToken(session.id);

  return {
    user,
    token,
    cleanup: async () => {
      await clerkClient.users.deleteUser(user.id);
    },
  };
}
```

#### E2E Test Example

```typescript
// backend/test/artworks.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { createTestUser } from './setup';

describe('Artworks API (e2e)', () => {
  let app: INestApplication;
  let memberToken: string;
  let adminToken: string;
  let cleanup: Function[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test users
    cleanup = [];
    
    const member = await createTestUser('member');
    memberToken = member.token;
    cleanup.push(member.cleanup);

    const admin = await createTestUser('admin');
    adminToken = admin.token;
    cleanup.push(admin.cleanup);
  });

  afterAll(async () => {
    // Cleanup test users
    for (const fn of cleanup) {
      await fn();
    }
    await app.close();
  });

  describe('/artworks (GET)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/artworks')
        .expect(401);
    });

    it('should return 200 with valid token', () => {
      return request(app.getHttpServer())
        .get('/artworks')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);
    });
  });

  describe('/artworks (POST)', () => {
    it('should allow member to create artwork', () => {
      return request(app.getHttpServer())
        .post('/artworks')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Test Artwork' })
        .expect(201);
    });
  });

  describe('/artworks/:id (DELETE)', () => {
    it('should deny member from deleting', () => {
      return request(app.getHttpServer())
        .delete('/artworks/1')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403); // Forbidden
    });

    it('should allow admin to delete', () => {
      return request(app.getHttpServer())
        .delete('/artworks/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
```

---

## 🎭 Mock Testing (Unit Tests)

Nếu muốn test mà không call Clerk API thật:

### Mock Clerk Client

```typescript
// backend/test/mocks/clerk.mock.ts
export const mockClerkClient = {
  users: {
    getUser: jest.fn().mockResolvedValue({
      id: 'user_test123',
      emailAddress: 'test@example.com',
      publicMetadata: { role: 'admin' },
    }),
    getOrganizationMembershipList: jest.fn().mockResolvedValue([
      { role: 'admin', organization: { id: 'org_123' } },
    ]),
  },
};

// Trong test file
jest.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: mockClerkClient,
}));
```

### Unit Test với Mock

```typescript
// backend/src/modules/artworks/artworks.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ArtworksService } from './artworks.service';
import { mockClerkClient } from '../../../test/mocks/clerk.mock';

describe('ArtworksService', () => {
  let service: ArtworksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArtworksService],
    }).compile();

    service = module.get<ArtworksService>(ArtworksService);
  });

  it('should check if user is admin', async () => {
    mockClerkClient.users.getUser.mockResolvedValueOnce({
      id: 'user_test',
      publicMetadata: { role: 'admin' },
    });

    const isAdmin = await service.checkUserRole('user_test', 'admin');
    expect(isAdmin).toBe(true);
  });

  it('should deny non-admin user', async () => {
    mockClerkClient.users.getUser.mockResolvedValueOnce({
      id: 'user_test',
      publicMetadata: { role: 'member' },
    });

    const isAdmin = await service.checkUserRole('user_test', 'admin');
    expect(isAdmin).toBe(false);
  });
});
```

---

## 🔧 Development Tools

### 1. Clerk Dashboard - Test Users

1. Vào: https://dashboard.clerk.com
2. **Users** → **Create User**
3. Tạo test users với các roles khác nhau:
   - `admin@test.com` - Admin
   - `mod@test.com` - Moderator
   - `user@test.com` - Member

### 2. VS Code Extension - Thunder Client

Extension để test API ngay trong VS Code:

1. Install **Thunder Client**
2. Tạo collection `GR Project`
3. Tạo environment variables:

```json
{
  "baseUrl": "http://localhost:3001",
  "memberToken": "paste_token_here",
  "adminToken": "paste_token_here"
}
```

4. Test requests:

```http
### Get Artworks (Member)
GET {{baseUrl}}/artworks
Authorization: Bearer {{memberToken}}

### Delete Artwork (Admin)
DELETE {{baseUrl}}/artworks/1
Authorization: Bearer {{adminToken}}
```

### 3. Script Tạo Test Tokens

```typescript
// backend/scripts/get-test-tokens.ts
import { clerkClient } from '@clerk/clerk-sdk-node';

async function getTestTokens() {
  const users = await clerkClient.users.getUserList();
  
  console.log('=== TEST TOKENS ===\n');
  
  for (const user of users) {
    const sessions = await clerkClient.sessions.getSessionList({
      userId: user.id,
    });
    
    if (sessions.length > 0) {
      const token = await clerkClient.sessions.getToken(
        sessions[0].id,
        'jwt-template', // hoặc dùng default
      );
      
      console.log(`User: ${user.emailAddresses[0].emailAddress}`);
      console.log(`Role: ${user.publicMetadata.role || 'none'}`);
      console.log(`Token: ${token}`);
      console.log('---\n');
    }
  }
}

getTestTokens();
```

Chạy:
```bash
cd backend
npx ts-node scripts/get-test-tokens.ts
```

---

## 🎯 Testing Workflow

### Flow Hoàn Chỉnh

```bash
# 1. Tạo test users trong Clerk Dashboard
# hoặc dùng script

# 2. Get tokens
npm run get-test-tokens

# 3. Test với Thunder Client/Postman
# Paste tokens vào requests

# 4. Run automated tests
npm run test              # Unit tests
npm run test:e2e          # E2E tests

# 5. Check coverage
npm run test:cov
```

---

## 📊 RBAC Permission Matrix

| Endpoint | Public | Member | Moderator | Admin |
|----------|--------|--------|-----------|-------|
| GET /artworks | ✅ | ✅ | ✅ | ✅ |
| POST /artworks | ❌ | ✅ | ✅ | ✅ |
| PUT /artworks/:id (own) | ❌ | ✅ | ✅ | ✅ |
| PUT /artworks/:id (any) | ❌ | ❌ | ✅ | ✅ |
| DELETE /artworks/:id (own) | ❌ | ✅ | ✅ | ✅ |
| DELETE /artworks/:id (any) | ❌ | ❌ | ✅ | ✅ |
| POST /artworks/:id/feature | ❌ | ❌ | ✅ | ✅ |
| GET /admin/users | ❌ | ❌ | ❌ | ✅ |
| DELETE /users/:id | ❌ | ❌ | ❌ | ✅ |

---

## 🔐 Best Practices

### 1. Separate Test Environment

```env
# .env.test
NODE_ENV=test
CLERK_SECRET_KEY=sk_test_... # Dùng test keys riêng
```

### 2. Cleanup Test Data

```typescript
afterEach(async () => {
  // Clean up test users
  await cleanupTestUsers();
  
  // Clean up test data
  await prisma.artwork.deleteMany({
    where: { title: { startsWith: 'TEST_' } },
  });
});
```

### 3. Use Test-Specific Keys

Clerk cho phép tạo nhiều environments:
- Development (sk_test_...)
- Production (sk_live_...)
- Testing (tạo riêng app cho testing)

### 4. Mock External Services

```typescript
// Mock Clerk trong unit tests
jest.mock('@clerk/clerk-sdk-node');

// Dùng real Clerk trong E2E tests
// Không mock để test integration thật
```

---

## 🆘 Common Issues

### Issue: "Invalid token"

**Nguyên nhân:**
- Token expired (Clerk tokens expire sau 1 giờ)
- Dùng test key với live token

**Fix:**
```typescript
// Get fresh token
const token = await clerkClient.sessions.getToken(sessionId);
```

### Issue: "User not found"

**Nguyên nhân:**
- Test user đã bị xóa
- Dùng sai Clerk environment

**Fix:**
```typescript
// Check if user exists first
const user = await clerkClient.users.getUser(userId).catch(() => null);
if (!user) {
  // Create new test user
}
```

### Issue: Role check không hoạt động

**Nguyên nhân:**
- Metadata chưa được set
- Cache issue

**Fix:**
```typescript
// Force refresh user
const user = await clerkClient.users.getUser(userId);
await clerkClient.users.updateUser(userId, {
  publicMetadata: { ...user.publicMetadata, role: 'admin' },
});
```

---

## 📚 Resources

### Official Docs
- Clerk Testing: https://clerk.com/docs/testing
- Clerk Organizations: https://clerk.com/docs/organizations
- Clerk Roles: https://clerk.com/docs/organizations/roles

### Code Examples
- NestJS + Clerk: https://github.com/clerkinc/clerk-nestjs-example
- Testing Guide: https://clerk.com/docs/testing/automated-testing

---

## ✅ Checklist

Để test API đầy đủ:

- [ ] Setup Clerk test environment
- [ ] Tạo test users với các roles khác nhau
- [ ] Get test tokens cho mỗi role
- [ ] Setup Thunder Client/Postman collections
- [ ] Viết E2E tests cho authenticated endpoints
- [ ] Viết unit tests với mocked Clerk
- [ ] Test permission matrix đầy đủ
- [ ] Setup CI/CD với automated tests
- [ ] Document API với authentication requirements

---

**Kết luận:** Clerk hoàn toàn hỗ trợ testing và RBAC! Bạn có thể test được tất cả các API endpoints, roles, và permissions một cách dễ dàng. 🚀

