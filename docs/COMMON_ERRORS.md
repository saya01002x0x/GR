# 🐛 Common Errors & Solutions

Các lỗi thường gặp và cách xử lý khi setup GR Project.

---

## ❌ Port Already Allocated

### Lỗi: "Bind for 0.0.0.0:5432 failed: port is already allocated"

```
Error response from daemon: failed to set up container networking: 
driver failed programming external connectivity on endpoint gr-postgres: 
Bind for 0.0.0.0:5432 failed: port is already allocated
```

### Nguyên nhân
PostgreSQL local (hoặc service khác) đang chạy ở port 5432.

### ✅ Giải pháp (Đã Fix)

**Chúng tôi đã đổi port của PostgreSQL Docker sang 5433** để tránh conflict!

Chỉ cần chạy lại:
```bash
docker-compose down
docker-compose up -d
```

### Kiểm tra
```bash
# Kiểm tra PostgreSQL Docker
docker-compose ps | grep postgres

# Kết nối từ local (dùng port 5433)
psql -h localhost -p 5433 -U postgres -d gr_development
```

### Nếu vẫn lỗi với port khác

```powershell
# Windows: Tìm process đang dùng port
netstat -ano | findstr :5433

# Thấy PID, kill nó
taskkill /PID <PID> /F
```

```bash
# Linux/Mac: Tìm và kill
lsof -ti:5433 | xargs kill -9
```

---

## ❌ CLERK_SECRET_KEY is required

### Lỗi
```
Error: CLERK_SECRET_KEY is required
```

### Nguyên nhân
File `.env` chưa có hoặc chưa có Clerk API keys.

### ✅ Giải pháp

```bash
# Chạy setup script
.\setup-env.ps1  # Windows
./setup-env.sh   # Linux/Mac

# Nhập Clerk keys khi được hỏi
# Restart containers
docker-compose restart backend frontend
```

---

## ❌ Cannot connect to database

### Lỗi
```
Error: getaddrinfo ENOTFOUND postgres
Error: Connection terminated unexpectedly
```

### Nguyên nhân
1. PostgreSQL container chưa start
2. Database URL không đúng
3. Container không trong cùng network

### ✅ Giải pháp

#### 1. Kiểm tra PostgreSQL
```bash
# Check container status
docker-compose ps postgres

# Nếu không running
docker-compose up -d postgres

# Xem logs
docker-compose logs postgres
```

#### 2. Kiểm tra Database URL

**Trong Docker (backend container):**
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/gr_development
# Dùng hostname "postgres" (tên service)
```

**Từ local machine:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/gr_development
# Dùng "localhost" và port 5433
```

#### 3. Kiểm tra Network
```bash
# Inspect backend network
docker inspect gr-backend | grep -A 10 Networks

# Nên thấy "gr-network"
```

---

## ❌ Module not found

### Lỗi
```
Error: Cannot find module '@nestjs/common'
Error: Cannot find module 'react'
```

### Nguyên nhân
Dependencies chưa được install trong container.

### ✅ Giải pháp

```bash
# Rebuild container
docker-compose up -d --build backend

# Hoặc install trong container
docker exec -it gr-backend npm install
docker-compose restart backend
```

---

## ❌ Hot reload không hoạt động

### Lỗi
Thay đổi code nhưng app không tự reload.

### Nguyên nhân
1. Volume mount không đúng
2. File watcher issue (Windows/WSL2)
3. Node_modules conflict

### ✅ Giải pháp

#### 1. Kiểm tra volumes
```bash
docker inspect gr-backend | grep -A 10 Mounts
# Phải thấy ./backend:/app mount
```

#### 2. Windows/WSL2 Fix
Thêm vào `docker-compose.yml`:
```yaml
environment:
  CHOKIDAR_USEPOLLING: "true"
  WATCHPACK_POLLING: "true"
```

#### 3. Restart container
```bash
docker-compose restart backend frontend
```

---

## ❌ Frontend không build được

### Lỗi
```
Error: Build failed
Error: Module build failed
```

### Nguyên nhân
1. Out of memory
2. Dependencies conflict
3. Syntax errors

### ✅ Giải pháp

#### 1. Xem logs chi tiết
```bash
docker-compose logs frontend
```

#### 2. Rebuild từ đầu
```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

#### 3. Tăng memory (nếu OOM)
```yaml
# docker-compose.yml
frontend:
  deploy:
    resources:
      limits:
        memory: 4G
```

---

## ❌ Permission denied

### Lỗi
```
Error: EACCES: permission denied, open '/app/package.json'
```

### Nguyên nhân
File permissions không đúng (Linux/Mac).

### ✅ Giải pháp

```bash
# Fix permissions
sudo chown -R $USER:$USER backend/ frontend/

# Hoặc run với user
docker-compose.yml:
  backend:
    user: "${UID}:${GID}"
```

---

## ❌ Docker daemon not running

### Lỗi
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

### Nguyên nhân
Docker Desktop chưa chạy.

### ✅ Giải pháp

1. Mở Docker Desktop
2. Đợi Docker start xong (icon màu xanh)
3. Chạy lại: `docker-compose up -d`

---

## ❌ Out of disk space

### Lỗi
```
Error: no space left on device
```

### Nguyên nhân
Docker images/volumes chiếm nhiều dung lượng.

### ✅ Giải pháp

```bash
# Xem disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Chỉ xóa unused
docker system prune
```

---

## ❌ Network already exists

### Lỗi
```
Error: network gr-network already exists
```

### ✅ Giải pháp

```bash
# Remove network
docker network rm gr-network

# Recreate
docker-compose up -d
```

---

## ❌ Container name already in use

### Lỗi
```
Error: The container name "/gr-backend" is already in use
```

### ✅ Giải pháp

```bash
# Stop và remove container cũ
docker stop gr-backend
docker rm gr-backend

# Hoặc dùng compose
docker-compose down
docker-compose up -d
```

---

## 🔍 Debug Workflow

Khi gặp lỗi không rõ:

### 1. Check container status
```bash
docker-compose ps
```

### 2. Xem logs
```bash
docker-compose logs -f [service_name]
```

### 3. Inspect container
```bash
docker inspect gr-backend
```

### 4. Access shell
```bash
docker exec -it gr-backend sh
```

### 5. Check environment
```bash
docker exec gr-backend env
```

### 6. Restart services
```bash
docker-compose restart
```

### 7. Nuclear option: Rebuild everything
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 Still Stuck?

Nếu vẫn gặp vấn đề:

1. 📖 Đọc [Docker Guide](./DOCKER_GUIDE.md)
2. 📖 Đọc [Quick Start](./QUICK_START.md)
3. 🔍 Check logs: `docker-compose logs -f`
4. 💬 Liên hệ team với:
   - Error message đầy đủ
   - Output của `docker-compose ps`
   - Output của `docker-compose logs [service]`

---

**Remember: Google the error message! Stack Overflow là bạn! 🚀**
