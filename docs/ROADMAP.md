# 🎨 LUMINA - Project Roadmap

> Pixiv Clone với Next.js + NestJS + Clerk
> Dành cho Graduation Research (GR) - 2026

---

## 📊 Tổng quan tiến độ

| Giai đoạn | Sprint | Status | Completion |
|-----------|--------|--------|------------|
| Phase 1: Core MVP | Sprint 1-4 | ✅ Hoàn thành | 95% |
| Phase 1.5: Quick Wins | Sprint 4.5 | ⏳ Tiếp theo | 0% |
| Phase 2: Tech Deep Dive | Sprint 5-7 | ⏳ Sắp làm | 0% |
| Phase 3: Observe & Scale | Sprint 8-10 | ⏳ Chưa bắt đầu | 0% |

---

## 🎯 THỨ TỰ THỰC CHIẾN (2 Tuần Tới)

```
┌─────────────────────────────────────────────────────────┐
│  1. Swagger (0.5 ngày) - Làm NGAY để project pro hơn   │
│                          ↓                              │
│  2. BullMQ + Redis (Sprint 5) - Xương sống hệ thống    │
│                          ↓                              │
│  3. Image Worker - Chuyển resize từ Controller → Queue │
│                          ↓                              │
│  4. Meilisearch (Sprint 6) - Worker gọi sync data      │
│                          ↓                              │
│  5. AI Tagging (trong Worker) - Tiện tay gắn thêm      │
└─────────────────────────────────────────────────────────┘
```

**Lý do đảo Queue trước Search:**
- Queue là "cầm trịch" việc đồng bộ dữ liệu
- Upload → DB → Job → Worker → Resize → Sync Meilisearch
- Không phải đập code làm lại khi thêm tính năng mới

---

## 🗓️ PHASE 1: XÂY DỰNG CORE MVP ✅

> **Mục tiêu**: Đảm bảo luồng dữ liệu mượt mà giữa Clerk (Auth) và Database

### Sprint 1: Foundation Setup ✅
**Timeline**: Tuần 1 (Đã xong)

| Task | Status | Notes |
|------|--------|-------|
| Setup monorepo (pnpm workspaces) | ✅ | frontend + backend |
| Docker Compose cho services | ✅ | Postgres, Redis, MinIO, Meilisearch |
| Prisma schema design | ✅ | User, Artwork, Tag models |
| Environment configuration | ✅ | .env files cho dev |

---

### Sprint 2: Authentication ✅
**Timeline**: Tuần 1-2 (Đã xong)

| Task | Status | Notes |
|------|--------|-------|
| Clerk integration (Next.js) | ✅ | Social login Google/GitHub |
| Clerk webhook sync | ✅ | Sync user data to Postgres |
| NestJS AuthGuard (Clerk JWT) | ✅ | Verify token từ Clerk |
| User profile sync | ✅ | Avatar, displayName |

---

### Sprint 3: Upload & Storage ✅
**Timeline**: Tuần 2-3 (Đã xong)

| Task | Status | Notes |
|------|--------|-------|
| MinIO setup (S3-compatible) | ✅ | Local object storage |
| Image upload endpoint | ✅ | NestJS + Multer |
| Sharp image processing | ✅ | Resize, thumbnail generation |
| Upload page UI | ✅ | Mantine Dropzone |
| **Multi-image upload** | ✅ | Manga/comic support (max 20) |

---

### Sprint 4: Feed & Social ✅
**Timeline**: Tuần 3-4 (Đã xong)

| Task | Status | Notes |
|------|--------|-------|
| Masonry grid feed | ✅ | Pinterest-style layout |
| Artwork detail page | ✅ | Image viewer, metadata |
| **Multi-image gallery** | ✅ | Pagination + scroll mode |
| Like system | ✅ | Toggle like, count |
| Comment system | ✅ | Add, delete comments |
| Bookmark/Collection | ✅ | Save to collections |
| Artist dashboard | ✅ | Manage uploaded works |

---

