# ✅ Setup Checklist - GR Project

Checklist này giúp bạn theo dõi quá trình setup dự án từng bước một.

## 📋 Pre-requisites

- [ ] Node.js >= 20 đã được cài đặt
  ```bash
  node --version  # Kiểm tra version
  ```

- [ ] Docker Desktop đã được cài đặt và đang chạy
  ```bash
  docker --version
  docker-compose --version
  ```

- [ ] Git đã được cài đặt
  ```bash
  git --version
  ```

- [ ] Code editor (VS Code, Cursor, etc.)

## 🔐 API Keys & Accounts

### 1. Clerk (BẮT BUỘC)

- [ ] Đã đăng ký tài khoản tại https://clerk.com
- [ ] Đã tạo Application mới
- [ ] Đã lấy được `CLERK_SECRET_KEY` (sk_test_...)
- [ ] Đã lấy được `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_test_...)

**Hướng dẫn chi tiết:**
1. Vào: https://dashboard.clerk.com
2. Click "Create Application"
3. Chọn template (hoặc skip)
4. Vào "API Keys" tab
5. Copy 2 keys

### 2. Sentry (OPTIONAL - Monitoring)

- [ ] Đã đăng ký tài khoản tại https://sentry.io (hoặc skip)
- [ ] Đã tạo Project (hoặc skip)
- [ ] Đã lấy được credentials (hoặc disable trong .env)

**Để disable:** Thêm `NEXT_PUBLIC_SENTRY_DISABLED=true` vào frontend/.env

### 3. Better Stack (OPTIONAL - Logging)

- [ ] Đã đăng ký tại https://betterstack.com (hoặc skip)
- [ ] Đã lấy được Source Token (hoặc skip)

**Có thể bỏ qua trong development**

## 🐳 Docker Services

- [ ] Docker Desktop đang chạy

- [ ] Đã chạy `docker-compose up -d`
  ```bash
  cd c:\Khac\Project\GR
  docker-compose up -d
  ```

- [ ] Kiểm tra tất cả services đang chạy:
  ```bash
  docker-compose ps
  ```
  
  **Expected output:**
  ```
  gr-postgres      running
  gr-redis         running
  gr-meilisearch   running
  gr-minio         running
  gr-mailpit       running
  gr-pgadmin       running
  ```

- [ ] Test truy cập các services:
  - [ ] PostgreSQL: `localhost:5432` (dùng pgAdmin hoặc psql)
  - [ ] Redis: `localhost:6379`
  - [ ] Meilisearch: http://localhost:7700
  - [ ] MinIO Console: http://localhost:9001
  - [ ] Mailpit UI: http://localhost:8025
  - [ ] pgAdmin: http://localhost:5050

## 📝 Environment Files

### Cách 1: Tự Động (Khuyến nghị)

- [ ] Đã chạy script setup:
  - Windows: `.\setup-env.ps1`
  - Linux/Mac: `./setup-env.sh`

- [ ] Script đã tạo thành công:
  - [ ] `frontend/.env`
  - [ ] `backend/.env`

### Cách 2: Thủ Công

- [ ] Đã copy `frontend/env.template` thành `frontend/.env`
- [ ] Đã thay thế Clerk keys trong `frontend/.env`
- [ ] Đã copy `backend/env.template` thành `backend/.env`
- [ ] Đã thay thế Clerk keys trong `backend/.env`

### Kiểm Tra Files

- [ ] File `frontend/.env` tồn tại và chứa:
  ```env
  CLERK_SECRET_KEY=sk_test_... (không phải xxx)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... (không phải xxx)
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

- [ ] File `backend/.env` tồn tại và chứa:
  ```env
  PORT=3001
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gr_development
  CLERK_SECRET_KEY=sk_test_... (giống frontend)
  ```

## 🗄️ Database Setup

- [ ] PostgreSQL container đang chạy

- [ ] (Optional) Truy cập pgAdmin:
  - URL: http://localhost:5050
  - Email: admin@admin.com
  - Password: admin

- [ ] (Optional) Connect pgAdmin với PostgreSQL:
  - Host: gr-postgres (hoặc localhost)
  - Port: 5432
  - Database: gr_development
  - Username: postgres
  - Password: postgres

- [ ] Backend đã có Prisma schema (nếu có)

- [ ] Đã chạy Prisma migrations (nếu có):
  ```bash
  cd backend
  npx prisma migrate dev
  ```

## 🔧 Backend Setup

- [ ] Đã cd vào thư mục backend:
  ```bash
  cd backend
  ```

- [ ] Đã cài đặt dependencies:
  ```bash
  npm install
  ```

