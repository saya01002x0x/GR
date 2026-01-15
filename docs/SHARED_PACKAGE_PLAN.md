# 📦 Shared Package Implementation Plan

## 🎯 Objective

Create `@gr/shared` package for sharing DTOs, types, and utilities between backend and frontend.

---

## 📋 Phase 1: Setup Package (15 mins)

### Step 1: Create Package Structure

```bash
# Create directories
mkdir -p packages/shared/src/dtos
```

### Step 2: Create Package Configuration

**`packages/shared/package.json`:**
```json
{
  "name": "@gr/shared",
  "version": "1.0.0",
  "description": "Shared types and DTOs for GR project",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  }
}
```

**`packages/shared/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Update Workspace

**`pnpm-workspace.yaml`** (already exists, just add):
```yaml
packages:
  - 'frontend'
  - 'backend'
  - 'ai-service'
  - 'packages/*'  # ✨ Add this
```

### Step 4: Install in Backend & Frontend

```bash
cd backend
pnpm add @gr/shared --workspace

cd ../frontend
pnpm add @gr/shared --workspace
```

---

## 📋 Phase 2: Migrate DTOs (30 mins)

### Current DTOs to Migrate

From backend, identify all DTOs:
- `src/modules/auth/**/*.dto.ts`
- `src/modules/artworks/**/*.dto.ts`
- Future: users, comments, etc.

### Migration Pattern

**Example: Auth DTOs**

**Before (Backend only):**
```
backend/src/modules/auth/dto/
├── login.dto.ts
└── register.dto.ts
```

**After (Shared):**
```
packages/shared/src/dtos/auth/
├── login.dto.ts
└── register.dto.ts
```

**Backend imports:**
```typescript
// Old
import { LoginDto } from './dto/login.dto';

// New
import { LoginDto } from '@gr/shared';
```

**Frontend usage:**
```typescript
import { LoginDto } from '@gr/shared';

// Type-safe form
const handleLogin = (data: LoginDto) => {
  api.post('/auth/login', data);
};
```

---

## 📋 Phase 3: Add Utilities (Optional, 15 mins)

### Common Types

**`packages/shared/src/types/index.ts`:**
```typescript
export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

### Common Constants

**`packages/shared/src/constants/index.ts`:**
```typescript
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const;

export const ARTWORK_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;
```

---

## 📋 Phase 4: Setup Build Pipeline

### Development Workflow

```bash
# Terminal 1: Watch shared package
cd packages/shared
pnpm dev  # tsc --watch

# Terminal 2: Run backend
cd backend
pnpm start:dev

# Terminal 3: Run frontend
cd frontend
pnpm dev
```

### Docker Compose Integration

Update `docker-compose.yml` to build shared package first:

```yaml
services:
  shared:
    build:
      context: ./packages/shared
      dockerfile: Dockerfile
    volumes:
      - ./packages/shared:/app
      - /app/node_modules

  backend:
    depends_on:
      - shared
    volumes:
      - ./backend:/app
      - ./packages/shared/dist:/app/node_modules/@gr/shared/dist
```

---

## 🎯 Success Metrics

### Phase 1 Complete When:
- ✅ `packages/shared` created
- ✅ Package builds successfully
- ✅ Backend can import from `@gr/shared`
- ✅ Frontend can import from `@gr/shared`

### Phase 2 Complete When:
- ✅ All existing DTOs migrated
- ✅ Backend imports from shared
- ✅ Frontend uses types for API calls
- ✅ No duplicate DTO definitions

### Phase 3 Complete When:
- ✅ Common types defined
- ✅ Constants centralized
- ✅ Documentation updated

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@gr/shared'"

**Solution:**
```bash
# Reinstall dependencies
pnpm install

# Or manually link
cd packages/shared && pnpm build
cd ../../backend && pnpm install
cd ../frontend && pnpm install
```

### Issue: "Decorator errors in Frontend"

**Solution:** Add to `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Issue: "Hot reload not working"

**Solution:** Run `pnpm dev` in shared package terminal:
```bash
cd packages/shared
pnpm dev  # This watches for changes
```

---

## 📚 Documentation Updates

After implementation, update:
- [ ] `docs/HOWTO_NESTJS_MODULES.md` - Add shared package section
- [ ] `backend/src/README.md` - Update import patterns
- [ ] `QUICK_START.md` - Add shared package setup
- [ ] `DOCKER_GUIDE.md` - Add shared package build

---

## 🎓 Team Training

### Key Concepts to Share:
1. What is a monorepo workspace
2. How to import from `@gr/shared`
3. When to add new DTOs to shared
4. How to build shared package

### Training Materials:
- [ ] Create `docs/SHARED_PACKAGE.md`
- [ ] Record demo video
- [ ] Update onboarding docs

---

## ⏰ Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1 | 15 mins | 🔴 Critical |
| Phase 2 | 30 mins | 🟡 High |
| Phase 3 | 15 mins | 🟢 Nice to have |
| Phase 4 | 30 mins | 🟡 High |

**Total:** ~90 minutes for full implementation

---

## 🤔 Decision Points

### Do it NOW if:
- ✅ Project lifespan > 6 months
- ✅ Team size > 2 developers
- ✅ Already have > 5 DTOs
- ✅ Need strict API contracts

### Wait if:
- ⏸️ Project just started (< 2 weeks)
- ⏸️ Solo developer
- ⏸️ API still unstable
- ⏸️ MVP phase (rapid prototyping)

---

## 🎯 Recommendation for GR Project

**Status:** ✅ **RECOMMENDED for future, but NOT urgent now**

**Rationale:**
- Dự án mới refactor xong
- Chưa có nhiều DTOs (chỉ có auth, artworks)
- API chưa finalize hết
- Có thể chưa có nhiều người

**Suggested Timeline:**
1. **Now:** Document this plan
2. **Week 2-3:** Khi có thêm 3-5 modules
3. **Week 4+:** Implement khi team > 2 người

**Quick Win Alternative:**
Thay vì shared package, có thể:
- Export types từ backend qua API docs (OpenAPI/Swagger)
- Frontend generate types từ OpenAPI spec
- Đơn giản hơn, ít complexity hơn

---

**Ready to implement when you decide! 🚀**
