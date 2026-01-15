# 🚀 Quick Start - GR Project

Hướng dẫn nhanh để chạy được dự án trong vòng 5 phút!

## ✅ Yêu Cầu

- [x] Node.js >= 20
- [x] Docker Desktop
- [x] Git

## 🎯 Bước 1: Đăng Ký Clerk (2 phút)

1. Truy cập: **https://clerk.com**
2. Click **"Sign Up"** (miễn phí)
3. Tạo một **Application** mới
4. Vào **API Keys** trong dashboard
5. Copy 2 keys:
   - `CLERK_SECRET_KEY` (bắt đầu với `sk_test_...`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (bắt đầu với `pk_test_...`)

## 🎯 Bước 2: Setup Environment (1 phút)

### Windows (PowerShell):

```powershell
.\setup-env.ps1
```

### Linux/Mac:

```bash
chmod +x setup-env.sh
./setup-env.sh
```

Script sẽ hỏi bạn nhập 2 Clerk API keys, sau đó tự động tạo file `.env` cho cả frontend và backend.

## 🎯 Bước 3: Khởi Động Tất Cả Services (2-3 phút)

```bash
docker-compose up -d
```

Docker sẽ tự động:
- ✅ Build backend và frontend images
- ✅ Cài đặt tất cả dependencies
- ✅ Khởi động tất cả services (PostgreSQL, Redis, Backend, Frontend, etc.)

**Lần đầu sẽ mất 2-3 phút để build images và install dependencies.**

Lần sau chạy nhanh hơn vì đã có cache.

### Kiểm Tra Services

```bash
docker-compose ps
```

Đợi cho đến khi tất cả services đều **Up** (màu xanh).

## 🎉 Xong!

Truy cập: **http://localhost:3000**

Backend API: **http://localhost:3001**

## 🔧 Troubleshooting

### ❌ Lỗi: "CLERK_SECRET_KEY is required"

**Nguyên nhân:** Chưa có Clerk API keys trong file .env

**Giải pháp:** 
1. Chạy lại script setup:
   ```bash
   .\setup-env.ps1  # Windows
   ./setup-env.sh   # Linux/Mac
   ```
2. Restart containers:
   ```bash
   docker-compose restart backend frontend
   ```

### ❌ Lỗi: "Port 5432 already allocated"

**Nguyên nhân:** PostgreSQL local đang chạy ở port 5432

**Giải pháp:** Docker đã dùng port 5433, không vấn đề gì!

### ❌ Lỗi: "Can't connect to database"

**Giải pháp:**
```bash
# Kiểm tra Docker
docker-compose ps

# Xem logs
docker-compose logs backend

# Restart services
docker-compose restart postgres backend
```

### ❌ Frontend/Backend không build được

**Giải pháp:**
```bash
# Rebuild containers
docker-compose up -d --build

# Xem logs để debug
docker-compose logs -f backend
docker-compose logs -f frontend
```

### ❌ Docker không chạy được

**Giải pháp:**
1. Mở Docker Desktop
2. Đợi Docker khởi động xong
3. Chạy lại: `docker-compose up -d`

### ❌ Services chạy chậm

**Nguyên nhân:** Lần đầu build và install dependencies

**Giải pháp:** Đợi 2-3 phút. Lần sau sẽ nhanh hơn.

## 📚 Tài Liệu Chi Tiết

- [ENV_SETUP.md](./ENV_SETUP.md) - Hướng dẫn chi tiết về environment variables
- [MCP_SETUP.md](./MCP_SETUP.md) - Setup Model Context Protocol

## 🌐 URLs Quan Trọng

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend | http://localhost:3001 | - |
| Clerk Dashboard | https://dashboard.clerk.com | Your account |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin123 |
| Mailpit (Email) | http://localhost:8025 | - |
| pgAdmin | http://localhost:5050 | admin@admin.com / admin |
| Meilisearch | http://localhost:7700 | masterKey_change_in_production |

## 💡 Tips

### Xem logs của services:
```bash
# Xem logs backend
docker-compose logs -f backend

# Xem logs frontend
docker-compose logs -f frontend

# Xem logs database
docker-compose logs -f postgres

# Xem tất cả logs
docker-compose logs -f
```

### Stop tất cả services:
```bash
docker-compose down
```

### Restart một service:
```bash
# Restart backend
docker-compose restart backend

# Restart frontend
docker-compose restart frontend
```

### Rebuild sau khi thay đổi code:
```bash
# Hot reload tự động trong development
# Nhưng nếu thay đổi package.json:
docker-compose up -d --build backend frontend
```

### Truy cập vào container:
```bash
# Backend shell
docker exec -it gr-backend sh

# Frontend shell
docker exec -it gr-frontend sh
```

### Xóa dữ liệu và reset:
```bash
docker-compose down -v  # ⚠️ Cẩn thận: Xóa hết data!
```

## 🎓 Next Steps

Sau khi chạy được dự án:

1. ✅ Thử sign up / sign in
2. ✅ Explore dashboard
3. ✅ Check email tại http://localhost:8025
4. ✅ Upload file test tại MinIO console
5. ✅ Xem database tại pgAdmin

## ❓ Cần Trợ Giúp?

- 📖 Đọc [ENV_SETUP.md](./ENV_SETUP.md) để hiểu chi tiết
- 🐛 Check logs: `docker-compose logs` hoặc console của terminal
- 💬 Liên hệ team nếu vẫn gặp vấn đề

---

**Chúc bạn code vui vẻ! 🚀**

