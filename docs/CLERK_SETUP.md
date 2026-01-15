# 🔐 Clerk Setup Guide - NestJS Backend

Hướng dẫn chi tiết setup Clerk authentication trong NestJS backend.

## 📚 Reference

**Official Docs:**
- Clerk Backend: https://clerk.com/docs/backend-requests/handling/nodejs
- NestJS Auth: https://docs.nestjs.com/security/authentication
- NestJS Passport: https://docs.nestjs.com/recipes/passport

**Tutorial:** https://dev.to/thedammyking/authentication-with-clerk-in-nestjs-server-application-gpm

---

## 🎯 Architecture Overview

```
Client Request
    ↓ (Bearer Token in Authorization header)
ClerkGuard (AuthGuard)
    ↓
ClerkStrategy (Passport)
    ↓ (Verify JWT token with Clerk)
ClerkClient.verifyToken()
    ↓ (Get user info)
ClerkClient.users.getUser()
    ↓ (Attach user to request)
Controller Handler (@CurrentUser())
```

---

## 📦 Dependencies

### Installed Packages

```json
{
  "@clerk/backend": "^latest",
  "@nestjs/passport": "^latest",
  "passport": "^latest",
  "passport-custom": "^latest"
}
```

### Install Command

```bash
docker exec gr-backend npm install @clerk/backend @nestjs/passport passport passport-custom
```

---

## 🏗️ Project Structure

```
backend/src/
├── auth/
│   ├── auth.module.ts              # Auth module (imports PassportModule)
│   ├── auth.service.ts             # Auth service (business logic)
│   │
│   ├── providers/
│   │   └── clerk-client.provider.ts    # Clerk client provider
│   │
│   ├── strategies/
│   │   └── clerk.strategy.ts           # Passport strategy để verify JWT
│   │
│   └── clerk/
│       └── clerk.guard.ts              # Guard để protect routes
│
├── decorators/
│   └── current-user.decorator.ts       # Decorator để lấy user từ request
│
└── artworks/
    └── artworks.controller.ts          # Example controller với auth
```

---

## 🔧 Implementation

### 1. Clerk Client Provider

**File:** `src/auth/providers/clerk-client.provider.ts`

```typescript
import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

export const CLERK_CLIENT = 'CLERK_CLIENT';

export const ClerkClientProvider = {
  provide: CLERK_CLIENT,
  useFactory: (configService: ConfigService) => {
    return createClerkClient({
      publishableKey: configService.get('CLERK_PUBLISHABLE_KEY'),
      secretKey: configService.get('CLERK_SECRET_KEY'),
    });
  },
  inject: [ConfigService],
};
```

**Purpose:** Tạo Clerk client và inject vào application.

### 2. Clerk Strategy

**File:** `src/auth/strategies/clerk.strategy.ts`

```typescript
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import type { ClerkClient } from '@clerk/backend';
import { CLERK_CLIENT } from '../providers/clerk-client.provider';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(@Inject(CLERK_CLIENT) private clerkClient: ClerkClient) {
    super();
  }

  async validate(req: Request): Promise<any> {
    // 1. Extract token từ Authorization header
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new UnauthorizedException('No token');
    }

    // 2. Verify token với Clerk
    const session = await this.clerkClient.verifyToken(token);
    if (!session) {
      throw new UnauthorizedException('Invalid token');
    }

    // 3. Get user info
    const user = await this.clerkClient.users.getUser(session.sub);

    // 4. Return user object (attach vào request.user)
    return {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      metadata: user.publicMetadata,
    };
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
```

**Purpose:** Verify JWT token và lấy user info từ Clerk.

### 3. Clerk Guard

**File:** `src/auth/clerk/clerk.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClerkGuard extends AuthGuard('clerk') {}
```

**Purpose:** Protect routes bằng Clerk authentication.

### 4. Auth Module

**File:** `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ClerkClientProvider } from './providers/clerk-client.provider';
import { ClerkStrategy } from './strategies/clerk.strategy';
import { ClerkGuard } from './clerk/clerk.guard';

@Module({
  imports: [PassportModule],
  providers: [AuthService, ClerkClientProvider, ClerkStrategy, ClerkGuard],
  exports: [AuthService, ClerkGuard],
})
export class AuthModule {}
```

**Purpose:** Register tất cả auth components.

### 5. Current User Decorator

