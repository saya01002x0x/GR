# Hướng Dẫn Thiết Lập Environment Variables

## 📋 Tổng Quan

Dự án GR cần các biến môi trường để kết nối với các services và APIs. File này hướng dẫn chi tiết cách thiết lập.

## 🚀 Bắt Đầu Nhanh

### Bước 1: Khởi động Docker Services

```bash
# Từ thư mục root của project
docker-compose up -d
```

Services được khởi động:
- **PostgreSQL**: http://localhost:5432
- **Redis**: http://localhost:6379
- **Meilisearch**: http://localhost:7700
- **MinIO Console**: http://localhost:9001
- **Mailpit Web UI**: http://localhost:8025
- **pgAdmin**: http://localhost:5050

### Bước 2: Tạo File Environment

## 📁 Frontend Environment (frontend/.env)

Tạo file `frontend/.env` với nội dung sau:

```env
# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=development

# ============================================
# APPLICATION URL
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# CLERK AUTHENTICATION
# Đăng ký tại: https://clerk.com
# Dashboard: https://dashboard.clerk.com
# ============================================
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# BACKEND API
# ============================================
NEXT_PUBLIC_API_URL=http://localhost:3001

# ============================================
# SENTRY (Optional - Monitoring)
# Đăng ký tại: https://sentry.io
# ============================================
# NEXT_PUBLIC_SENTRY_DISABLED=true
# SENTRY_ORGANIZATION=your-org
# SENTRY_PROJECT=your-project
# SENTRY_AUTH_TOKEN=your-auth-token

# ============================================
# BETTER STACK (Optional - Logging)
# Đăng ký tại: https://betterstack.com
# ============================================
# NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=your-source-token
# NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST=in.logs.betterstack.com

# ============================================
# BUNDLE ANALYZER (Optional)
# ============================================
# ANALYZE=false
```

## 📁 Backend Environment (backend/.env)

Tạo file `backend/.env` với nội dung sau:

```env
# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=development
PORT=3001

# ============================================
# DATABASE (PostgreSQL)
# Chạy docker-compose up -d để start services
# Port 5433 để tránh conflict với PostgreSQL local (nếu có)
# ============================================
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/gr_development

# ============================================
# REDIS (Cache & Queue)
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# MEILISEARCH (Search Engine)
# Admin UI: http://localhost:7700
# ============================================
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey_change_in_production

# ============================================
# CLERK AUTHENTICATION
# Đăng ký tại: https://clerk.com
# Phải giống với CLERK_SECRET_KEY ở frontend
# ============================================
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# AWS S3 / MinIO (Object Storage)
# MinIO Console: http://localhost:9001
# Username: minioadmin / Password: minioadmin123
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
AWS_ENDPOINT=http://localhost:9000
AWS_BUCKET_NAME=gr-uploads
AWS_FORCE_PATH_STYLE=true

# ============================================
# SMTP / EMAIL (Mailpit cho development)
# Web UI: http://localhost:8025
# ============================================
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@gr-project.com

# ============================================
# RATE LIMITING (Optional)
# ============================================
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# ============================================
# CORS (Optional)
# ============================================
CORS_ORIGIN=http://localhost:3000

# ============================================
# PRISMA
# ============================================
# Uncomment nếu muốn disable telemetry
# CHECKPOINT_DISABLE=1
```

## 🔑 Lấy API Keys Bắt Buộc

### 1. Clerk Authentication (BẮT BUỘC)

Clerk là service quản lý authentication cho ứng dụng.

**Các bước:**

1. Truy cập: https://clerk.com
2. Đăng ký tài khoản miễn phí
3. Tạo một Application mới
4. Vào **API Keys** trong dashboard
5. Copy 2 keys sau:
   - `CLERK_SECRET_KEY` (Secret Key - dùng cho cả frontend và backend)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Publishable Key - dùng cho frontend)

**Lưu ý:** 
- `CLERK_SECRET_KEY` phải giống nhau ở cả frontend và backend
- Clerk có free tier đủ dùng cho development

