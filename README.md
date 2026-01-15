# 🎨 Pixiv Clone (Graduation Project)

Đồ án tốt nghiệp xây dựng nền tảng chia sẻ ảnh (tương tự Pixiv) tích hợp tìm kiếm và bộ lọc thông minh bằng AI.

## 🎯 Goal
- Ra trường đúng hạn (tối quan trọng).
- Áp dụng kiến trúc Microservices (lai Monolith) và AI integration.

## 🛠 Tech Stack
- **Frontend:** Next.js 15, Mantine UI, Zustand, TanStack Query.
- **Backend:** NestJS, Prisma, PostgreSQL (pgvector), BullMQ, Clerk.
- **AI Service:** Python (FastAPI), PyTorch (CLIP, NSFW Detector).
- **Infrastructure:** Docker, MinIO (S3), Meilisearch, Redis.

## 🚀 Quick Start

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd GR
```

### Bước 2: Setup Environment

#### Windows (PowerShell):
```powershell
.\setup-env.ps1
```

#### Linux/Mac:
```bash
chmod +x setup-env.sh
./setup-env.sh
```

### Bước 3: Khởi Động Tất Cả (Một Lệnh Duy Nhất!)

```bash
docker-compose up -d
```

**Xong!** 🎉 Docker sẽ tự động:
- ✅ Build Backend & Frontend
- ✅ Install tất cả dependencies  
- ✅ Khởi động tất cả services

Lần đầu sẽ mất 2-3 phút. Lần sau nhanh hơn.

### Bước 4: Truy Cập

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **MinIO Console:** http://localhost:9001 (minioadmin/minioadmin123)
- **Mailpit:** http://localhost:8025
- **pgAdmin:** http://localhost:5050 (admin@admin.com/admin)

## 📚 Documentation

### Getting Started
- **[Quick Start Guide](docs/QUICK_START.md)** - Hướng dẫn nhanh để chạy được dự án trong 5 phút
- **[API Keys Guide](docs/API_KEYS.md)** - Hướng dẫn lấy và cấu hình API keys
- **[Environment Setup](docs/ENV_SETUP.md)** - Chi tiết về biến môi trường
- **[Setup Checklist](docs/SETUP_CHECKLIST.md)** - Checklist từng bước để setup dự án

### Development
- **[Docker Guide](docs/DOCKER_GUIDE.md)** - Develop với Docker (hot reload, debugging, etc.)
- **[NestJS How-To](docs/HOWTO_NESTJS_MODULES.md)** - NestJS best practices & CLI workflow
- **[Clerk Setup](docs/CLERK_SETUP.md)** - Setup Clerk authentication trong NestJS
- **[Testing with Clerk](docs/TESTING_WITH_CLERK.md)** - Test API Authentication & RBAC
- **[Cheat Sheet](docs/CHEAT_SHEET.md)** - Tham chiếu nhanh các lệnh thường dùng
- **[MCP Setup](docs/MCP_SETUP.md)** - Setup Model Context Protocol

## 🔑 Required Setup

Để chạy được dự án, bạn cần:

1. **Docker Desktop** - Chạy tất cả services
   - Download tại: https://www.docker.com/products/docker-desktop

2. **Clerk API Keys** (Authentication - BẮT BUỘC)
   - Đăng ký tại: https://clerk.com
   - Free tier đủ dùng cho development
   - Lấy `CLERK_SECRET_KEY` và `CLERK_PUBLISHABLE_KEY`

3. **Không cần cài Node.js!** - Mọi thứ chạy trong Docker

## 📁 Project Structure

```
GR/
├── frontend/          # Next.js 15 App
│   ├── src/
│   │   ├── app/      # App Router
│   │   ├── components/
│   │   ├── libs/
│   │   └── utils/
│   └── env.template   # Template file .env
│
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   ├── common/
│   │   └── main.ts
│   └── env.template   # Template file .env
│
├── ai-service/        # Python FastAPI (Coming soon)
│   └── ...
│
├── docs/              # Documentation
│   ├── QUICK_START.md
│   ├── ENV_SETUP.md
│   └── MCP_SETUP.md
│
├── docker-compose.yml # Docker services
├── setup-env.ps1      # Setup script for Windows
└── setup-env.sh       # Setup script for Linux/Mac
```

## 🐛 Troubleshooting

### Lỗi phổ biến:

| Lỗi | Giải pháp nhanh |
|-----|----------------|
| Port already allocated | Đã fix! PostgreSQL dùng port 5433 |
| CLERK_SECRET_KEY required | Chạy `.\setup-env.ps1` |
| Can't connect to database | `docker-compose restart postgres` |
| Hot reload không hoạt động | `docker-compose restart backend` |

**📖 Xem đầy đủ:** [Common Errors Guide](docs/COMMON_ERRORS.md)

## ✅ Features (Planning)

- [ ] Authentication & Authorization (Clerk)
- [ ] Upload & Manage Artworks
- [ ] AI-powered Search (CLIP)
- [ ] NSFW Content Detection
- [ ] User Profiles & Following
- [ ] Like, Bookmark, Comment
- [ ] Tag System
- [ ] Recommendation Engine
- [ ] Admin Dashboard

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

---

*Work in progress...* 🚧

**Cần trợ giúp?** Đọc [Quick Start Guide](docs/QUICK_START.md) hoặc [ENV Setup](docs/ENV_SETUP.md)
