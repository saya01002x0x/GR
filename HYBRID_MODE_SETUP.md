# ✅ Setup Hoàn Tất - Hybrid Mode

## 🎉 Chúc mừng! Bạn đã setup thành công dự án GR với Hybrid Mode!

---

## 📋 Tóm Tắt Những Gì Đã Làm

### 1. ✅ Shared Package (@gr/shared)
- Tạo `packages/shared/` với DTOs, types, constants
- Link vào `backend` và `frontend`
- Backend có thể dùng `CreateArtworkDto` từ `@gr/shared`
- Frontend có thể dùng cùng DTOs cho type-safe API calls

### 2. ✅ Docker Compose - Infrastructure Only
- **REMOVED**: Backend & Frontend services khỏi Docker
- **KEPT**: Postgres, Redis, MinIO, Meilisearch, Mailpit, pgAdmin
- Lý do: Hot reload nhanh hơn, debug dễ hơn, không lo lỗi pnpm workspace

### 3. ✅ Dockerfiles Giữ Nguyên
- `backend/Dockerfile` - Dùng cho Production deployment
- `frontend/Dockerfile` - Dùng cho Production deployment  
- Dùng pnpm trong Docker để support workspace

### 4. ✅ Documentation
- `docs/QUICK_START.md` - Hướng dẫn chạy Hybrid Mode
- `docs/SHARED_PACKAGE.md` - Chi tiết về @gr/shared
- `docs/CLERK_SETUP.md` - Đã có từ trước
- `docs/HOWTO_NESTJS_MODULES.md` - Đã có từ trước

---

## 🚀 Cách Chạy Dự Án (Hybrid Mode)

### Terminal 1: Infrastructure (Docker)
```bash
docker-compose up -d
docker-compose logs -f
```

### Terminal 2: Backend (Local)
```bash
cd backend
pnpm start:dev
```
**URL**: http://localhost:3001

### Terminal 3: Frontend (Local)
```bash
cd frontend
pnpm dev
```
**URL**: http://localhost:3000

### Terminal 4: Shared Package (Watch mode - Nếu cần)
```bash
cd packages/shared
pnpm dev  # tsc --watch
```

---

## 📊 Services Available

| Service | URL | Username/Password |
|---------|-----|-------------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:3001 | - |
| **Postgres** | localhost:5433 | postgres/postgres |
| **pgAdmin** | http://localhost:5050 | admin@admin.com / admin |
| **Redis** | localhost:6379 | - |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin123 |
| **Meilisearch** | http://localhost:7700 | Key: masterKey_change_in_production |
| **Mailpit** | http://localhost:8025 | - |

---

## 🧪 Test Backend API

### 1. Public Endpoint (Không cần auth)
```bash
curl http://localhost:3001/artworks
```

**Expected Response:**
```json
{
  "message": "List all artworks (public)",
  "data": []
}
```

