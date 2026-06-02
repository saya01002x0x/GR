# 📚 NestJS Knowledge Guide

Tổng hợp các khái niệm NestJS đã sử dụng trong dự án.

---

#### BullMQ Queue (Background Jobs)
- **Là gì:** Hệ thống hàng đợi (queue) để xử lý công việc bất đồng bộ. BullMQ dùng Redis làm backend.
- **Cách dùng:**
  ```typescript
  // Đăng ký queue trong module
  BullModule.registerQueue({ name: 'stats-queue' });
  
  // Inject và thêm job
  @InjectQueue('stats-queue') private readonly queue: Queue;
  await this.queue.add('job-name', { data }, { jobId: 'unique-id' });
  
  // Processor xử lý job
  @Processor('stats-queue')
  export class MyProcessor extends WorkerHost {
    async process(job: Job) { /* xử lý */ }
  }
  ```
- **Ứng dụng:** Dùng cho counter update (view/like/comment) để giảm latency user request. Job chạy background, không block response.

---

#### @nestjs/schedule (Cron Jobs)
- **Là gì:** Module hỗ trợ lập lịch chạy task tự động (cron jobs, intervals).
- **Cách dùng:**
  ```typescript
  // Import ScheduleModule.forRoot() 1 LẦN DUY NHẤT ở AppModule
  ScheduleModule.forRoot()
  
  // Dùng @Cron decorator
  @Cron('0 3 * * *')  // Chạy lúc 3:00 AM hàng ngày
  async handleTask() { /* logic */ }
  
  @Cron('*/5 * * * * *')  // Mỗi 5 giây
  async handleInterval() { /* logic */ }
  ```
- **Ứng dụng:** ReconciliationTask (3AM sửa counter drift), MeilisearchSyncService (flush buffer mỗi 5s), AutoUnbanTask (mỗi giờ mở ban hết hạn).

---

#### Redis Injection (Custom Provider)
- **Là gì:** Tạo provider tùy chỉnh để inject ioredis client vào bất kỳ service nào.
- **Cách dùng:**
  ```typescript
  // Định nghĩa token
  export const REDIS_CLIENT = 'REDIS_CLIENT';
  
  // Provider factory trong module
  { provide: REDIS_CLIENT, useFactory: (config) => new Redis({...}), inject: [ConfigService] }
  
  // Inject vào service
  @Inject(REDIS_CLIENT) private readonly redis: Redis;
  ```
- **Ứng dụng:** Dùng chung Redis connection cho ViewService (spam lock, view count), MeilisearchSyncService (buffer hash), StatsProcessor (GETDEL).

---

#### Meilisearch Partial Update
- **Là gì:** Cập nhật chỉ một số trường của document trong Meilisearch mà không cần gửi lại toàn bộ document.
- **Cách dùng:**
  ```typescript
  // Chỉ cập nhật likeCount, viewCount — các trường khác giữ nguyên
  await index.updateDocuments([
    { id: 'artwork-123', likeCount: 42, viewCount: 100 }
  ]);
  ```
- **Ứng dụng:** Dùng trong MeilisearchSyncService để chỉ cập nhật stats khi Like/View/Comment thay đổi. Tránh full re-index.

---

#### Fire-and-Forget Pattern
- **Là gì:** Gọi async function nhưng không `await` kết quả. Dùng `.catch(() => {})` để nuốt lỗi.
- **Cách dùng:**
  ```typescript
  // Không block response
  this.viewService.recordView(id, userId, ip).catch(() => {});
  ```
- **Ứng dụng:** View tracking trong ArtworksController — ghi view không block response trả về artwork data.

---

#### Optimistic Response
- **Là gì:** Trả về kết quả dự đoán ngay lập tức cho client, trước khi server xử lý xong hoàn toàn.
- **Cách dùng:**
  ```typescript
  // Trả về count ± 1 ngay, DB sẽ cập nhật async sau
  return { liked: true, likeCount: currentCount + 1 };
  ```
- **Ứng dụng:** Like/Unlike toggle — client nhận ngay likeCount mới (optimistic), counter thực sự được update bất đồng bộ qua BullMQ.

---

#### Interceptors (AOP - Aspect Oriented Programming)
- **Là gì:** Khối logic để chặn (intercept) request/response trước và sau khi nó được xử lý bởi handler (Controller), hữu ích cho logging, mapping, caching, error handling.
- **Cách dùng:**
  ```typescript
  import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';

  @Injectable()
  export class AuditLogInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      return next.handle().pipe(
        tap(() => {
          // Xử lý sau khi controller đã return thành công
          console.log(`Log method: ${request.method}`);
        }),
      );
    }
  }

  // Dùng ở Controller
  @UseInterceptors(AuditLogInterceptor)
  @Controller('admin')
  export class AdminController {}
  ```
- **Ứng dụng:** `AuditLogInterceptor` tự động ghi nhận lại mọi request POST/PUT/PATCH/DELETE từ Admin/Moderator vào Database mà không cần nhúng rườm rà `auditLogService` ở từng route method một.

---

#### Guards (Bảo vệ Route)
- **Là gì:** Lớp (class) dùng để kiểm tra quyền truy cập của request trước khi vào Controller.
- **Cách dùng:**
  ```typescript
  @UseGuards(ClerkGuard)
  @Get('me')
  getMe() {}
  ```
- **Ứng dụng:** `ClerkGuard` xác thực Clerk JWT token và cho phép truy cập nếu hợp lệ.

---

#### Custom Decorators (Param Decorators)
- **Là gì:** Tạo decorator riêng để trích xuất dữ liệu từ request object gọn gàng hơn.
- **Cách dùng:**
  ```typescript
  export const CurrentUser = createParamDecorator((data, ctx) => {
    return ctx.switchToHttp().getRequest().user;
  });
  ```
- **Ứng dụng:** `@CurrentUser()` lấy nhanh thông tin user hiện tại từ request.

---

#### Sharp (Server-side Image Processing)
- **Là gì:** Thư viện xử lý ảnh siêu tốc độ cho Node.js (dựa trên libvips).
- **Cách dùng:**
  ```typescript
  import * as sharp from 'sharp';

  // Resize và làm mờ ảnh (Blur)
  const blurredBuffer = await sharp(imageBuffer)
    .resize(400, 400, { fit: 'inside' })
    .blur(30)
    .jpeg({ quality: 50 })
    .toBuffer();
  ```
- **Ứng dụng:** Dùng trong `StorageService` và `ArtworkProcessor` để tự động tạo bản preview bị làm mờ (blurred preview) cho các ảnh thuộc Tier trả phí (Tier-gated artworks), giúp bảo vệ nội dung gốc khỏi việc bị trích xuất thông qua Client-side DevTools.
