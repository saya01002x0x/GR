# 🔌 MCP (Model Context Protocol) Setup

Hướng dẫn cài đặt MCP servers cho Cursor IDE và Antigravity.

---

## 📋 MCP Servers được đề xuất

### 🎯 Essential (Nên cài)

| MCP Server | Mục đích | Phù hợp với |
|------------|----------|-------------|
| **@anthropic-ai/mcp-server-filesystem** | Truy cập file system | Toàn dự án |
| **@anthropic-ai/mcp-server-postgres** | Query database, xem schema | Backend + Prisma |
| **@anthropic-ai/mcp-server-git** | Git operations | Toàn dự án |
| **@anthropic-ai/mcp-server-fetch** | Fetch URLs, APIs | Debug APIs |
| **@anthropic-ai/mcp-server-memory** | Lưu context giữa các phiên | Dự án lớn |
| **@anthropic-ai/mcp-server-sequential-thinking** | Reasoning phức tạp | Debug logic |

### 🚀 Advanced (Tùy chọn)

| MCP Server | Mục đích | Phù hợp với |
|------------|----------|-------------|
| **@anthropic-ai/mcp-server-brave-search** | Tìm kiếm web | Research |
| **@anthropic-ai/mcp-server-puppeteer** | Browser automation | E2E testing |
| **mcp-server-meilisearch** | Query Meilisearch | Search feature |
| **mcp-server-redis** | Redis operations | Cache/Queue |
| **mcp-server-sentry** | Error tracking | Debugging |

---

## ⚙️ Cấu hình cho Cursor

### Bước 1: Tạo file cấu hình

Tạo file `.cursor/mcp.json` trong project root:

```json
{
  "$schema": "https://raw.githubusercontent.com/anthropics/model-context-protocol/main/schema/mcp-config.schema.json",
  "mcpServers": {
    
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-filesystem", "C:/Khac/Project/GR"],
      "description": "File system access"
    },

    "postgres": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-postgres"],
      "env": {
        "POSTGRES_URL": "postgresql://postgres:postgres@localhost:5432/gr_development"
      },
      "description": "PostgreSQL database"
    },

    "git": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-git"],
      "description": "Git operations"
    },

    "fetch": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-fetch"],
      "description": "Fetch web/API"
    },

    "memory": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-memory"],
      "description": "Persistent memory"
    },

    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-sequential-thinking"],
      "description": "Complex reasoning"
    }
  }
}
```

### Bước 2: Restart Cursor

Sau khi tạo file, restart Cursor để load MCP servers.

---

## 🐳 Docker Services

Dự án sử dụng các services sau (đã cấu hình trong `docker-compose.yml`):

### Chạy tất cả services

```bash
docker-compose up -d
```

### Services có sẵn

| Service | Port | URL | Mục đích |
|---------|------|-----|----------|
| **PostgreSQL** | 5432 | `localhost:5432` | Database chính |
| **Redis** | 6379 | `localhost:6379` | Cache & Queue (BullMQ) |
| **Meilisearch** | 7700 | `http://localhost:7700` | Search engine |
| **MinIO** | 9000/9001 | `http://localhost:9001` | S3-compatible storage |
| **Mailpit** | 8025/1025 | `http://localhost:8025` | Email testing |
| **pgAdmin** | 5050 | `http://localhost:5050` | DB management UI |

### Connection Strings

```bash
# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gr_development"

# Redis
REDIS_URL="redis://localhost:6379"

# Meilisearch
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="masterKey_change_in_production"

# MinIO (S3-compatible)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_BUCKET="gr-uploads"

# Mailpit SMTP
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

---

## 🔧 Environment Files

### Backend (.env)

Tạo file `backend/.env`:

```bash
# App
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gr_development"

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey_change_in_production

# S3 (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=gr-uploads
S3_REGION=us-east-1

# SMTP (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
```

### Frontend (.env.local)

Tạo file `frontend/.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📦 Community MCP Servers

Các MCP servers từ cộng đồng có thể hữu ích:

| Repository | Mô tả |
|------------|-------|
| [mcp-server-prisma](https://github.com/AgusCT/mcp-server-prisma) | Prisma schema & migrations |
| [mcp-server-docker](https://github.com/ckreiling/mcp-server-docker) | Docker container management |
| [mcp-server-kubernetes](https://github.com/Flux159/mcp-server-kubernetes) | K8s cluster management |
| [mcp-server-slack](https://github.com/anthropics/mcp-servers/tree/main/src/slack) | Slack integration |
| [mcp-server-github](https://github.com/anthropics/mcp-servers/tree/main/src/github) | GitHub operations |

---

## 🎮 Antigravity Setup

Nếu sử dụng Antigravity, cấu hình tương tự trong settings:

1. Mở Antigravity Settings
2. Navigate to MCP Servers
3. Add servers với cùng config như trên

---

## 🔗 Tài liệu tham khảo

- [MCP Official Docs](https://modelcontextprotocol.io/)
- [MCP Servers Repository](https://github.com/anthropics/mcp-servers)
- [Cursor MCP Integration](https://docs.cursor.com/context/model-context-protocol)

