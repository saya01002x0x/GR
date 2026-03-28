# 📖 Cheat Sheet - GR Project

Quick reference cho các lệnh và URLs thường dùng trong dự án.

## 🚀 Quick Commands

### Start Everything (First Time)

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Setup Backend (Terminal 1)
cd backend
npm install
npm run start:dev

# 3. Setup Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

### Daily Start (After First Setup)

```bash
# Start Docker (if not running)
docker-compose up -d

# Start Backend (Terminal 1)
cd backend && npm run start:dev

# Start Frontend (Terminal 2)
cd frontend && npm run dev
```

## 🐳 Docker Commands

### Basic Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop và xóa volumes (⚠️ Mất data!)
docker-compose down -v

# Restart một service
docker-compose restart [service_name]

# Xem logs
docker-compose logs -f [service_name]

# Xem status
docker-compose ps
```

### Common Services

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Restart Redis
docker-compose restart redis

# Xem logs PostgreSQL
docker-compose logs -f postgres

# Xem logs tất cả services
docker-compose logs -f
```

## 🌐 URLs & Ports

### Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js App |
| Backend API | http://localhost:3001 | NestJS API |
| AI Service | http://localhost:8000 | FastAPI (Coming soon) |

### Docker Services

| Service | URL | Credentials |
|---------|-----|-------------|
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin123 |
| MinIO API | http://localhost:9000 | - |
| Mailpit UI | http://localhost:8025 | - |
| Mailpit SMTP | localhost:1025 | - |
| pgAdmin | http://localhost:5050 | admin@admin.com / admin |
| Meilisearch | http://localhost:7700 | masterKey_change_in_production |
| PostgreSQL | localhost:5433 | postgres / postgres / gr_development |
| Redis | localhost:6379 | - |

### External Services

| Service | URL | Purpose |
|---------|-----|---------|
| Clerk Dashboard | https://dashboard.clerk.com | Authentication management |
| Sentry | https://sentry.io | Error monitoring |
| Better Stack | https://betterstack.com | Logging |

## 📝 Backend Commands

```bash
cd backend

# Development
npm run start:dev         # Start with hot-reload
npm run start:debug       # Start with debug mode
npm run build             # Build for production
npm run start:prod        # Start production build

# Testing
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run e2e tests

# Linting & Formatting
npm run lint              # Run ESLint
npm run format            # Run Prettier

# Database (Prisma)
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma client
npx prisma studio         # Open Prisma Studio GUI
npx prisma db push        # Push schema changes
npx prisma db pull        # Pull schema from database
npx prisma db seed        # Seed database
```

## 🎨 Frontend Commands

```bash
cd frontend

# Development
npm run dev               # Start dev server
npm run dev:next          # Start Next.js only (without Spotlight)
npm run dev:spotlight     # Start Spotlight only
npm run build             # Build for production
npm run start             # Start production build

# Testing
npm run test              # Run Vitest tests
npm run test:watch        # Run tests in watch mode

# Code Quality
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint errors
npm run check:types       # TypeScript type checking
npm run check:deps        # Check unused dependencies
npm run check:i18n        # Check i18n translations

# Utilities
npm run clean             # Clean build artifacts
npm run build-stats       # Analyze bundle size

# Storybook
npm run storybook         # Start Storybook
npm run build-storybook   # Build Storybook
npm run storybook:test    # Test Storybook
```

## 🗄️ Database Commands

### PostgreSQL (via Docker)

```bash
# Connect to PostgreSQL container
docker exec -it gr-postgres psql -U postgres -d gr_development

# Backup database
docker exec gr-postgres pg_dump -U postgres gr_development > backup.sql

# Restore database
docker exec -i gr-postgres psql -U postgres gr_development < backup.sql

# Drop and recreate database
docker exec gr-postgres psql -U postgres -c "DROP DATABASE gr_development;"
docker exec gr-postgres psql -U postgres -c "CREATE DATABASE gr_development;"
```

### Prisma

```bash
cd backend

# Generate client
npx prisma generate

# Run migrations
npx prisma migrate dev --name <migration_name>

# Reset database (⚠️ Mất data!)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
# Mở browser: http://localhost:5555

# Format schema
npx prisma format

# Validate schema
npx prisma validate
```

## 🗑️ Redis Commands

```bash
# Connect to Redis container
docker exec -it gr-redis redis-cli

# Common Redis commands
PING                      # Test connection
KEYS *                    # List all keys
GET key_name              # Get value
SET key_name value        # Set value
DEL key_name              # Delete key
FLUSHALL                  # Clear all keys (⚠️ Careful!)
```

## 📦 MinIO Commands

### Via Web UI (http://localhost:9001)