## 🗓️ PHASE 1.5: QUICK WINS ⚡

### Sprint 4.5: API Documentation (Swagger) 🔥
**Timeline**: 0.5 ngày - LÀM NGAY!
**Priority**: 🔴 Critical - Thầy giáo nhìn vào là gật đầu!

| Task | Status | Notes |
|------|--------|-------|
| Install @nestjs/swagger | ✅ | 5 phút |
| Setup SwaggerModule | ✅ | 10 phút |
| Add @ApiProperty to DTOs | ✅ | 30 phút |
| Add @ApiOperation to Controllers | ✅ | 30 phút |
| Add @ApiTags grouping | ✅ | 10 phút |

**Giá trị:**
- ✅ CV: Thể hiện biết làm việc nhóm (viết docs cho FE/Mobile đọc)
- ✅ GR: Thầy bấm "Try it out" chạy vèo vèo = auto pass
- ✅ Dev: Dễ test API không cần Postman

**Quick Start:**
```bash
cd backend
pnpm add @nestjs/swagger swagger-ui-express
```

---

## 🗓️ PHASE 2: TECH DEEP DIVE 🔄

> **Mục tiêu**: Thêm công nghệ "nặng đô" để CV có sức nặng
> **⚠️ ĐÃ ĐẢO THỨ TỰ: Queue TRƯỚC Search!**

### Sprint 5: Background Jobs (BullMQ + Redis) ✅
**Timeline**: Tháng 2, Tuần 1-2 (Đã xong)
**Priority**: 🔴 CRITICAL - Xương sống hệ thống!

| Task | Status | Notes |
|------|--------|-------|
| BullMQ setup (NestJS) | ✅ | @nestjs/bullmq |
| Redis connection | ✅ | Đã có trong docker-compose |
| **Image Processing Queue** | ✅ | Chuyển resize từ Controller |
| Thumbnail worker | ✅ | Async thumbnail generation |
| Job retry & error handling | ✅ | Robust processing |
| Bull Board dashboard | ✅ | Monitor jobs |
| **AI Tagging worker** | ✅ | NSFWJS + Sharp pipeline |

**Architecture sau khi có Queue:**
```
Upload Request
     ↓
Controller (save to DB, return "Success" ngay)
     ↓
Job: process_image → Queue
     ↓
Worker picks up job
     ├── Resize image (Sharp)
     ├── Generate thumbnail  
     ├── AI Tag suggestion (NSFWJS)
     └── Job: sync_search → Queue
              ↓
         Worker sync to Meilisearch
```

**Lý do làm trước Search:**
- ✅ Server không đơ khi upload 4K
- ✅ Có sẵn Worker để gắn AI Tagging
- ✅ Sync Meilisearch qua Queue = clean code

---

### Sprint 6: Search Engine (Meilisearch) 🔄
**Timeline**: Tháng 2, Tuần 3-4
**Priority**: 🔴 High

| Task | Status | Notes |
|------|--------|-------|
| Meilisearch Docker setup | ✅ | Đã có trong docker-compose |
| Search service (NestJS) | ⏳ | Meilisearch client |
| **Sync via Queue** | ⏳ | Worker gọi meili.addDocuments() |
| Instant search UI | ⏳ | Debounced input, suggestions |
| Filter by tags, rating | ⏳ | Faceted search |
| Typo tolerance demo | ⏳ | Highlight for CV |

**Tech Stack**: Meilisearch, @meilisearch/instant-meilisearch

---

### Sprint 7: Social Features++ ⏳
**Timeline**: Tháng 3, Tuần 1-2
**Priority**: 🟡 Medium

| Task | Status | Notes |
|------|--------|-------|
| Follow system | ⏳ | Follow artists |
| Personalized feed | ⏳ | "Artwork của người tôi follow" |
| Notification center | ⏳ | Real-time với SSE/WebSocket |
| Activity feed | ⏳ | "User X liked your artwork" |
| **Notification via Queue** | ⏳ | Email khi có follower mới |

