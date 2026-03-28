# 🐳 Docker Development Guide

Hướng dẫn chi tiết về việc develop với Docker trong GR Project.

## 📋 Tổng Quan

Toàn bộ stack chạy trong Docker:
- ✅ **Backend** (NestJS) - Port 3001
- ✅ **Frontend** (Next.js) - Port 3000
- ✅ **PostgreSQL** - Port 5433
- ✅ **Redis** - Port 6379
- ✅ **Meilisearch** - Port 7700
- ✅ **MinIO** - Port 9000/9001
- ✅ **Mailpit** - Port 8025/1025
- ✅ **pgAdmin** - Port 5050

**Lợi ích:**
- 🚀 Không cần cài Node.js, PostgreSQL, Redis local
- 🔄 Hot reload vẫn hoạt động bình thường
- 📦 Consistent environment giữa dev/staging/prod
- 🎯 Dễ onboard người mới (chỉ cần Docker)

---

## 🚀 Quick Commands

### Start Everything

```bash
# Lần đầu (build images)
docker-compose up -d

# Lần sau (dùng cached images)
docker-compose up -d
```

### Stop Everything

```bash
# Stop nhưng giữ data
docker-compose down

# Stop và xóa data
docker-compose down -v
```

### Restart Services

```bash
# Restart một service
docker-compose restart backend
docker-compose restart frontend

# Restart tất cả
docker-compose restart
```

### Rebuild Images

```bash
# Rebuild một service
docker-compose up -d --build backend

# Rebuild tất cả
docker-compose up -d --build
```

---

## 📊 Development Workflow

### 1. Bắt Đầu Ngày Làm Việc

```bash
# Start tất cả services
docker-compose up -d

# Check status
docker-compose ps

# Xem logs
docker-compose logs -f backend frontend
```

### 2. Code Như Bình Thường

- ✅ Edit code trong `backend/` hoặc `frontend/`
- ✅ Hot reload tự động (nhờ volume mounts)
- ✅ Không cần restart container

### 3. Khi Thêm Dependencies

```bash
# Ví dụ: thêm package mới vào backend
cd backend
# Edit package.json

# Rebuild backend container
docker-compose up -d --build backend
```

### 4. Kết Thúc Ngày

```bash
# Option 1: Giữ containers chạy (tiết kiệm thời gian ngày mai)
# Không làm gì

# Option 2: Stop containers (giải phóng RAM)
docker-compose down
```

---

## 🔍 Debugging

### Xem Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Errors only
docker-compose logs backend | grep -i error

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Truy Cập Container Shell

```bash
# Backend shell
docker exec -it gr-backend sh

# Frontend shell
docker exec -it gr-frontend sh

# PostgreSQL shell
docker exec -it gr-postgres psql -U postgres -d gr_development
```

### Inspect Container

```bash
# Container details
docker inspect gr-backend

# Environment variables
docker exec gr-backend env

# Running processes
docker exec gr-backend ps aux
```

---

## 📝 Hot Reload Explained

### Backend (NestJS)

```yaml
volumes:
  - ./backend:/app          # Code mounts vào container
  - /app/node_modules       # node_modules dùng trong container
```

**Cách hoạt động:**
1. Bạn edit file trong `backend/src/app.controller.ts`
2. File được sync vào container
3. NestJS watch mode detect thay đổi
4. Auto restart server
5. ✅ Changes reflected immediately

### Frontend (Next.js)

```yaml
volumes:
  - ./frontend:/app         # Code mounts vào container
  - /app/node_modules       # node_modules dùng trong container
  - /app/.next              # .next build cache dùng trong container
```

**Cách hoạt động:**
1. Bạn edit file trong `frontend/src/app/page.tsx`
2. File được sync vào container
3. Next.js Fast Refresh detect thay đổi
4. Auto rebuild page
5. ✅ Browser auto refresh

---

## 🛠️ Common Tasks

### Install New Package

#### Backend

