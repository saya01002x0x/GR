# 🔄 Migration Guide - Working with New Backend Structure

## 🎯 Quick Reference

### Old vs New Paths

| What | Old Path | New Path |
|------|----------|----------|
| **Decorators** | `src/decorators/` | `src/common/decorators/` |
| **Auth Module** | `src/auth/` | `src/modules/auth/` |
| **Artworks** | `src/artworks/` | `src/modules/artworks/` |
| **Config** | (None) | `src/config/` |
| **Database** | (None) | `src/database/` (coming soon) |

---

## 📝 Import Path Updates

### Decorators

```typescript
// ❌ Old
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';

// ✅ New
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
```

### Modules

```typescript
// ❌ Old (in app.module.ts)
import { AuthModule } from './auth/auth.module';
import { ArtworksController } from './artworks/artworks.controller';

// ✅ New
import { AuthModule } from './modules/auth/auth.module';
import { ArtworksController } from './modules/artworks/artworks.controller';
```

---

## 🚀 Creating New Features

### Before (Old Way)

```bash
# Generate at root level
npx nest g module feature-name
npx nest g controller feature-name
npx nest g service feature-name
```

### After (New Way)

```bash
# Generate inside modules/
docker exec gr-backend npx nest g module modules/feature-name
docker exec gr-backend npx nest g controller modules/feature-name
docker exec gr-backend npx nest g service modules/feature-name
```

---

## ⚙️ Using Configuration

### Before (Old Way)

```typescript
// Direct env access (not validated)
const clerkKey = process.env.CLERK_SECRET_KEY;
```

### After (New Way)

```typescript
// Type-safe & validated
constructor(private configService: ConfigService) {}

doSomething() {
  const clerkKey = this.configService.get('clerk.secretKey');
  const port = this.configService.get<number>('port');
}
```

---

## 🗄️ Database Access (Coming Soon)

### Future Pattern

```typescript
// Will be @Global() - no need to import PrismaModule
@Module({
  controllers: [UsersController],
  providers: [UsersService],  // PrismaService auto-available
})
export class UsersModule {}
```

---

## ✅ Checklist for New Features

When creating a new feature module:

- [ ] Use `npx nest g module modules/your-feature`
- [ ] Create in `src/modules/your-feature/`
- [ ] Use decorators from `src/common/decorators/`
- [ ] Use ConfigService for env vars
- [ ] Add DTOs in `dto/` subfolder
- [ ] Document with JSDoc comments
- [ ] Add tests

---

## 🎓 Examples

See working examples:
- **Auth Module:** `src/modules/auth/`
- **Artworks Module:** `src/modules/artworks/`
- **Config Setup:** `src/config/`

---

## 📖 Full Docs

- [Backend README](../backend/src/README.md) - Architecture overview
- [HOWTO NestJS](./HOWTO_NESTJS_MODULES.md) - Best practices
- [Refactoring Log](./REFACTORING_LOG.md) - What changed

---

**Questions?** Check the examples or read the official [NestJS docs](https://docs.nestjs.com)!