1. Login: minioadmin / minioadmin123
2. Create bucket: `gr-uploads`
3. Set access policy: Public or Private
4. Upload test files

### Via CLI (if installed)

```bash
# Configure MinIO client
mc alias set local http://localhost:9000 minioadmin minioadmin123

# List buckets
mc ls local

# Create bucket
mc mb local/gr-uploads

# Upload file
mc cp file.jpg local/gr-uploads/

# Download file
mc cp local/gr-uploads/file.jpg ./
```

## 🔍 Meilisearch Commands

```bash
# Via curl

# Health check
curl http://localhost:7700/health

# Get stats
curl -H "Authorization: Bearer masterKey_change_in_production" \
  http://localhost:7700/stats

# List indexes
curl -H "Authorization: Bearer masterKey_change_in_production" \
  http://localhost:7700/indexes

# Search
curl -H "Authorization: Bearer masterKey_change_in_production" \
  http://localhost:7700/indexes/artworks/search?q=anime
```

## 🐛 Debug Commands

### Check Ports

```powershell
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Linux/Mac
lsof -ti:3000
lsof -ti:3001
lsof -ti:5432
lsof -ti:6379
```

### Kill Process by Port

```powershell
# Windows
# Tìm PID
netstat -ano | findstr :3000
# Kill by PID
taskkill /PID <PID> /F

# Linux/Mac
kill -9 $(lsof -ti:3000)
```

### Check Docker Resources

```bash
# Disk usage
docker system df

# Clean up unused resources
docker system prune

# Clean up everything (⚠️ Careful!)
docker system prune -a --volumes
```

## 📊 Monitoring Commands

### Backend Logs

```bash
# Real-time logs
cd backend && npm run start:dev

# With debug info
cd backend && npm run start:debug
```

### Frontend Logs

```bash
# Development logs
cd frontend && npm run dev

# Build logs
cd frontend && npm run build
```

### Docker Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 postgres
```

## 🔐 Environment Variables

### View Current Env

```bash
# Backend
cd backend
cat .env

# Frontend
cd frontend
cat .env
```

### Regenerate .env Files

```powershell
# Windows
.\setup-env.ps1

# Linux/Mac
./setup-env.sh
```

## 🧹 Clean Up Commands

### Clean Node Modules

```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Clean Build Artifacts

```bash
# Frontend
cd frontend
npm run clean

# Backend
cd backend
rm -rf dist
```

### Clean Docker

```bash
# Stop và xóa containers
docker-compose down

# Xóa volumes (⚠️ Mất data!)
docker-compose down -v

# Xóa images
docker-compose down --rmi all

# Clean system
docker system prune -a
```

## 🔄 Git Commands (Quick Reference)

```bash
# Pull latest changes
git pull

# Create new branch
git checkout -b feature/your-feature

# Stage changes
git add .

# Commit
git commit -m "feat: your message"

# Push
git push origin feature/your-feature

# View status
git status

# View logs
git log --oneline
```

## 📚 Useful Snippets

### Test Backend Health

```bash
curl http://localhost:3001
```

### Test Frontend

```bash
curl http://localhost:3000
```

### Check if Docker is Running

```bash
docker ps
```

### View All Running Processes

```bash
# Docker containers
docker ps

# All processes on port
netstat -ano | findstr :<PORT>
```

## 🎯 Common Workflows

### Add New Backend Feature

```bash
cd backend
# 1. Create module
npx nest g module features/my-feature
npx nest g controller features/my-feature
npx nest g service features/my-feature

# 2. Update Prisma schema if needed
npx prisma migrate dev --name add_my_feature

# 3. Generate Prisma client
npx prisma generate

# 4. Test
npm run test
```

### Add New Frontend Page

```bash
cd frontend/src/app/[locale]/(auth)
# Create folder structure
mkdir -p my-page
touch my-page/page.tsx

# Test
npm run dev
# Visit: http://localhost:3000/my-page
```

## 💡 Tips

1. **Multiple Terminals**: Sử dụng ít nhất 2 terminals - một cho backend, một cho frontend
2. **Docker First**: Luôn start Docker services trước khi start app
3. **Check Logs**: Khi có lỗi, check logs của service liên quan
4. **Clean Restart**: Nếu có vấn đề, thử `docker-compose restart` hoặc `docker-compose down && docker-compose up -d`
5. **Environment Variables**: Khi thay đổi .env, restart service để apply changes

## 🔗 Related Docs

- [Quick Start](./QUICK_START.md)
- [ENV Setup](./ENV_SETUP.md)
- [Setup Checklist](./SETUP_CHECKLIST.md)
- [MCP Setup](./MCP_SETUP.md)

---

**Bookmark page này để tham khảo nhanh! 🔖**