---

## 🗓️ PHASE 3: OBSERVE & SCALE ⏳

> **Mục tiêu**: Biến project sinh viên thành sản phẩm Production-ready

### Sprint 8: Monitoring & Observability ⏳
**Timeline**: Tháng 3, Tuần 3-4
**Priority**: 🟡 Medium

| Task | Status | Notes |
|------|--------|-------|
| Sentry error tracking | 🔄 | Đã setup, cần fine-tune |
| Structured logging | ⏳ | Winston/Pino |
| API performance metrics | ⏳ | Response time tracking |
| Dashboard analytics | ⏳ | User stats, popular artworks |

---

### Sprint 9: AI/ML Advanced ⏳
**Timeline**: Tháng 4 (Sau khi thesis paper xong)
**Priority**: 🟢 Nice-to-have

> ⚠️ **Lưu ý**: AI Tagging cơ bản đã làm trong Sprint 5!
> Sprint này chỉ làm thêm tính năng nâng cao.

| Task | Status | Notes |
|------|--------|-------|
| Image embedding (CLIP) | ⏳ | Vector hóa artwork |
| pgvector setup | ⏳ | Vector search trong Postgres |
| Similar image search | ⏳ | "Tìm ảnh tương tự" |
| Advanced tag refinement | ⏳ | Fine-tune AI model |

---

### Sprint 10: DevOps & Deployment ⏳
**Timeline**: Tháng 5 (Trước bảo vệ!)
**Priority**: 🔴 High

| Task | Status | Notes |
|------|--------|-------|
| Dockerize full app | 🔄 | docker-compose đã có |
| CI/CD pipeline | ⏳ | GitHub Actions |
| Production deployment | ⏳ | Vercel (FE) + Render/Railway (BE) |
| Domain + SSL | ⏳ | lumina.art hoặc tương tự |
| Load testing | ⏳ | k6 hoặc Artillery |

---

## 📋 SO SÁNH TRƯỚC/SAU ĐỔI

| Aspect | Cũ | Mới |
|--------|-----|-----|
| Thứ tự | Search → Queue | **Queue → Search** |
| AI Tagging | Sprint 9 (Tháng 4) | **Sprint 5 (Tháng 2)** |
| Swagger | "Gợi ý" | **Sprint 4.5 (Làm ngay)** |
| Sync data | Gọi trực tiếp | **Qua Queue** |

**Lợi ích:**
1. ✅ Khung xương Queue vững chắc
2. ✅ AI Tagging xong sớm, không stress tháng 4
3. ✅ Swagger làm ngay = professional
4. ✅ Mọi tính năng nặng đều đi qua Queue

---

## 📝 Changelog

| Date | Sprint | Changes |
|------|--------|---------|
| 2026-02-04 | Sprint 3 | ✅ Multi-image upload completed |
| 2026-02-04 | Sprint 4 | ✅ ArtworkImageGallery component |
| 2026-02-04 | - | 🔄 Reordered sprints: Queue before Search |
| 2026-02-04 | - | ➕ Added Sprint 4.5: Swagger |
| 2026-02-04 | - | ➕ Moved AI Tagging to Sprint 5 |
| 2026-02-04 | Sprint 5 | ✅ BullMQ, Redis, Image Worker, AI Tagging, Hotfixes |

---

## 🚀 NEXT ACTION

**Tuần tiếp theo:**
1. [ ] **Search Engine** - Bắt đầu Sprint 6
2. [ ] **Meilisearch Sync** - Worker sync to search

**Command:**
```bash
# Meilisearch (đã có trong docker-compose)
# Cần cài client
cd backend && pnpm add meilisearch @meilisearch/instant-meilisearch
```

---

## 🔗 Quick Links

- [Quick Start Guide](./QUICK_START.md)
- [NestJS Module Guide](./HOWTO_NESTJS_MODULES.md)
- [Docker Guide](./DOCKER_GUIDE.md)
- [Testing Guide](./TESTING_QUICK_START.md)
