# 🔑 API Keys & Services Guide

Hướng dẫn chi tiết về các API keys và external services cần thiết cho dự án GR.

## 📊 Overview

| Service | Required | Free Tier | Used For | Estimated Time |
|---------|----------|-----------|----------|----------------|
| Clerk | ✅ BẮT BUỘC | ✅ Yes | Authentication | 2 phút |
| Docker | ✅ BẮT BUỘC | ✅ Free | Local services | 1 phút |
| Sentry | ❌ Optional | ✅ Yes | Error monitoring | 5 phút |
| Better Stack | ❌ Optional | ✅ Yes | Logging | 5 phút |

**Tổng thời gian setup tối thiểu: ~3 phút (chỉ cần Clerk + Docker)**

---

## 1. 🔐 Clerk (Authentication) - BẮT BUỘC

### Tại Sao Cần?
- Quản lý đăng ký/đăng nhập người dùng
- Xử lý xác thực email, social login
- Quản lý session và JWT tokens
- UI components có sẵn cho sign-in/sign-up

### Free Tier
- ✅ **10,000 Monthly Active Users (MAU)**
- ✅ Email/Password authentication
- ✅ Social logins (Google, GitHub, etc.)
- ✅ Pre-built UI components
- ✅ User management dashboard

**→ Đủ dùng cho development và MVP!**

### Cách Đăng Ký (2 phút)

#### Bước 1: Tạo Tài Khoản
1. Truy cập: **https://clerk.com**
2. Click **"Sign Up"** hoặc **"Get Started Free"**
3. Đăng ký bằng:
   - Email
   - GitHub
   - Google

#### Bước 2: Tạo Application
1. Sau khi đăng nhập, click **"Create Application"**
2. Đặt tên: `GR Project` (hoặc tên bạn muốn)
3. Chọn authentication methods:
   - ✅ Email
   - ✅ Google (optional)
   - ✅ GitHub (optional)
4. Click **"Create Application"**

#### Bước 3: Lấy API Keys
1. Sau khi tạo xong, bạn sẽ thấy **Quick Start** page
2. Hoặc vào sidebar → **API Keys**
3. Copy 2 keys:

**CLERK_SECRET_KEY:**
```
sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Dùng cho: Backend & Frontend (server-side)
- ⚠️ **Giữ bí mật!** Không commit lên Git

**NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:**
```
pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Dùng cho: Frontend (client-side)
- ✅ Public key, có thể expose

#### Bước 4: Cấu Hình (Optional)
1. Vào **Paths** → Configure redirect URLs:
   - Sign-in: `/sign-in`
   - Sign-up: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

2. Vào **User & Authentication** → Customize:
   - User profile fields
   - Social connections
   - Email templates

### Thêm Keys Vào Project

```env
# frontend/.env
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# backend/.env
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Lưu ý:** `CLERK_SECRET_KEY` phải giống nhau ở cả frontend và backend!

### Test Thử

1. Start app: `npm run dev`
2. Mở: http://localhost:3000
3. Click **Sign In** hoặc **Sign Up**
4. Clerk modal sẽ hiện ra
5. Thử sign up với email của bạn
6. Check email verification tại Mailpit: http://localhost:8025

### Dashboard Features

Truy cập: **https://dashboard.clerk.com**

- 👥 **Users**: Xem, quản lý, block users
- 📊 **Analytics**: User growth, sign-ins, etc.
- 🎨 **Customization**: Themes, branding
- 📧 **Email Templates**: Customize emails
- 🔐 **Sessions**: Manage active sessions
- 🪝 **Webhooks**: Listen to user events

---

## 2. 🐳 Docker (Local Services) - BẮT BUỘC

### Tại Sao Cần?
Chạy các services cần thiết locally:
- PostgreSQL (Database)
- Redis (Cache & Queue)
- Meilisearch (Search engine)
- MinIO (Object storage)
- Mailpit (Email testing)
- pgAdmin (Database UI)

### Cài Đặt

#### Windows
1. Download: **https://www.docker.com/products/docker-desktop**
2. Install Docker Desktop
3. Khởi động Docker Desktop
4. Đợi "Docker is running" ở system tray

#### Mac
```bash
brew install --cask docker
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Fedora
sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Sử Dụng

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# Stop all services
docker-compose down
```

### Services Credentials

Tất cả đã được config sẵn trong `docker-compose.yml`:

| Service | Host | Port | Username | Password | Database |
|---------|------|------|----------|----------|----------|
| PostgreSQL | localhost | 5432 | postgres | postgres | gr_development |
| Redis | localhost | 6379 | - | - | - |
| Meilisearch | localhost | 7700 | - | masterKey_change_in_production | - |
| MinIO | localhost | 9000/9001 | minioadmin | minioadmin123 | - |
| Mailpit | localhost | 8025/1025 | - | - | - |
| pgAdmin | localhost | 5050 | admin@admin.com | admin | - |

**→ Không cần đăng ký gì thêm!**

---

## 3. 🔍 Sentry (Error Monitoring) - OPTIONAL

### Tại Sao Cần?
- Monitor errors in production
- Track performance issues
- Get alerts when errors occur
- Debug with stack traces và context

### Free Tier
- ✅ **5,000 errors/month**
- ✅ 30-day error history
- ✅ Basic alerts
- ✅ Source maps support

**→ Đủ dùng cho development và small projects**

### Cách Đăng Ký (5 phút)

#### Bước 1: Tạo Tài Khoản
1. Truy cập: **https://sentry.io**
2. Click **"Get Started"**
3. Sign up with email hoặc GitHub

#### Bước 2: Tạo Project
1. Click **"Create Project"**
2. Chọn platform: **Next.js**
3. Set alert frequency
4. Đặt tên project: `gr-frontend`
5. Click **"Create Project"**

#### Bước 3: Lấy Credentials
Sentry sẽ show:
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx
SENTRY_ORGANIZATION=your-org
SENTRY_PROJECT=gr-frontend
```

