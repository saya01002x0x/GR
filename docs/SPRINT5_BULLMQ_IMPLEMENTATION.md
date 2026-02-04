# Sprint 5: BullMQ Background Jobs Implementation

## Overview
Đã triển khai hệ thống xử lý ảnh background sử dụng **BullMQ**, **Redis**, và chiến thuật **"Raw Upload First"** để tối ưu performance cho NestJS backend.

## Architecture

### "Raw Upload First" Flow
1. **User Upload** -> Controller
2. **Controller**:
   - Upload file gốc (Raw) lên MinIO (`raw/artworks/...`)
   - Tạo DB Record (Status: `PROCESSING`)
   - Đẩy Job vào Queue (`artwork-processing`)
   - Trả về response ngay lập tức (< 200ms)
3. **Worker (Background)**:
   - Download Raw file từ MinIO
   - Check NSFW (NSFWJS model)
   - Resize & Thumbnail (Sharp)
   - Upload file đã tối ưu lên MinIO (`artworks/...`)
   - Update DB (Status: `PUBLISHED` / `FAILED`) - Transactional
   - Cleanup: Xóa file Raw

## Components Implemented

### 1. Queue Infrastructure
- **Module:** `src/modules/queue/queue.module.ts`
- **Constants:** `src/modules/queue/queue.constants.ts`
- **Dashboard:** `/admin/queues` (User: `admin`, Pass: `admin123`)

### 2. Worker Processor
- **File:** `src/modules/queue/processors/artwork.processor.ts`
- **Features:**
  - **Concurrency = 1**: Chỉ xử lý 1 job/lần để bảo vệ RAM.
  - **AI Model Caching**: Load model NSFWJS 1 lần duy nhất khi khởi động.
  - **Auto Cleanup**: Tự động xóa file raw sau khi xử lý xong.
  - **Transaction**: Dùng `prisma.$transaction` để đảm bảo tính toàn vẹn dữ liệu.

### 3. Storage Service Upgrades
- **File:** `src/modules/storage/storage.service.ts`
- **New Methods:** `uploadRaw`, `download`, `deleteFile`.
- **Logic:** Hỗ trợ xử lý file binary stream.

### 4. Database Schema
- Enum `ArtworkStatus`: Thêm `PROCESSING`, `FAILED`.

## Usage Guide

### 1. Monitoring
Truy cập: `http://localhost:3847/admin/queues`
- Xem danh sách active, waiting, failed jobs.
- Retry failed jobs thủ công.

### 2. Error Handling
- Nếu Job Failed (do lỗi mạng, file lỗi...): Status artwork sẽ là `FAILED`.
- User có thể retry (cần implement API retry trong tương lai).

## Dependencies Added
- `@nestjs/bullmq`, `bullmq`, `ioredis`
- `@bull-board/api`, `@bull-board/express`
- `nsfwjs`, `@tensorflow/tfjs-node`
- `uuid`, `@types/uuid`

## Next Steps
- Cần restart backend để Prisma Client cập nhật enum `PROCESSING`, `FAILED`.
- Implement nút "Retry" ở Frontend cho các artwork bị lỗi.
