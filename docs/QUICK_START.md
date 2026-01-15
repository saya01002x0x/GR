# 🚀 Quick Start - GR Project (Hybrid Mode)

Hướng dẫn chạy dự án theo **Hybrid Mode** - cách chuẩn của Senior Dev!

## 🎯 Hybrid Mode là gì?

**🔹 Infrastructure (Postgres, Redis, MinIO...):** Chạy trong **Docker**  
**🔹 Code (Backend, Frontend):** Chạy trên **máy thật (localhost)**

**Tại sao?**
- ⚡ **Hot reload cực nhanh** (0.1s vs 3-5s trong Docker)
- 🐛 **Debug dễ dàng** với VS Code
- 💻 **Tận dụng RAM/CPU** máy tính
- 🚫 **Không lo lỗi** pnpm workspace + Docker

---

## ✅ Yêu Cầu

- [x] **Node.js >= 20** (https://nodejs.org)
- [x] **pnpm** (`npm install -g pnpm`)
- [x] **Docker Desktop** (https://www.docker.com)
- [x] **Git**

---

## 🎯 Bước 1: Clone & Install (1 phút)

```bash
# Clone repo
git clone <repo-url>
cd GR

# Install dependencies (workspace)
pnpm install

# Build shared package
cd packages/shared
pnpm build
cd ../..
```

---

## 🎯 Bước 2: Đăng Ký Clerk (2 phút)

1. Truy cập: **https://clerk.com**
2. Click **"Sign Up"** (miễn phí)
3. Tạo một **Application** mới
4. Vào **API Keys** trong dashboard
5. Copy 2 keys:
   - `CLERK_SECRET_KEY` (bắt đầu với `sk_test_...`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (bắt đầu với `pk_test_...`)

---

## 🎯 Bước 3: Setup Environment (1 phút)

### Tự động (Khuyến nghị):

**Windows (PowerShell):**
```powershell
.\setup-env.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-env.sh
./setup-env.sh
```

Script sẽ hỏi bạn nhập Clerk API keys, sau đó tự động tạo file `.env`.

### Thủ công (Nếu cần):

**Backend `.env`:**
```bash
# backend/.env
CLERK_SECRET_KEY=sk_test_xxxxx
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/gr_development
REDIS_URL=redis://localhost:6379
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey_change_in_production
AWS_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
```

**Frontend `.env`:**
```bash
# frontend/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🎯 Bước 4: Start Infrastructure (1 phút)

```bash
# Start Postgres, Redis, MinIO, Meilisearch, Mailpit, pgAdmin
docker-compose up -d

# Kiểm tra
docker-compose ps
```

**Tất cả services phải "Up (healthy)":**
- ✅ `gr-postgres` (port 5433)
- ✅ `gr-redis` (port 6379)
- ✅ `gr-minio` (port 9000, 9001)
- ✅ `gr-meilisearch` (port 7700)
- ✅ `gr-mailpit` (port 1025, 8025)
- ✅ `gr-pgadmin` (port 5050)

---

## 🎯 Bước 5: Start Backend (Local)

Mở **Terminal mới**:

```bash
cd backend
pnpm dev
```

**Chờ xuất hiện:**
```
[Nest] Nest application successfully started
```

Backend sẽ chạy tại: **http://localhost:3001**

---

## 🎯 Bước 6: Start Frontend (Local)

Mở **Terminal mới**:

```bash
cd frontend
pnpm dev
```

**Chờ xuất hiện:**
```
✓ Ready in 2s
```

Frontend sẽ chạy tại: **http://localhost:3000**

---

## 🎉 Xong! Truy cập ứng dụng

### 🌐 URLs:

| Service | URL | Mô tả |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | Next.js App |
| **Backend API** | http://localhost:3001 | NestJS API |
| **pgAdmin** | http://localhost:5050 | Quản lý Database |
| **MinIO Console** | http://localhost:9001 | Quản lý Storage |
| **Mailpit** | http://localhost:8025 | Xem Email Test |
| **Meilisearch** | http://localhost:7700 | Search Engine |

---

## 🔄 Development Workflow

### Cấu trúc Terminal:

```
Terminal 1: docker-compose logs -f    (Xem logs Infrastructure)
Terminal 2: cd backend && pnpm dev    (Backend dev server)
Terminal 3: cd frontend && pnpm dev   (Frontend dev server)
Terminal 4: (Chạy lệnh khác)
```

### Khi sửa code:

1. **Sửa file `.ts`/`.tsx`** → Lưu (Ctrl+S)
2. **Backend/Frontend tự động reload** (~0.1s)
3. **Refresh browser** → Thấy thay đổi ngay!

### Khi sửa Shared Package:

```bash
# Terminal riêng cho shared package
cd packages/shared
pnpm dev  # Watch mode

# Backend & Frontend sẽ tự detect và reload!
```

---

## 🐛 Troubleshooting

### ❌ Lỗi: "Cannot find module '@gr/shared'"

**Nguyên nhân:** Shared package chưa được build.

**Giải pháp:**
```bash
cd packages/shared
pnpm build
cd ../..
pnpm install
```

---

### ❌ Lỗi: "CLERK_SECRET_KEY is required"

**Nguyên nhân:** Chưa có Clerk API keys trong `.env`.

**Giải pháp:**
```bash
# Chạy lại setup script
.\setup-env.ps1  # Windows
./setup-env.sh   # Linux/Mac
```

---

### ❌ Backend không kết nối được Postgres

**Nguyên nhân:** Postgres chưa chạy hoặc dùng sai port.

**Giải pháp:**
```bash
# Kiểm tra Docker
docker-compose ps

# Port phải là 5433 (không phải 5432!)
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/gr_development
```

---

### ❌ Frontend báo lỗi Clerk

**Nguyên nhân:** Thiếu `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

**Giải pháp:**
```bash
# Kiểm tra frontend/.env.local
cat frontend/.env.local

# Phải có:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

---

### ❌ Hot reload không hoạt động

**Giải pháp:**

**Backend (NestJS):**
```bash
cd backend
# Ctrl+C để dừng
pnpm dev  # Start lại
```

**Frontend (Next.js):**
```bash
cd frontend
# Ctrl+C để dừng
pnpm dev  # Start lại
```

---

## 🛑 Dừng Services

### Dừng Code (Backend/Frontend):

Nhấn **Ctrl+C** trong terminal đang chạy `pnpm dev`.

### Dừng Infrastructure (Docker):

```bash
# Dừng tất cả containers
docker-compose stop

# Dừng + Xóa containers (giữ data)
docker-compose down

# Dừng + Xóa containers + volumes (XÓA DATA!)
docker-compose down -v
```

---

## 📝 Lệnh Hữu Ích

### Docker:

```bash
# Xem logs tất cả services
docker-compose logs -f

# Xem logs một service
docker-compose logs -f postgres

# Restart một service
docker-compose restart postgres

# Xem trạng thái
docker-compose ps
```

### Workspace (pnpm):

```bash
# Install dependencies (root)
pnpm install

# Run command trong workspace
pnpm -r build    # Build tất cả packages
pnpm -r test     # Test tất cả packages

# Clean cache
pnpm store prune
```

### Backend:

```bash
cd backend

pnpm dev         # Development
pnpm build       # Build production
pnpm start:prod  # Run production

pnpm lint        # Lint code
pnpm test        # Run tests
```

### Frontend:

```bash
cd frontend

pnpm dev         # Development
pnpm build       # Build production
pnpm start       # Run production

pnpm lint        # Lint code
pnpm test        # Run tests
```

---

## 📚 Các Docs Khác

- [🔐 Clerk Setup](./CLERK_SETUP.md) - Chi tiết về Authentication
- [🧪 Testing](./TESTING_QUICK_START.md) - Hướng dẫn test API
- [📦 Shared Package](./SHARED_PACKAGE.md) - Dùng @gr/shared
- [🏗️ NestJS Modules](./HOWTO_NESTJS_MODULES.md) - Tạo modules mới
- [📖 API Keys](./API_KEYS.md) - Đăng ký các API keys
- [🔍 Setup Checklist](./SETUP_CHECKLIST.md) - Checklist đầy đủ

---

## 🎓 Tại sao KHÔNG chạy Backend/Frontend trong Docker?

**❌ Nếu chạy trong Docker (Development):**
- 🐌 Hot reload chậm (3-5s)
- 😭 Debug khó khăn
- 🔥 pnpm workspace + Docker = Địa ngục
- 💾 Tốn RAM/CPU cho nhiều container

**✅ Hybrid Mode:**
- ⚡ Hot reload siêu nhanh (0.1s)
- 🐛 Debug dễ dàng (VS Code breakpoints work!)
- 💻 Tận dụng 100% sức mạnh máy
- 🎯 Infrastructure độc lập, dễ quản lý

**📝 Note:** Dockerfile vẫn giữ nguyên cho **Production deployment**!

---

## 🚀 Next Steps

1. ✅ Đọc [NestJS Modules Guide](./HOWTO_NESTJS_MODULES.md) để tạo features mới
2. ✅ Đọc [Shared Package](./SHARED_PACKAGE.md) để hiểu cách dùng DTOs
3. ✅ Đọc [Testing Guide](./TESTING_QUICK_START.md) để test API với Clerk
4. ✅ Explore code trong `backend/src/` và `frontend/src/`

**Happy Coding! 🎉**