**File:** `src/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  metadata: Record<string, any>;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Purpose:** Lấy user info từ request một cách dễ dàng.

---

## 🚀 Usage Examples

### Public Endpoint (No Auth)

```typescript
@Controller('artworks')
export class ArtworksController {
  @Get()
  findAll() {
    return { message: 'Public endpoint' };
  }
}
```

### Protected Endpoint (Require Auth)

```typescript
@Controller('artworks')
export class ArtworksController {
  @Get('me')
  @UseGuards(ClerkGuard)  // Require authentication
  findMyArtworks(@CurrentUser() user: UserPayload) {
    return {
      userId: user.userId,
      email: user.email,
      name: user.fullName,
    };
  }
}
```

### Protect Entire Controller

```typescript
@Controller('admin')
@UseGuards(ClerkGuard)  // All routes require auth
export class AdminController {
  @Get('users')
  getAllUsers() {
    // This route is protected
  }

  @Delete('users/:id')
  deleteUser() {
    // This route is also protected
  }
}
```

---

## 🧪 Testing with Clerk

### 1. Get Test Token

```bash
# Create test users
docker exec -it gr-backend npx ts-node scripts/create-test-users.ts

# Sign in at frontend
http://localhost:3000/sign-in

# Get token
docker exec -it gr-backend npx ts-node scripts/get-test-token.ts
```

### 2. Test API with Token

```bash
# Test public endpoint (no token needed)
curl http://localhost:3001/artworks

# Test protected endpoint (token required)
curl http://localhost:3001/artworks/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Expected Responses

**Success (200):**
```json
{
  "message": "My artworks (authenticated)",
  "user": {
    "id": "user_xxx",
    "email": "test@example.com",
    "name": "Test User"
  },
  "data": []
}
```

**Unauthorized (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 🔐 Environment Variables

Required in `backend/.env`:

```env
# Clerk Keys
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get keys from: https://dashboard.clerk.com

---

## 🎯 Flow Diagram

```
1. Client Request
   GET /artworks/me
   Header: Authorization: Bearer <JWT_TOKEN>
   
2. ClerkGuard intercepts
   → Calls ClerkStrategy.validate()
   
3. ClerkStrategy
   → Extract token from header
   → Call clerkClient.verifyToken(token)
   → Get user: clerkClient.users.getUser(userId)
   → Return user object
   
4. NestJS attaches user to request
   request.user = { userId, email, ... }
   
5. Controller receives request
   @CurrentUser() decorator extracts user from request
   
6. Business logic executes
   Can access user info via @CurrentUser() parameter
```

---

## 💡 Best Practices

### 1. ✅ Always Use Guards

```typescript
// Good
@Get('protected')
@UseGuards(ClerkGuard)
getProtectedData() {}

// Bad - No protection
@Get('protected')
getProtectedData() {}
```

### 2. ✅ Use @CurrentUser() Decorator

```typescript
// Good
@Get('me')
@UseGuards(ClerkGuard)
getProfile(@CurrentUser() user: UserPayload) {
  return user;
}

// Bad - Manual extraction
@Get('me')
@UseGuards(ClerkGuard)
getProfile(@Req() req: Request) {
  const user = req.user; // Less type-safe
}
```

### 3. ✅ Validate User Metadata

```typescript
@Get('admin')
@UseGuards(ClerkGuard)
adminAction(@CurrentUser() user: UserPayload) {
  // Check role from metadata
  if (user.metadata.role !== 'admin') {
    throw new ForbiddenException('Admin only');
  }
  // Proceed...
}
```

### 4. ✅ Handle Errors Gracefully

```typescript
@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  async validate(req: Request) {
    try {
      const token = this.extractTokenFromHeader(req);
      const session = await this.clerkClient.verifyToken(token);
      const user = await this.clerkClient.users.getUser(session.sub);
      return user;
    } catch (error) {
      // Log error for debugging
      console.error('Clerk auth error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
```

---

## 🐛 Troubleshooting

### Error: "No authentication token provided"

**Cause:** Missing Authorization header

**Fix:** Add Bearer token to request
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api
```

### Error: "Invalid token"

**Cause:** Token expired or invalid

**Fix:** Get fresh token from Clerk
```bash
docker exec -it gr-backend npx ts-node scripts/get-test-token.ts
```

### Error: "Cannot find module '@clerk/backend'"

**Cause:** Package not installed

**Fix:**
```bash
docker exec gr-backend npm install @clerk/backend
docker-compose restart backend
```

---

## 📚 Next Steps

- [ ] Add RBAC (Role-Based Access Control) - See [TESTING_WITH_CLERK.md](./TESTING_WITH_CLERK.md)
- [ ] Add custom metadata to users
- [ ] Implement refresh token logic
- [ ] Add webhook handlers for Clerk events
- [ ] Add session management

---

## 🔗 Related Docs

- [HOWTO_NESTJS_MODULES.md](./HOWTO_NESTJS_MODULES.md) - NestJS best practices
- [TESTING_WITH_CLERK.md](./TESTING_WITH_CLERK.md) - Testing với RBAC
- [API_KEYS.md](./API_KEYS.md) - Getting Clerk keys

---

**Clerk + NestJS = Easy Auth! 🔐🚀**