### 2. Các Services Đã Có Sẵn (Không cần đăng ký)

Các services sau đã được setup trong Docker, không cần API key ngoài:

- ✅ **PostgreSQL** - Database
- ✅ **Redis** - Caching & Queue
- ✅ **Meilisearch** - Search Engine (dùng master key trong docker-compose.yml)
- ✅ **MinIO** - Object Storage (dùng credentials trong docker-compose.yml)
- ✅ **Mailpit** - Email testing (không cần credentials)

## 🎯 Các Services Optional

Bạn có thể bật các services này sau khi app chạy được:

### 1. Sentry (Monitoring & Error Tracking)

- URL: https://sentry.io
- Free tier: 5,000 errors/month
- Để disable: thêm `NEXT_PUBLIC_SENTRY_DISABLED=true` vào frontend/.env

### 2. Better Stack (Logging)

- URL: https://betterstack.com
- Free tier: 1GB logs/month
- Optional cho development

## ⚙️ Khởi Động Ứng Dụng

### 1. Start Docker Services

```bash
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend

# Cài đặt dependencies
npm install

# Chạy Prisma migrations (nếu có)
npx prisma migrate dev

# Khởi động backend
npm run start:dev
```

Backend sẽ chạy tại: http://localhost:3001

### 3. Setup Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Khởi động frontend
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## 🔍 Kiểm Tra Services

### PostgreSQL
```bash
# Sử dụng pgAdmin
http://localhost:5050
# Email: admin@admin.com / Password: admin
```

### Meilisearch
```bash
http://localhost:7700
# Master Key: masterKey_change_in_production
```

### MinIO Console
```bash
http://localhost:9001
# Username: minioadmin / Password: minioadmin123
```

### Mailpit (Email Testing)
```bash
http://localhost:8025
```

## 🐛 Troubleshooting

### Lỗi: "CLERK_SECRET_KEY is required"

**Giải pháp:** 
- Đăng ký Clerk tại https://clerk.com
- Lấy API keys từ dashboard
- Thêm vào file .env

### Lỗi: "Can't connect to database"

**Giải pháp:**
```bash
# Kiểm tra Docker services
docker-compose ps

# Restart services nếu cần
docker-compose restart postgres
```

### Lỗi: Port đã được sử dụng

**Giải pháp:**
- Đổi PORT trong .env file
- Hoặc stop service đang dùng port đó

### Lỗi: MinIO bucket not found

**Giải pháp:**
1. Truy cập MinIO Console: http://localhost:9001
2. Đăng nhập: minioadmin / minioadmin123
3. Tạo bucket mới tên `gr-uploads`

## 📝 Checklist Để Chạy Được

- [ ] Docker Desktop đã cài đặt và đang chạy
- [ ] Chạy `docker-compose up -d` thành công
- [ ] Đã đăng ký Clerk và có API keys
- [ ] Tạo file `frontend/.env` với Clerk keys
- [ ] Tạo file `backend/.env` với Clerk keys
- [ ] Backend chạy được tại http://localhost:3001
- [ ] Frontend chạy được tại http://localhost:3000
- [ ] Có thể truy cập trang sign-in

## 🎓 Tóm Tắt

**Để chạy được ngay, bạn CHỈ CẦN:**

1. ✅ Chạy Docker: `docker-compose up -d`
2. ✅ Đăng ký Clerk (FREE): https://clerk.com
3. ✅ Tạo 2 file .env như hướng dẫn ở trên
4. ✅ Thay `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` bằng Clerk API keys thật
5. ✅ Chạy backend: `cd backend && npm install && npm run start:dev`
6. ✅ Chạy frontend: `cd frontend && npm install && npm run dev`

**Các service khác (Sentry, Better Stack) là OPTIONAL, cài sau cũng được!**

## 🔗 Links Hữu Ích

- Clerk Dashboard: https://dashboard.clerk.com
- Clerk Docs: https://clerk.com/docs
- NestJS Docs: https://docs.nestjs.com
- Next.js Docs: https://nextjs.org/docs
- Mantine UI: https://mantine.dev