```bash
# Cách 1: Trong container
docker exec -it gr-backend npm install lodash
docker-compose restart backend

# Cách 2: Local + rebuild (recommended)
cd backend
npm install lodash
docker-compose up -d --build backend
```

#### Frontend

```bash
# Cách 1: Trong container
docker exec -it gr-frontend npm install axios
docker-compose restart frontend

# Cách 2: Local + rebuild (recommended)
cd frontend
npm install axios
docker-compose up -d --build frontend
```

### Run Database Migrations

```bash
# Prisma migrate
docker exec -it gr-backend npx prisma migrate dev

# Prisma generate
docker exec -it gr-backend npx prisma generate

# Prisma studio
docker exec -it gr-backend npx prisma studio
# Truy cập: http://localhost:5555
```

### Run Tests

```bash
# Backend tests
docker exec -it gr-backend npm run test

# Frontend tests
docker exec -it gr-frontend npm run test

# E2E tests
docker exec -it gr-backend npm run test:e2e
```

### Run Scripts

```bash
# Backend script
docker exec -it gr-backend npx ts-node scripts/create-test-users.ts

# Frontend build
docker exec -it gr-frontend npm run build
```

---

## 🔧 Configuration

### Environment Variables

**Backend:** `backend/.env` được mount vào container
```yaml
env_file:
  - ./backend/.env
```

**Frontend:** `frontend/.env` được mount vào container
```yaml
env_file:
  - ./frontend/.env
```

### Database Connection

**Trong Docker network:**
```env
# backend container → postgres container
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/gr_development
```

**Từ máy local:**
```env
# local → postgres container
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/gr_development
```

### Network

Tất cả services trong cùng `gr-network`:
- Backend có thể gọi `http://postgres:5432`
- Frontend có thể gọi `http://backend:3001`
- Không cần dùng localhost trong container

---

## 🎯 Production Build

### Build Production Images

```bash
# Build với production target
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production Dockerfile Targets

**Backend:**
```dockerfile
FROM base AS production
# ... production optimizations
CMD ["node", "dist/main"]
```

**Frontend:**
```dockerfile
FROM base AS production
# ... production optimizations
CMD ["npm", "start"]
```

---

## 🐛 Troubleshooting

### Container Không Start

```bash
# Xem logs
docker-compose logs backend

# Xem lỗi chi tiết
docker-compose up backend

# Rebuild từ đầu
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Hot Reload Không Hoạt Động

**Kiểm tra:**
1. Volume mounts đúng chưa?
   ```bash
   docker inspect gr-backend | grep -A 10 Mounts
   ```

2. File có được sync không?
   ```bash
   docker exec gr-backend ls -la src/
   ```

3. Watcher có chạy không?
   ```bash
   docker logs gr-backend | grep -i watch
   ```

### Changes Không Reflect

```bash
# Restart container
docker-compose restart backend

# Hoặc rebuild
docker-compose up -d --build backend
```

### Port Conflicts

**Lỗi:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Giải pháp:**
```bash
# Tìm process dùng port
netstat -ano | findstr :3000  # Windows
lsof -ti:3000                 # Linux/Mac

# Đổi port trong docker-compose.yml
ports:
  - "3002:3000"  # Map host 3002 → container 3000
```

### Out of Memory

```bash
# Tăng memory limit
docker-compose.yml:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## 📚 Best Practices

### 1. ✅ Dùng Volume Mounts Cho Development

```yaml
volumes:
  - ./backend:/app
  - /app/node_modules  # Important!
```

### 2. ✅ Multi-Stage Builds

```dockerfile
FROM node:20-alpine AS deps
# Install deps

FROM node:20-alpine AS dev
# Development

FROM node:20-alpine AS production
# Production
```

### 3. ✅ Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 4. ✅ .dockerignore

```
node_modules
dist
.env
*.log
```

### 5. ✅ Named Volumes Cho Data

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

---

## 🔗 Related Docs

- [Quick Start](./QUICK_START.md)
- [Cheat Sheet](./CHEAT_SHEET.md)
- [Environment Setup](./ENV_SETUP.md)

---

**Happy Docker Development! 🐳**