#### Bước 4: Add to Project

```env
# frontend/.env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx
SENTRY_ORGANIZATION=your-org
SENTRY_PROJECT=gr-frontend

# Hoặc disable Sentry
NEXT_PUBLIC_SENTRY_DISABLED=true
```

### Disable Sentry (Development)

Nếu chưa muốn dùng Sentry:

```env
# frontend/.env
NEXT_PUBLIC_SENTRY_DISABLED=true
```

App vẫn chạy bình thường, Sentry sẽ không được load.

---

## 4. 📊 Better Stack (Logging) - OPTIONAL

### Tại Sao Cần?
- Centralized logging
- Search và filter logs
- Real-time log streaming
- Alerts based on logs

### Free Tier
- ✅ **1 GB logs/month**
- ✅ 3-day log retention
- ✅ Basic search
- ✅ Email alerts

**→ Đủ dùng cho development**

### Cách Đăng Ký (5 phút)

#### Bước 1: Tạo Tài Khoản
1. Truy cập: **https://betterstack.com**
2. Click **"Start free trial"**
3. Sign up with email

#### Bước 2: Create Source
1. Vào **Logs** → **Sources**
2. Click **"Connect source"**
3. Chọn **"HTTP"**
4. Đặt tên: `GR Frontend`
5. Copy **Source Token**

#### Bước 3: Add to Project

```env
# frontend/.env
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=xxxxx
NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST=in.logs.betterstack.com
```

### Skip Better Stack

Nếu không cần logging service, simply **không thêm** các env vars này.

App sẽ chạy bình thường, logs chỉ hiển thị ở console.

---

## 🎯 Setup Priority

### Must Have (Để chạy được app)
1. ✅ **Clerk** - Authentication
2. ✅ **Docker** - Local services

**→ Tổng thời gian: ~3 phút**

### Nice to Have (Có thể thêm sau)
3. ❌ Sentry - Error monitoring (add when deploy)
4. ❌ Better Stack - Logging (add when deploy)

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Lưu API keys trong file `.env`
- ✅ Add `.env` vào `.gitignore`
- ✅ Dùng `.env.example` hoặc template files
- ✅ Rotate keys định kỳ
- ✅ Dùng different keys cho dev/staging/prod
- ✅ Restrict API key permissions khi có thể

### ❌ DON'T:
- ❌ Commit `.env` files lên Git
- ❌ Share keys qua email/chat
- ❌ Hardcode keys trong code
- ❌ Dùng production keys trong development
- ❌ Để keys trong screenshots/videos

---

## 📋 Summary Table

| Service | Website | Dashboard | Required | Free Tier | Setup Time |
|---------|---------|-----------|----------|-----------|------------|
| **Clerk** | clerk.com | dashboard.clerk.com | ✅ Yes | 10K MAU | 2 min |
| **Docker** | docker.com | - | ✅ Yes | Free | 1 min |
| **Sentry** | sentry.io | sentry.io | ❌ No | 5K errors | 5 min |
| **Better Stack** | betterstack.com | logs.betterstack.com | ❌ No | 1GB logs | 5 min |

---

## 🆘 Troubleshooting

### Clerk: "Invalid API Key"
- ✅ Check key format: `sk_test_...` and `pk_test_...`
- ✅ Ensure no extra spaces
- ✅ Make sure keys are from same Clerk application
- ✅ Verify environment: test keys for dev, live keys for prod

### Docker: Services not starting
- ✅ Check Docker Desktop is running
- ✅ Check ports are not in use
- ✅ Run `docker-compose down && docker-compose up -d`
- ✅ Check logs: `docker-compose logs`

### Sentry: Not receiving errors
- ✅ Check `NEXT_PUBLIC_SENTRY_DISABLED` is not set to `true`
- ✅ Verify DSN is correct
- ✅ Trigger a test error
- ✅ Wait a few minutes for processing

---

## 🔗 Quick Links

### Official Docs
- Clerk: https://clerk.com/docs
- Docker: https://docs.docker.com
- Sentry: https://docs.sentry.io
- Better Stack: https://betterstack.com/docs

### Dashboards
- Clerk: https://dashboard.clerk.com
- Sentry: https://sentry.io
- Better Stack: https://logs.betterstack.com

### Pricing
- Clerk: https://clerk.com/pricing
- Sentry: https://sentry.io/pricing
- Better Stack: https://betterstack.com/pricing

---

**Ready to setup? Follow [Quick Start Guide](./QUICK_START.md)! 🚀**