- [ ] Không có lỗi trong quá trình install

- [ ] File `.env` đã được tạo và có đầy đủ keys

- [ ] (Optional) Đã chạy Prisma generate:
  ```bash
  npx prisma generate
  ```

- [ ] Đã khởi động backend:
  ```bash
  npm run start:dev
  ```

- [ ] Backend chạy thành công tại http://localhost:3001

- [ ] Kiểm tra logs không có lỗi critical

- [ ] (Optional) Test API health endpoint:
  ```bash
  curl http://localhost:3001
  # Hoặc mở browser: http://localhost:3001
  ```

## 💻 Frontend Setup

- [ ] Mở terminal mới (giữ backend đang chạy)

- [ ] Đã cd vào thư mục frontend:
  ```bash
  cd frontend
  ```

- [ ] Đã cài đặt dependencies:
  ```bash
  npm install
  ```

- [ ] Không có lỗi trong quá trình install

- [ ] File `.env` đã được tạo và có đầy đủ keys

- [ ] Đã khởi động frontend:
  ```bash
  npm run dev
  ```

- [ ] Frontend chạy thành công tại http://localhost:3000

- [ ] Kiểm tra logs không có lỗi critical

## 🧪 Testing

### Frontend

- [ ] Mở browser: http://localhost:3000

- [ ] Trang web load được (không báo lỗi)

- [ ] Clerk authentication UI hiển thị

- [ ] Click "Sign In" -> Clerk modal mở ra

- [ ] Thử sign up với email test

- [ ] Check email tại Mailpit: http://localhost:8025

- [ ] Verify email và hoàn tất sign up

- [ ] Đăng nhập thành công

### Backend

- [ ] Backend API response được:
  ```bash
  curl http://localhost:3001
  ```

- [ ] (Optional) Swagger/API docs available:
  ```
  http://localhost:3001/api
  ```

### Docker Services

- [ ] MinIO Console accessible:
  - URL: http://localhost:9001
  - Login: minioadmin / minioadmin123
  - [ ] Tạo bucket `gr-uploads` (nếu chưa có)

- [ ] Mailpit accessible:
  - URL: http://localhost:8025
  - [ ] Có thể xem emails test

- [ ] Meilisearch accessible:
  - URL: http://localhost:7700

## 🎉 Final Check

- [ ] ✅ Docker services: Running
- [ ] ✅ Backend: Running on port 3001
- [ ] ✅ Frontend: Running on port 3000
- [ ] ✅ Clerk authentication: Working
- [ ] ✅ Database connection: OK
- [ ] ✅ Redis connection: OK
- [ ] ✅ MinIO/S3: Accessible
- [ ] ✅ Email testing: Working

## 🐛 Troubleshooting

### ❌ Docker services không chạy

**Kiểm tra:**
```bash
docker-compose ps
docker-compose logs [service_name]
```

**Fix:**
```bash
docker-compose down
docker-compose up -d
```

### ❌ Backend báo lỗi "Cannot connect to database"

**Kiểm tra:**
1. PostgreSQL container có đang chạy không?
2. DATABASE_URL trong .env đúng chưa?

**Fix:**
```bash
docker-compose restart postgres
```

### ❌ Frontend báo lỗi "CLERK_SECRET_KEY is required"

**Kiểm tra:**
1. File `frontend/.env` có tồn tại không?
2. Clerk keys có đúng format không? (sk_test_... và pk_test_...)

**Fix:**
Chạy lại script: `.\setup-env.ps1`

### ❌ Port already in use

**Kiểm tra port nào bị conflict:**
```powershell
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process bằng PID hoặc đổi port trong .env
```

### ❌ npm install báo lỗi

**Fix:**
```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install

# Hoặc dùng pnpm
pnpm install
```

## 📞 Support

Nếu vẫn gặp vấn đề sau khi follow checklist:

1. 📖 Đọc [ENV_SETUP.md](./ENV_SETUP.md) để hiểu chi tiết
2. 📖 Đọc [QUICK_START.md](./QUICK_START.md)
3. 🔍 Check logs của services:
   ```bash
   docker-compose logs -f
   ```
4. 💬 Liên hệ team

## 🎓 Next Steps

Sau khi hoàn thành checklist:

- [ ] Đọc codebase structure
- [ ] Tìm hiểu về Clerk authentication flow
- [ ] Thử tạo API endpoint mới
- [ ] Thử tạo page mới trong frontend
- [ ] Setup AI service (coming soon)

---

**Chúc mừng! Bạn đã setup xong dự án! 🎉**