### 2. Protected Endpoint (Cần Clerk token)
```bash
# Get token từ Clerk dashboard hoặc frontend
curl http://localhost:3001/artworks/me \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

---

## 📝 Development Workflow

### Khi Sửa Backend Code:
1. Edit file trong `backend/src/`
2. Lưu file (Ctrl+S)
3. NestJS tự động compile (~1-2s)
4. Test API bằng cURL/Thunder Client

### Khi Sửa Frontend Code:
1. Edit file trong `frontend/src/`
2. Lưu file (Ctrl+S)
3. Next.js tự động reload (~0.1s)
4. Refresh browser

### Khi Sửa Shared Package:
1. Edit file trong `packages/shared/src/`
2. Lưu file (Ctrl+S)
3. Nếu đang chạy `pnpm dev` trong shared → Tự động build
4. Backend & Frontend tự detect và reload

---

## 🎯 Các Tính Năng Đã Setup

### ✅ Backend (NestJS)
- [x] ConfigModule với env validation (Joi)
- [x] Clerk Authentication & Authorization
- [x] Role-based Access Control (RBAC)
- [x] @CurrentUser decorator
- [x] @Roles decorator
- [x] Example ArtworksController
- [x] Shared DTOs từ @gr/shared
- [x] Clean architecture (src/modules/, src/common/, src/config/)

### ✅ Frontend (Next.js)
- [x] Clerk Authentication setup
- [x] Example usage của @gr/shared
- [x] Type-safe API calls
- [x] Ready để tích hợp backend

### ✅ Infrastructure (Docker)
- [x] PostgreSQL 17
- [x] Redis
- [x] MinIO (S3-compatible storage)
- [x] Meilisearch (Search engine)
- [x] Mailpit (Email testing)
- [x] pgAdmin (Database GUI)

---

## 📚 Next Steps

### 1. Setup Database (Prisma)
```bash
cd backend
npx prisma init
# Edit schema.prisma
npx prisma migrate dev
npx prisma generate
```

### 2. Tạo Module Mới
Đọc: `docs/HOWTO_NESTJS_MODULES.md`

```bash
cd backend
nest g module users
nest g controller users
nest g service users
```

### 3. Test Authentication
Đọc: `docs/TESTING_QUICK_START.md`

### 4. Thêm DTOs Mới
Đọc: `docs/SHARED_PACKAGE.md`

```bash
# Tạo DTO trong packages/shared/src/dtos/
# Build shared package
cd packages/shared
pnpm build
```

---

## 🐛 Common Issues

### Backend báo lỗi "Cannot find module '@gr/shared'"
```bash
cd packages/shared
pnpm build
cd ../..
pnpm install
```

### Hot reload không hoạt động
```bash
# Restart service
cd backend  # hoặc frontend
# Ctrl+C
pnpm start:dev  # hoặc pnpm dev
```

### Postgres connection refused
```bash
# Check Docker
docker-compose ps
docker-compose logs postgres

# Backend phải dùng port 5433, không phải 5432!
# backend/.env:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5433/gr_development
```

---

## 🎓 Tài Liệu Tham Khảo

- **NestJS**: https://docs.nestjs.com
- **Next.js**: https://nextjs.org/docs
- **Clerk**: https://clerk.com/docs
- **Prisma**: https://www.prisma.io/docs
- **pnpm workspace**: https://pnpm.io/workspaces
- **class-validator**: https://github.com/typestack/class-validator

---

## 💡 Tại Sao Hybrid Mode?

### ❌ Nếu chạy tất cả trong Docker:
- 🐌 Hot reload chậm (3-5s mỗi lần save)
- 😭 Debug khó khăn (phải attach debugger qua port)
- 🔥 pnpm workspace + Docker symlinks = Địa ngục
- 💾 Tốn RAM cho nhiều containers

### ✅ Với Hybrid Mode:
- ⚡ Hot reload siêu nhanh (0.1-1s)
- 🐛 Debug dễ dàng (VS Code breakpoints work ngay!)
- 💻 Tận dụng 100% sức mạnh CPU/RAM máy
- 🎯 Infrastructure độc lập, cleanup dễ dàng

### 📝 Dockerfile Vẫn Quan Trọng!

Dockerfiles không bị xóa, vẫn dùng cho:
- **Production deployment** (Docker/Kubernetes)
- **CI/CD pipelines**
- **Testing trong môi trường isolated**

---

## 🚀 Ready to Code!

Bạn đã có:
- ✅ Infrastructure chạy trong Docker
- ✅ Backend chạy local (http://localhost:3001)
- ✅ Frontend chạy local (http://localhost:3000)
- ✅ Shared package type-safe
- ✅ Clerk authentication ready
- ✅ Hot reload cực nhanh
- ✅ Debug dễ dàng

**Happy Coding! 🎉**

---

**📌 Ghi Nhớ:**
- Docker cho **Infrastructure**
- Local cho **Code**
- Dockerfile cho **Production**

Đây là cách mà **Senior Devs thực chiến** làm việc hàng ngày! 🎯
