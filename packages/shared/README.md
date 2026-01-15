# @gr/shared

Shared types, DTOs, and utilities for the GR project.

## 📦 What's Inside

- **DTOs** - Data Transfer Objects with validation (class-validator)
- **Types** - Common TypeScript interfaces and types
- **Constants** - Shared constants and enums

## 🚀 Usage

### In Backend (NestJS)

```typescript
import { CreateArtworkDto } from '@gr/shared';

@Post()
create(@Body() dto: CreateArtworkDto) {
  // Automatic validation via class-validator
}
```

### In Frontend (Next.js)

```typescript
import { CreateArtworkDto } from '@gr/shared';
import type { ApiResponse } from '@gr/shared';

// Type-safe API calls
const createArtwork = async (data: CreateArtworkDto) => {
  const response = await fetch('/api/artworks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json() as Promise<ApiResponse<Artwork>>;
};
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build once
pnpm build

# Watch mode (for development)
pnpm dev

# Clean build artifacts
pnpm clean
```

## 📝 Adding New DTOs

1. Create DTO file in `src/dtos/`
2. Export from `src/index.ts`
3. Run `pnpm build` (or watch mode will auto-rebuild)
4. DTOs are now available in backend & frontend!

## 🎯 Best Practices

- ✅ Use `class-validator` decorators for validation
- ✅ Export all public APIs from `src/index.ts`
- ✅ Keep DTOs simple and focused
- ✅ Document complex types with JSDoc
- ✅ Use `interface` for types, `class` for DTOs

## 🔄 Workflow

When API changes:
1. Update DTO in `packages/shared/src/dtos/`
2. TypeScript will show errors in both FE & BE
3. Fix errors → Guaranteed sync!

## 📚 Structure

```
packages/shared/
├── src/
│   ├── dtos/           # Data Transfer Objects
│   │   ├── auth/
│   │   ├── artworks/
│   │   └── users/
│   ├── types/          # TypeScript interfaces
│   │   └── index.ts
│   ├── constants/      # Shared constants
│   │   └── index.ts
│   └── index.ts        # Main export
├── dist/               # Compiled output (git-ignored)
├── package.json
├── tsconfig.json
└── README.md
```

---

**Single Source of Truth for your entire monorepo! 🎯**
