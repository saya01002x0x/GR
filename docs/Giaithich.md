# Project Logic & Decisions

Ghi chú các quyết định thiết kế và logic của dự án.

---

### [31/01] - Auth Pages Layout

- **Logic:** Layout 2 cột cho sign-in/sign-up: artwork hero bên trái, Clerk component bên phải
- **Decision:** Dùng Clerk component trực tiếp (`<SignIn />`, `<SignUp />`) thay vì build form từ đầu để tiết kiệm thời gian và đảm bảo security
- **Files:**
  - `frontend/src/components/auth/AuthPageLayout.tsx` - Layout wrapper 2 cột
  - `frontend/src/app/[locale]/(auth)/(center)/sign-in/` - Trang đăng nhập
  - `frontend/src/app/[locale]/(auth)/(center)/sign-up/` - Trang đăng ký

### [31/01] - Clerk JWT Verification (Backend)

- **Logic:** Backend verify JWT token từ Clerk để authenticate API requests
- **Decision:** Sử dụng `@clerk/backend` với `verifyToken()` và `users.getUser()` để lấy thông tin user
- **Files:**
  - `backend/src/modules/auth/strategies/clerk.strategy.ts` - Passport strategy với real JWT verification
  - `backend/src/modules/auth/providers/clerk-client.provider.ts` - Clerk client provider
  - `backend/src/common/decorators/current-user.decorator.ts` - Decorator lấy user từ request

### [31/01] - Post-Login Redirect

- **Logic:** Sau khi đăng nhập thành công, redirect user đến trang Discover
- **Decision:** Thay đổi `signInFallbackRedirectUrl` từ `/dashboard` sang `/discover` trong ClerkProvider
- **Files:**
  - `frontend/src/app/[locale]/(auth)/layout.tsx` - Auth layout với ClerkProvider config

### [31/01] - Database Schema (Prisma + PostgreSQL)

- **Logic:** Thiết kế database cho ArtSpace - Pixiv-style artwork platform
- **Decision:**
  - **User sync với Clerk:** Dùng Clerk Webhook để tự động tạo User trong DB khi đăng ký
  - **Artwork images:** Tách riêng `ArtworkImage` để hỗ trợ nhiều ảnh/page per artwork (Manga style)
  - **Content Rating:** Dùng enum `SAFE/R18/R18G` thay vì visibility
  - **Bookmark + Collection:** Cho phép 1 artwork nằm trong nhiều collections của cùng user
  - **Follow:** Self-referencing many-to-many qua bảng `Follow`
- **Files:**
  - `backend/prisma/schema.prisma` - Database schema
  - `backend/src/database/prisma.service.ts` - Prisma Service
  - `backend/src/database/prisma.module.ts` - Global Prisma Module
