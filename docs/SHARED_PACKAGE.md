# 📦 Shared Package (@gr/shared)

## 🎯 Tổng quan

`@gr/shared` là package dùng chung giữa **Backend** (NestJS) và **Frontend** (Next.js) trong monorepo.

**Mục đích:**
- ✅ **Single Source of Truth**: Định nghĩa DTOs, Types, Constants ở một chỗ
- ✅ **Type Safety**: Frontend và Backend luôn sync với nhau
- ✅ **Validation Shared**: Dùng chung `class-validator` cho cả 2 phía
- ✅ **Refactor An Toàn**: Sửa DTO 1 lần, TypeScript báo lỗi ở tất cả nơi dùng

---

## 📁 Cấu trúc

```
packages/shared/
├── src/
│   ├── dtos/           # Data Transfer Objects (có validation)
│   │   └── artwork.dto.ts
│   ├── types/          # TypeScript types & interfaces
│   │   └── index.ts
│   ├── constants/      # Constants shared
│   │   └── index.ts
│   └── index.ts        # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Cách sử dụng

### 1️⃣ Trong Backend (NestJS)

**Import DTO với validation:**

```typescript
// backend/src/modules/artworks/artworks.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CreateArtworkDto } from '@gr/shared';

@Controller('artworks')
export class ArtworksController {
  @Post()
  create(@Body() dto: CreateArtworkDto) {
    // dto đã được validate tự động bởi NestJS ValidationPipe
    return { message: 'Created', data: dto };
  }
}
```

**ValidationPipe tự động validate:**

```typescript
// backend/src/main.ts
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

---

### 2️⃣ Trong Frontend (Next.js)

**Import DTO để type-safe API calls:**

```typescript
// frontend/src/lib/api/artworks.ts
import { CreateArtworkDto, ARTWORK_STATUS } from '@gr/shared';

export async function createArtwork(data: CreateArtworkDto) {
  const response = await fetch('/api/artworks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

**Trong React Component:**

```typescript
'use client';
import { useState } from 'react';
import { CreateArtworkDto, ARTWORK_STATUS } from '@gr/shared';

export function CreateArtworkForm() {
  const [formData, setFormData] = useState<CreateArtworkDto>({
    title: '',
    description: '',
    tags: [],
    status: ARTWORK_STATUS.DRAFT,
  });

  // TypeScript sẽ báo lỗi nếu thiếu field hoặc sai type!
}
```

---

## ✍️ Thêm DTO mới

### Bước 1: Tạo file DTO

```typescript
// packages/shared/src/dtos/user.dto.ts
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string; // Optional
}
```

### Bước 2: Export trong index.ts

```typescript
// packages/shared/src/index.ts
export * from './dtos/artwork.dto';
export * from './dtos/user.dto'; // ← Thêm dòng này
export * from './types';
export * from './constants';
```

### Bước 3: Build shared package

```bash
cd packages/shared
pnpm build
```

### Bước 4: Sử dụng ngay!

```typescript
// Backend
import { CreateUserDto } from '@gr/shared';

// Frontend
import { CreateUserDto } from '@gr/shared';
```

---

## 🔄 Development Workflow

### Khi sửa Shared Package:

```bash
# Terminal 1: Watch mode cho shared package
cd packages/shared
pnpm dev  # tsc --watch

# Terminal 2: Backend tự động reload
cd backend
pnpm dev

# Terminal 3: Frontend tự động reload
cd frontend
pnpm dev
```

**Luồng làm việc:**
1. Sửa file trong `packages/shared/src/`
2. TypeScript compiler tự động build → `packages/shared/dist/`
3. Backend & Frontend detect thay đổi → Auto reload!

---

## 📝 Best Practices

### ✅ NÊN:

- **Export cả DTO class và Type:**
  ```typescript
  export class CreateArtworkDto { ... }
  export type CreateArtwork = CreateArtworkDto; // Type cho FE nếu cần
  ```

- **Dùng `class-validator` decorators:**
  ```typescript
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;
  ```

- **Dùng `!` (definite assignment) cho required fields:**
  ```typescript
  title!: string;  // Required
  description?: string; // Optional
  ```

### ❌ KHÔNG NÊN:

- **❌ Import business logic vào shared:**
  ```typescript
  // KHÔNG làm thế này!
  import { PrismaClient } from '@prisma/client'; // ❌ Backend-only
  ```

- **❌ Export React components:**
  ```typescript
  // Shared chỉ chứa DTOs, types, constants - KHÔNG có UI!
  export const Button = () => <button>Click</button>; // ❌
  ```

- **❌ Hardcode URLs, secrets:**
  ```typescript
  // ❌ KHÔNG
  export const API_URL = 'http://localhost:3001';
  
  // ✅ NÊN - dùng constants generic
  export const DEFAULT_PAGE_SIZE = 20;
  ```

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module '@gr/shared'"

**Nguyên nhân:** Package chưa được build hoặc link.

**Cách fix:**
```bash
# 1. Build shared package
cd packages/shared
pnpm build

# 2. Reinstall workspace
cd ../..
pnpm install
```

---

### Lỗi: "Property 'xxx' has no initializer"

**Nguyên nhân:** TypeScript strict mode yêu cầu khởi tạo giá trị.

**Cách fix:**
```typescript
// ❌ Lỗi
class MyDto {
  title: string;
}

// ✅ Fix 1: Dùng !
class MyDto {
  title!: string;
}

// ✅ Fix 2: Optional
class MyDto {
  title?: string;
}

// ✅ Fix 3: Default value
class MyDto {
  title: string = '';
}
```

---

### Backend không nhận thay đổi từ Shared

**Cách fix:**
```bash
# Restart NestJS dev server
cd backend
# Ctrl+C
pnpm dev
```

---

## 📚 Tham khảo

- **class-validator**: https://github.com/typestack/class-validator
- **class-transformer**: https://github.com/typestack/class-transformer
- **NestJS Validation**: https://docs.nestjs.com/techniques/validation
- **pnpm workspace**: https://pnpm.io/workspaces

---

## 🎓 Ví dụ thực tế

Xem file: `frontend/src/examples/shared-package-usage.tsx` để biết cách dùng chi tiết!

---

**🔥 Lợi ích thực chiến:**

Khi Backend thay đổi API (thêm/xóa field), Frontend sẽ **BÁO LỖI NGAY** khi compile!

```typescript
// Backend sửa DTO
export class CreateArtworkDto {
  title!: string;
  // description: string;  ← XÓA field này
}

// Frontend compile ERROR:
// Property 'description' does not exist on type 'CreateArtworkDto'
```

→ **Không bao giờ quên update Frontend khi Backend thay đổi!** 🎯
